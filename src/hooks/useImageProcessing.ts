// src/hooks/useImageProcessing.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { useRouter } from 'next/router';
import { UploadedFile } from './useImageUpload';
import { Style } from '@/components/StyleSelectorModal';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePicCoins } from '@/hooks/usePicCoins';

const PICCOINS_PER_TRANSFORMATION = 1;
const MAX_POLL_ATTEMPTS_CONST = 36; // Aprox. 3 minutos (36 * 5s)

// Tipos de status de falha que podem ser definidos na DB
type FailureStatusDB = 
  | 'failed_system' 
  | 'failed_upload' 
  | 'failed_checkout_redirect' // Mantido para consistência, embora menos provável com PicCoins
  | 'failed_db_update'
  | 'failed_payment' // Pode ser usado se o spendCoins falhar por uma razão inesperada
  | 'failed_trigger'; // Novo: se a chamada a /api/process-image falhar

type ProcessingState =
  | 'idle'
  | 'uploading_image'
  | 'creating_job_record'
  | 'checking_balance'
  | 'spending_coins'
  | 'triggering_processing'
  | 'polling_status'
  | 'processing'
  | 'completed'
  | 'error';

type StatusResponse = {
  status?: string;
  output_url?: string | null;
  error_message?: string | null;
  message?: string;
};

type TransformationInsert = {
  user_id: string;
  style_requested: string;
  status: string; 
  input_file_path: string;
};

export type UseImageProcessingResult = ReturnType<typeof useImageProcessing>;

export function useImageProcessing() {
  const { userInfo, isLoading: isAuthLoading } = useAuth();
  const { spendCoins, refetchBalance } = usePicCoins();
  const router = useRouter();

  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const [availableStyles, setAvailableStyles] = useState<Style[]>([]);
  const [stylesLoading, setStylesLoading] = useState<boolean>(true);
  const [stylesError, setStylesError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadAttempted = useRef(false);
  const prevUserId = useRef<string | undefined | null>(null);
  const pollCountRef = useRef(0); // Usar ref para pollCount para não causar re-render desnecessário

  useEffect(() => {
    const fetchStylesHandler = async () => {
      if (availableStyles.length > 0 && !stylesLoading) return;
      setStylesLoading(true);
      setStylesError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('styles').select('*').eq('is_active', true).order('order', { ascending: true });
        if (fetchError) throw fetchError;
        setAvailableStyles(data || []);
      } catch (err: unknown) {
        console.error("❌ Erro ao buscar estilos:", err);
        const errorMessageText = err instanceof Error ? err.message : 'Falha ao carregar estilos.';
        setStylesError(errorMessageText);
        toast.error("Erro ao Carregar Estilos", { description: errorMessageText });
      } finally {
        setStylesLoading(false);
      }
    };
    fetchStylesHandler();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentUserId = userInfo?.id;
    if (prevUserId.current !== undefined && prevUserId.current !== currentUserId) {
      setUploadedImage(null); setSelectedStyle(null); setProcessingState('idle');
      setTransformedImage(null); setErrorMessage(null); setCurrentJobId(null);
      setActiveStep(1); setIsLoading(false);
      localStorage.removeItem('studioState'); localStorage.removeItem('currentJobId');
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    prevUserId.current = currentUserId;
  }, [userInfo?.id]);

  useEffect(() => {
    if (initialLoadAttempted.current || stylesLoading || !availableStyles.length) return;
    initialLoadAttempted.current = true;
    try {
      const savedState = localStorage.getItem('studioState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        const restoredStyleId = parsedState?.selectedStyleId;
        if (restoredStyleId) {
          const style = availableStyles.find(s => s.id === restoredStyleId);
          if (style) setSelectedStyle(style);
          else localStorage.removeItem('studioState');
        }
      }
    } catch (err) {
      console.error("❌ Erro ao carregar estado do localStorage:", err);
      localStorage.removeItem('studioState');
    }
  }, [availableStyles, stylesLoading]);

  useEffect(() => {
    if (!initialLoadAttempted.current) return;
    try {
      const stateToSave = { selectedStyleId: selectedStyle?.id || null };
      localStorage.setItem('studioState', JSON.stringify(stateToSave));
    } catch (err) {
      console.error("❌ Erro ao salvar estado no localStorage:", err);
    }
  }, [selectedStyle]);

  useEffect(() => {
    const POLLING_INTERVAL_MS = 3000; // Reduced from 5s to 3s for faster updates
    
    const checkStatus = async () => {
      if (!currentJobId) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        return;
      }
      if (isAuthLoading) return;
      if (!userInfo) {
        setErrorMessage("Autenticação necessária para verificar o estado.");
        setProcessingState('error'); setActiveStep(3); toast.error("Sessão Expirada", {description: "Faça login para ver o progresso."});
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null; setIsLoading(false);
        return;
      }

      pollCountRef.current++;
      
              try {
          console.log(`[useImageProcessing - Polling] About to fetch status for jobId: ${currentJobId} (attempt ${pollCountRef.current})`); // LOG 1
          
          // Add cache-busting after 10 attempts (30 seconds)
          const cacheParam = pollCountRef.current > 10 ? `&_t=${Date.now()}` : '';
          const response = await fetch(`/api/get-transformation-status?jobId=${currentJobId}${cacheParam}`);
          console.log(`[useImageProcessing - Polling] Response for ${currentJobId} - Status: ${response.status}, OK: ${response.ok}`); // LOG 2
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Erro ${response.status} ao buscar status`}));
          console.error(`[useImageProcessing - Polling] Error data for ${currentJobId}:`, errorData);
          throw new Error(errorData.message || `Erro HTTP ${response.status}`);
        }
        const data: StatusResponse = await response.json();
        console.log(`[useImageProcessing - Polling] Data received for ${currentJobId}:`, JSON.stringify(data, null, 2)); // LOG 3 (JSON.stringify para ver bem)

        if (data.status === 'error' || data.status?.startsWith('failed')) {
          const backendErrorMessage = data.error_message || 'Ocorreu uma falha desconhecida.';
          console.log(`[useImageProcessing - Polling] Job FAILED. Error: ${data.error_message}`); // LOG 5

          // ... (lógica de userFriendlyMessage como antes) ...
          setErrorMessage(backendErrorMessage); // Simplificado para mostrar erro do backend
          setProcessingState('error'); setActiveStep(3); toast.error("Falha na Transformação", {description: backendErrorMessage});
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); setIsLoading(false);
        } else if (data.status === 'completed' && data.output_url) {
          console.log(`[useImageProcessing - Polling] JOB COMPLETED! Output URL: ${data.output_url}`); // LOG 4

          setTransformedImage(data.output_url); setProcessingState('completed'); setActiveStep(3);
          toast.success("Transformação concluída!");
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); setIsLoading(false);
        } else if (['processing', 'processing_queued'].includes(data.status || '')) {
          console.log(`[useImageProcessing - Polling] Job PROCESSING. Status: ${data.status} (attempt ${pollCountRef.current})`); // LOG 6

          // After 10 attempts (30 seconds), try to force refresh or check completed directly
          if (pollCountRef.current >= 10) {
            console.log(`[useImageProcessing - Polling] 🚨 Been polling for 30s. Trying direct status check...`);
            try {
              // Force a fetch with cache-busting and extra query
              const directResponse = await fetch(`/api/get-transformation-status?jobId=${currentJobId}&force=true&_t=${Date.now()}`);
              const directData = await directResponse.json();
              console.log(`[useImageProcessing - Polling] 🔄 Direct check result:`, directData);
              
              if (directData.status === 'completed' && directData.output_url) {
                console.log(`[useImageProcessing - Polling] 🎯 Direct check found completed job!`);
                setTransformedImage(directData.output_url); setProcessingState('completed'); setActiveStep(3);
                toast.success("Transformação concluída!");
                if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); setIsLoading(false);
                return;
              }
            } catch (directError) {
              console.error(`[useImageProcessing - Polling] Error in direct check:`, directError);
            }
          }

          if (processingState !== 'processing') {
            setProcessingState('processing'); setActiveStep(3);
          }
        } else if (data.status && !['idle', 'awaiting_processing', 'paid'].includes(data.status)) { 
             console.warn(`[Polling] Status inesperado: ${data.status || 'vazio'}`);
        }

        if (pollCountRef.current >= MAX_POLL_ATTEMPTS_CONST && 
            (processingState === 'polling_status' || processingState === 'processing')) {
          const timeoutUserMsg = "A sua transformação está a demorar mais que o normal. Verifique em 'Minha Conta' ou tente mais tarde.";
          setErrorMessage(timeoutUserMsg);
          setProcessingState('error'); setActiveStep(3);
          toast.error("Processamento Demorado", { description: timeoutUserMsg });
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); setIsLoading(false);
        }
      } catch (err) { 
        const errorMsg = err instanceof Error ? err.message : "Erro de rede";
        console.error("❌ Network error during status check:", errorMsg);
        setErrorMessage(errorMsg);
        toast.error("Erro de Rede", { description: "Falha ao verificar estado." });
        setProcessingState('error'); setActiveStep(3);
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); setIsLoading(false);
      }
    };

    if (currentJobId && processingState === 'polling_status' && !isAuthLoading && userInfo?.id) {
      if (!pollingIntervalRef.current) {
        pollCountRef.current = 0; 
        checkStatus(); 
        pollingIntervalRef.current = setInterval(checkStatus, POLLING_INTERVAL_MS);
      }
    } else if (pollingIntervalRef.current && processingState !== 'polling_status') {
      clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null;
    }
    return () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); };
  }, [currentJobId, processingState, userInfo, isAuthLoading, setActiveStep, setErrorMessage, setIsLoading, setProcessingState, setTransformedImage]); // Estes setters são estáveis

  const resetAllLocalStates = useCallback(() => {
    setUploadedImage(null); setSelectedStyle(null); setProcessingState('idle');
    setTransformedImage(null); setErrorMessage(null); setCurrentJobId(null);
    setActiveStep(1); setIsLoading(false);
    localStorage.removeItem('studioState'); localStorage.removeItem('currentJobId');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, [setActiveStep, setUploadedImage, setSelectedStyle, setProcessingState, setTransformedImage, setErrorMessage, setCurrentJobId, setIsLoading]); // Adicionado todas as setters que são estáveis

  const handleFileChange = useCallback((newFile: UploadedFile | null) => {
    resetAllLocalStates();
    if (newFile) {
      setUploadedImage(newFile);
      setActiveStep(2);
    } else {
      setActiveStep(1);
    }
  }, [resetAllLocalStates, setActiveStep, setUploadedImage]);

  const openStyleSelector = useCallback(() => {
    if (uploadedImage) {
      setIsStyleModalOpen(true);
    } else {
      toast.error("Por favor, carregue uma imagem primeiro.");
    }
  }, [uploadedImage, setIsStyleModalOpen]); // setIsStyleModalOpen é estável

  const handleStyleSelect = useCallback((style: Style) => {
    console.log('[handleStyleSelect] Style selected:', style.name);
    setSelectedStyle(style);
    setActiveStep(3); 
    setIsStyleModalOpen(false);
    setErrorMessage(null); 
    if (uploadedImage) { 
      console.log('[handleStyleSelect] Setting processingState to idle (user needs to click button)');
      setProcessingState('idle'); // Mudança: não iniciar checking_balance automaticamente
    }
    toast.success(`Estilo "${style.name}" selecionado!`);
  }, [uploadedImage, setActiveStep, setSelectedStyle, setIsStyleModalOpen, setErrorMessage, setProcessingState]);

  const handleStartTransformation = useCallback(async () => {
    console.log('[handleStartTransformation] Starting transformation with:', { 
      hasImage: !!uploadedImage, 
      hasStyle: !!selectedStyle, 
      styleName: selectedStyle?.name,
      isAuthLoading, 
      userId: userInfo?.id 
    });
    
    if (!uploadedImage || !selectedStyle) {
      toast.error("Erro", { description: "Por favor, carregue uma imagem e selecione um estilo." }); return;
    }
    if (isAuthLoading) {
      toast.info("Aguarde", { description: "A verificar autenticação..." }); return;
    }
    if (!userInfo?.id) { 
      toast.error("Autenticação Necessária", { description: "Por favor, faça login para transformar." }); return;
    }

    setIsLoading(true); 
    setProcessingState('checking_balance'); 
    setErrorMessage(null); setTransformedImage(null); setCurrentJobId(null);

    let tempUploadedFilePath: string | null = null;
    let tempNewJobId: string | null = null;

    try {
      await refetchBalance(); 
      
      // A leitura do 'balance' aqui pode não pegar o valor atualizado pelo refetchBalance imediatamente
      // se o estado não for atualizado sincronamente. Para ser mais seguro, idealmente
      // refetchBalance retornaria o novo saldo ou o `usePicCoins` usaria um padrão para
      // garantir que o `balance` está atualizado antes desta verificação.
      // Por agora, vamos assumir que o `balance` lido do `usePicCoins` está suficientemente atualizado.
      // Numa próxima refatoração, poderíamos fazer `refetchBalance` retornar o valor.

      // É preciso aceder ao estado `balance` mais recente.
      // A chamada `refetchBalance` acima vai buscar, mas o estado `balance` só atualiza no próximo render.
      // Uma forma de contornar isto para esta função é buscar o saldo novamente aqui, ou confiar no refetch e UX.
      // Para simplificar, vamos buscar de novo, mas não é o ideal para performance.
      const balanceResponse = await fetch('/api/piccoins/balance');
      if(!balanceResponse.ok) throw new Error("Falha ao verificar saldo atualizado.");
      const currentBalanceData = await balanceResponse.json();
      const currentFreshBalance = currentBalanceData.balance;


      if (currentFreshBalance >= PICCOINS_PER_TRANSFORMATION) {
        toast.info("💰 Usando PicCoins...", { description: "A preparar a sua transformação." });
        
        setProcessingState('uploading_image');
        const imageFile = uploadedImage.file; // Usar a variável imageFile
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'tmp';
        const filePath = `public/${userInfo.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images').upload(filePath, imageFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(uploadError.message || "Falha ao fazer upload da imagem.");
        if (!uploadData?.path) throw new Error("Falha ao obter o caminho da imagem após upload.");
        tempUploadedFilePath = uploadData.path;
        
        setProcessingState('creating_job_record');
        const transformationData: TransformationInsert = { 
          user_id: userInfo.id, style_requested: selectedStyle.id, 
          status: 'awaiting_processing', input_file_path: tempUploadedFilePath
        };
        const { data: jobData, error: jobError } = await supabase
          .from('transformations').insert(transformationData).select('id').single();
        
        if (jobError || !jobData?.id) {
          if (tempUploadedFilePath) { 
            supabase.storage.from('images').remove([tempUploadedFilePath])
              .catch(delErr => console.error(`Falha ao apagar imagem órfã ${tempUploadedFilePath}:`, delErr));
          }
          throw new Error(jobError?.message || "Falha ao criar o registo da transformação.");
        }
        tempNewJobId = jobData.id;
        
        setProcessingState('spending_coins');
        await spendCoins(PICCOINS_PER_TRANSFORMATION, tempNewJobId);
        
        setProcessingState('triggering_processing');
        const processImageResponse = await fetch('/api/process-image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: tempNewJobId }),
        });

        if (!processImageResponse.ok) {
          const errorBody = await processImageResponse.json().catch(() => ({message: "Erro ao acionar processamento."}));
          await supabase.from('transformations')
            .update({ status: 'failed_trigger' as FailureStatusDB, error_message: `Falha ao acionar /api/process-image: ${errorBody.message}`.substring(0,500) }) 
            .eq('id', tempNewJobId);
          throw new Error(`Falha ao iniciar o processamento: ${errorBody.message}`);
        }
        
        localStorage.setItem('currentJobId', tempNewJobId);
        setCurrentJobId(tempNewJobId);
        setProcessingState('polling_status'); 
        setActiveStep(3);
        toast.success("✨ Transformação Iniciada!", { description: "Os seus PicCoins foram usados." });
        
      } else {
        toast.warning("💰 Saldo de PicCoins Insuficiente!", { 
          description: `Precisas de ${PICCOINS_PER_TRANSFORMATION} PicCoin (tens ${currentFreshBalance}). A redirecionar...` 
        });
        setProcessingState('idle'); setIsLoading(false);
        setTimeout(() => { router.push('/pricing?from=studio'); }, 2500);
        return;
      }

    } catch (err) { // Renomeado para err para evitar conflito com stylesError
      const errorMsg = err instanceof Error ? err.message : 'Falha desconhecida.';
      setErrorMessage(errorMsg); toast.error("Erro no Processo", { description: errorMsg });
      setProcessingState('error'); setActiveStep(3); 
      
      if (tempNewJobId && processingState !== 'polling_status' && processingState !== 'processing' && processingState !== 'completed') {
          localStorage.removeItem('currentJobId'); setCurrentJobId(null);
      }

      if (tempNewJobId) {
        try { 
          let failureStatus: FailureStatusDB = 'failed_system'; 
          if (errorMsg.toLowerCase().includes('upload')) failureStatus = 'failed_upload';
          else if (errorMsg.toLowerCase().includes('piccoins') || errorMsg.toLowerCase().includes('saldo')) failureStatus = 'failed_payment';
          else if (errorMsg.toLowerCase().includes('job') || errorMsg.toLowerCase().includes('registo')) failureStatus = 'failed_db_update';
          
          await supabase.from('transformations')
            .update({ status: failureStatus, error_message: errorMsg.substring(0,500) }) 
            .eq('id', tempNewJobId);
        } catch (updateDbErr) {  // Renomeado para evitar conflito
          console.error("Falha ao atualizar status do job para erro na DB:", updateDbErr); 
        }
      }
    } finally {
      if (!['polling_status', 'triggering_processing', 'spending_coins', 'creating_job_record', 'uploading_image'].includes(processingState) && processingState !== 'completed') {
        setIsLoading(false);
      }
    }
  }, [
    uploadedImage, selectedStyle, userInfo, isAuthLoading, 
    spendCoins, refetchBalance, router
    // Removed processingState to prevent unnecessary re-creations
    // setActiveStep, setErrorMessage, etc. são estáveis
  ]);

  const handleNewImage = useCallback(() => { resetAllLocalStates(); }, [resetAllLocalStates]);
  const handleReset = useCallback(() => { handleNewImage(); }, [handleNewImage]);
  const handleDownload = useCallback(() => { /* ... */ }, [transformedImage, currentJobId]);

  return {
    uploadedImage, isStyleModalOpen, selectedStyle, processingState, transformedImage,
    activeStep, isLoading, errorMessage, currentJobId,
    availableStyles, stylesLoading, stylesError,
    setIsStyleModalOpen, setActiveStep, 
    handleFileChange, openStyleSelector, handleStyleSelect,
    handleStartTransformation,
    handleReset, handleNewImage, handleDownload
  };
}

