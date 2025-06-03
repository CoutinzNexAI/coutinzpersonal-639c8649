import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { useRouter } from 'next/router';
import { UploadedFile } from './useImageUpload'; // Assuming this path is correct
import { Style } from '@/components/StyleSelectorModal'; // Assuming this path is correct
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePicCoins } from '@/hooks/usePicCoins';

const PICCOINS_PER_TRANSFORMATION = 1;
const MAX_POLL_ATTEMPTS_CONST = 36; // 36 * 10s = 360s = 6 minutos (buffer para Vercel Pro 5min)
const POLLING_INTERVAL_MS = 10000; // Intervalo de polling (10 segundos) - menos agressivo

// Mensagens de erro padronizadas
const STANDARD_ERROR_MESSAGE = "Pedimos desculpa, não foi possível processar a sua imagem.";
const SIMPLE_ERROR_TOAST_MESSAGE = "Falha na transformação. O seu crédito será devolvido automaticamente.";

// Tipos de status de falha que podem ser definidos na DB
type FailureStatusDB = 
  | 'failed_system' 
  | 'failed_upload' 
  | 'failed_checkout_redirect'
  | 'failed_db_update'
  | 'failed_payment'
  | 'failed_trigger'
  | 'failed_timeout_server';

type ProcessingState =
  | 'idle'
  | 'uploading_image'
  | 'creating_job_record'
  | 'checking_balance'
  | 'spending_coins'
  | 'triggering_processing'
  | 'polling_status' // Estado inicial para começar o polling
  | 'processing'     // Estado enquanto a API retorna 'processing' ou 'processing_queued'
  | 'completed'
  | 'error';

type StatusResponse = {
  status?: string;
  output_url?: string | null;
  error_message?: string | null;
  message?: string;
  // Campos de debug que podem vir da API get-transformation-status
  debug_db_read_at?: string;
  debug_self_heal_triggered?: string;
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
  const { spendCoins, refundCoins, refetchBalance } = usePicCoins();
  const router = useRouter();

  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // Usado para o loading geral do botão/UI
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [simulatedProgress, setSimulatedProgress] = useState<number>(0); // Nova state para progresso simulado
  const [currentRating, setCurrentRating] = useState<number>(0); // Novo estado para o rating da transformação atual

  const [availableStyles, setAvailableStyles] = useState<Style[]>([]);
  const [stylesLoading, setStylesLoading] = useState<boolean>(true);
  const [stylesError, setStylesError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadAttempted = useRef(false);
  const prevUserId = useRef<string | undefined | null>(null);
  const pollCountRef = useRef(0);

  // Função para calcular progresso simulado baseado nas tentativas
  const calculateSimulatedProgress = useCallback((pollCount: number): number => {
    if (pollCount === 0) return 0;
    
    // Fórmula de progresso simulado:
    // - Inicia com 5% na primeira tentativa
    // - Cresce rapidamente até 30% nos primeiros 30s
    // - Cresce moderadamente até 70% nos próximos 2min
    // - Cresce lentamente até 95% no resto do tempo
    // - Nunca chega a 100% (só quando realmente completa)
    
    if (pollCount <= 3) {
      // Primeiros 30s: 5% -> 30%
      return 5 + (pollCount * 8);
    } else if (pollCount <= 12) {
      // 30s -> 2min: 30% -> 70%
      return 30 + ((pollCount - 3) * 4.5);
    } else if (pollCount <= 30) {
      // 2min -> 5min: 70% -> 90%
      return 70 + ((pollCount - 12) * 1.1);
    } else {
      // 5min+: 90% -> 95% (muito lento)
      return Math.min(95, 90 + ((pollCount - 30) * 0.5));
    }
  }, []);

  // Função para buscar o rating da transformação
  const fetchTransformationRating = useCallback(async (jobId: string) => {
    if (!userInfo?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('transformations')
        .select('user_rating')
        .eq('id', jobId)
        .eq('user_id', userInfo.id)
        .single();
      
      if (!error && data) {
        setCurrentRating(data.user_rating || 0);
      }
    } catch (error) {
      console.error('[useImageProcessing] Error fetching rating:', error);
    }
  }, [userInfo?.id]);

  // Fetch available styles
  useEffect(() => {
    const fetchStylesHandler = async () => {
      if (availableStyles.length > 0 && !stylesLoading) return;
      setStylesLoading(true);
      setStylesError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('styles')
          .select('*')
          .eq('is_active', true)
          .order('order', { ascending: true });
        if (fetchError) throw fetchError;
        setAvailableStyles(data || []);
      } catch (err: unknown) {
        console.error("❌ [useImageProcessing] Erro ao buscar estilos:", err);
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

  // Reset state if user changes
  useEffect(() => {
    const currentUserId = userInfo?.id;
    if (prevUserId.current !== undefined && prevUserId.current !== currentUserId) {
        setUploadedImage(null);
        setSelectedStyle(null);
        setProcessingState('idle');
        setTransformedImage(null);
        setErrorMessage(null);
        setCurrentJobId(null);
        setActiveStep(1);
        setIsLoading(false);
        localStorage.removeItem('studioState');
        localStorage.removeItem('currentJobId');
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
      pollCountRef.current = 0;
    }
    prevUserId.current = currentUserId;
  }, [userInfo?.id]);

  // Restore selected style from localStorage
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
                if (style) {
                    setSelectedStyle(style);
                } else {
                    localStorage.removeItem('studioState');
            }
        }
        }
    } catch (err) {
      console.error("❌ [useImageProcessing] Erro ao carregar estado do localStorage:", err);
        localStorage.removeItem('studioState');
    }
  }, [availableStyles, stylesLoading]);

  // Save selected style to localStorage
  useEffect(() => {
    if (!initialLoadAttempted.current) return; 
    try {
        const stateToSave = { selectedStyleId: selectedStyle?.id || null };
        localStorage.setItem('studioState', JSON.stringify(stateToSave));
    } catch (err) {
      console.error("❌ [useImageProcessing] Erro ao salvar estado no localStorage:", err);
    }
  }, [selectedStyle]);

  // Função para processar reembolso automático
  const handleRefund = useCallback(async (jobId: string) => {
    if (!jobId || !userInfo?.id) return;
    
    try {
      console.log(`[useImageProcessing] Attempting refund for job ${jobId}`);
      await refundCoins(jobId, PICCOINS_PER_TRANSFORMATION);
      await refetchBalance();
      console.log(`[useImageProcessing] Refund successful for job ${jobId}`);
    } catch (refundError) {
      console.error(`[useImageProcessing] Refund failed for job ${jobId}:`, refundError);
      // Don't show toast error for refund failures to avoid confusion
    }
  }, [refundCoins, refetchBalance, userInfo?.id]);

  // Polling Logic useEffect
  useEffect(() => {
    const checkStatus = async () => {
      if (!currentJobId || isAuthLoading || !userInfo) return;

      pollCountRef.current += 1;
      setSimulatedProgress(calculateSimulatedProgress(pollCountRef.current));

      try {
        const cacheParam = pollCountRef.current > 18 ? `&_t=${Date.now()}` : '';
        const userParam = userInfo?.id ? `&userId=${userInfo.id}` : '';
        const apiUrl = `/api/get-transformation-status?jobId=${currentJobId}${userParam}${cacheParam}`;
        
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status} ao buscar status. Sem corpo JSON.` }));
          console.error(`[useImageProcessing - Polling] Error data from API for ${currentJobId}:`, errorData);
          throw new Error(errorData.message || `Erro HTTP ${response.status}`);
        }

        const data: StatusResponse = await response.json();
        
        if (data.status === 'error' || data.status?.startsWith('failed')) {
          console.log(`[useImageProcessing] Error detected, initiating refund for job ${currentJobId}`);
          
          setErrorMessage(STANDARD_ERROR_MESSAGE);
          setProcessingState('error');
          setActiveStep(3);
          toast.error("Falha na Transformação", {description: SIMPLE_ERROR_TOAST_MESSAGE});

          // Process refund automatically
          await handleRefund(currentJobId);

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsLoading(false);
        } else if (data.status === 'completed' && data.output_url) {
          setTransformedImage(data.output_url);
          setProcessingState('completed');
          setActiveStep(3);
          setSimulatedProgress(100);
          toast.success("Transformação concluída!");
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsLoading(false);
          fetchTransformationRating(currentJobId);
        } else if (['processing', 'processing_queued'].includes(data.status || '')) {
          if (processingState !== 'processing') { 
            setProcessingState('processing'); 
          }
        } else if (data.status) { 
          console.warn(`[useImageProcessing - Polling] Status inesperado da API: ${data.status || 'vazio'}. JobId: ${currentJobId}`);
        } else {
          console.warn(`[useImageProcessing - Polling] API returned no status for JobId: ${currentJobId}. Response:`, data);
        }
      } catch (apiError) { 
        const errorMsg = apiError instanceof Error ? apiError.message : "Erro de rede ou formato de resposta inválido.";
        console.error(`[useImageProcessing - Polling] ❌ API call error for ${currentJobId}:`, errorMsg);
      }

      if (pollCountRef.current >= MAX_POLL_ATTEMPTS_CONST && 
          (processingState === 'polling_status' || processingState === 'processing')) {
        console.warn(`[useImageProcessing - Polling] Max attempts reached (${pollCountRef.current}). Trying final direct storage check...`);
        
        try { 
          const finalStoragePath = `public/${userInfo.id}/${currentJobId}`;
          const { data: files, error: finalLisError } = await supabase.storage.from('results').list(finalStoragePath, {
            limit: 1,
            sortBy: { column: 'name', order: 'desc' },
          });

          if(finalLisError){
            console.error(`[useImageProcessing - FinalCheck] Error listing files in ${finalStoragePath}:`, finalLisError.message);
          } else if (files && files.length > 0) {
            const fileName = files[0].name;
            const { data: urlData } = supabase.storage.from('results').getPublicUrl(`${finalStoragePath}/${fileName}`);
            
            if (urlData?.publicUrl) {
              setTransformedImage(urlData.publicUrl); 
              setProcessingState('completed'); 
              setActiveStep(3); 
              setSimulatedProgress(100);
              toast.success("Transformação encontrada após verificação final!");
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setIsLoading(false);
              fetchTransformationRating(currentJobId);
              return;
            }
          }
        } catch (finalStorageError) {
          console.error(`[useImageProcessing - FinalCheck] Final storage check failed:`, finalStorageError instanceof Error ? finalStorageError.message : String(finalStorageError));
        }
        
        console.warn(`[useImageProcessing - Polling] Max attempts reached (${pollCountRef.current}). Final direct storage check failed or API timed out after 6 minutes.`);
        console.log(`[useImageProcessing] Timeout detected, initiating refund for job ${currentJobId}`);

        setErrorMessage(STANDARD_ERROR_MESSAGE);
        setProcessingState('error'); 
        setActiveStep(3);
        toast.error("Processamento Demorado", { description: "A transformação demorou mais que o esperado. O seu crédito será devolvido automaticamente.", duration: 7000 });

        // Process refund for timeout
        await handleRefund(currentJobId);

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsLoading(false);
      }
    }; 

    if (currentJobId && 
        userInfo?.id && 
        !isAuthLoading && 
        (processingState === 'polling_status' || processingState === 'processing')) { // <<< CONDIÇÃO CORRIGIDA AQUI
      if (!pollingIntervalRef.current) {
        pollCountRef.current = 0; 
        checkStatus(); 
        pollingIntervalRef.current = setInterval(checkStatus, POLLING_INTERVAL_MS);
      }
    } 
    else if (pollingIntervalRef.current && 
             !(processingState === 'polling_status' || processingState === 'processing')) { // <<< CONDIÇÃO CORRIGIDA AQUI
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      }
    else if (!currentJobId && pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current); 
        pollingIntervalRef.current = null;
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentJobId, processingState, userInfo, isAuthLoading, setActiveStep, setErrorMessage, setIsLoading, setProcessingState, setTransformedImage, fetchTransformationRating, handleRefund]);


  const resetAllLocalStates = useCallback(() => {
    setUploadedImage(null);
    setSelectedStyle(null);
    setProcessingState('idle');
    setTransformedImage(null);
    setErrorMessage(null);
    setCurrentJobId(null);
    setActiveStep(1);
    setIsLoading(false);
    setSimulatedProgress(0); // Reset do progresso simulado
    setCurrentRating(0); // Reset do rating
    localStorage.removeItem('studioState');
    localStorage.removeItem('currentJobId');
    if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
    }
    pollCountRef.current = 0; 
  }, [setActiveStep, setErrorMessage, setIsLoading, setCurrentJobId, setProcessingState, setSelectedStyle, setTransformedImage]); 

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
  }, [uploadedImage, setIsStyleModalOpen]); 

  const handleStyleSelect = useCallback((style: Style) => {
    setSelectedStyle(style);
    setActiveStep(3); 
    setIsStyleModalOpen(false);
    setErrorMessage(null); 
    setProcessingState('idle'); 
    toast.success(`Estilo "${style.name}" selecionado!`);
  }, [setActiveStep, setSelectedStyle, setIsStyleModalOpen, setErrorMessage, setProcessingState]); 


  const handleStartTransformation = useCallback(async () => {
    console.log('[useImageProcessing - handleStartTransformation] Attempting to start transformation. Current state:', { 
      hasImage: !!uploadedImage, 
      hasStyle: !!selectedStyle, 
      styleName: selectedStyle?.name,
      isAuthLoading, 
      userId: userInfo?.id,
      currentProcessingState: processingState 
    });
    
    if (!uploadedImage || !selectedStyle) {
      toast.error("Erro de Preparação", { description: "Por favor, carregue uma imagem e selecione um estilo antes de transformar." }); 
      return;
    }
    if (isAuthLoading) {
      toast.info("Aguarde...", { description: "A verificar autenticação do utilizador." }); 
      return;
    }
    if (!userInfo?.id) { 
      toast.error("Autenticação Necessária", { description: "Por favor, faça login para transformar as suas imagens." }); 
      return;
    }

    if (!['idle', 'error', 'completed'].includes(processingState)) {
        console.warn(`[useImageProcessing - handleStartTransformation] Transformation already in progress or in a non-startable state: ${processingState}. Aborting.`);
        toast.info("Processo em Andamento", { description: "Uma transformação já está em curso ou a finalizar." });
        return;
    }

    setIsLoading(true);
    setProcessingState('checking_balance'); 
    setErrorMessage(null);
    setTransformedImage(null); 
    setCurrentJobId(null); 
    setSimulatedProgress(0); // Reset progresso para nova transformação
    pollCountRef.current = 0; 

    let tempUploadedFilePath: string | null = null;
    let tempNewJobId: string | null = null;

    try {
      await refetchBalance(); 
      
      const balanceResponse = await fetch('/api/piccoins/balance');
      if(!balanceResponse.ok) {
        const errorData = await balanceResponse.json().catch(() => ({message: "Falha ao obter saldo."}));
        throw new Error(errorData.message || "Falha ao verificar saldo atualizado.");
      }
      const currentBalanceData = await balanceResponse.json();
      const currentFreshBalance = currentBalanceData.balance;

      if (currentFreshBalance >= PICCOINS_PER_TRANSFORMATION) {
        toast.info("💰 Usando PicCoins...", { description: `A preparar a sua transformação. Saldo: ${currentFreshBalance}` });
        
        setProcessingState('uploading_image');
        const imageFile = uploadedImage.file;
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'tmp';
      const filePath = `public/${userInfo.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images').upload(filePath, imageFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(uploadError.message || "Falha ao fazer upload da imagem para o storage.");
      if (!uploadData?.path) throw new Error("Falha ao obter o caminho da imagem após upload.");
      tempUploadedFilePath = uploadData.path;
      
        setProcessingState('creating_job_record');
      const transformationData: TransformationInsert = { 
          user_id: userInfo.id, 
          style_requested: selectedStyle.id, 
          status: 'awaiting_processing', 
          input_file_path: tempUploadedFilePath
      };
      const { data: jobData, error: jobError } = await supabase
        .from('transformations').insert(transformationData).select('id').single();
        
      if (jobError || !jobData?.id) {
        if (tempUploadedFilePath) { 
          supabase.storage.from('images').remove([tempUploadedFilePath])
              .catch(delErr => console.error(`[Cleanup] Falha ao apagar imagem órfã ${tempUploadedFilePath}:`, delErr));
        }
          throw new Error(jobError?.message || "Falha ao criar o registo da transformação na base de dados.");
      }
      tempNewJobId = jobData.id;
        
        setProcessingState('spending_coins');
        await spendCoins(PICCOINS_PER_TRANSFORMATION, tempNewJobId); 
        
        setProcessingState('triggering_processing');
        
        // A CHAMADA AO /api/process-image NÃO ENVIA MAIS O X-Internal-Secret
        const processImageResponse = await fetch('/api/process-image', {
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json'
            // X-Internal-Secret removido daqui
          },
          body: JSON.stringify({ jobId: tempNewJobId }),
        });

        if (!processImageResponse.ok) {
          const errorBody = await processImageResponse.json().catch(() => ({message: "Erro desconhecido ao acionar o processamento da imagem."}));
          await supabase.from('transformations')
            .update({ status: 'failed_trigger' as FailureStatusDB, error_message: `Falha ao acionar /api/process-image: ${errorBody.message}`.substring(0,500) }) 
            .eq('id', tempNewJobId);
          throw new Error(`Falha ao iniciar o processamento no backend: ${errorBody.message}`);
        }
      
      localStorage.setItem('currentJobId', tempNewJobId);
      setCurrentJobId(tempNewJobId); 
        setProcessingState('polling_status'); 
        setActiveStep(3); 
        toast.success("✨ Transformação Iniciada!", { description: "A sua imagem está a ser processada. Pode acompanhar aqui ou voltar mais tarde." });
        
      } else { 
        toast.warning("💰 Saldo de PicCoins Insuficiente!", { 
          description: `Precisas de ${PICCOINS_PER_TRANSFORMATION} PicCoin para esta transformação (saldo atual: ${currentFreshBalance}). Vamos redirecionar para a página de compra.`,
          duration: 5000
        });
        setProcessingState('idle'); 
        setIsLoading(false);
        setTimeout(() => { router.push('/pricing?from=studio&reason=insufficient_balance'); }, 3000);
        return;
      }

    } catch (err) { 
      const errorMsg = err instanceof Error ? err.message : 'Ocorreu uma falha desconhecida durante o início da transformação.';
      console.error("[useImageProcessing - handleStartTransformation] Error caught:", err);

      // Process refund if job was created and coins were spent
      if (tempNewJobId && processingState !== 'checking_balance' && processingState !== 'idle') {
        console.log(`[useImageProcessing] Start error detected, initiating refund for job ${tempNewJobId}`);
        await handleRefund(tempNewJobId);
      }

      if (processingState !== 'checking_balance' && processingState !== 'idle') {
        setErrorMessage(STANDARD_ERROR_MESSAGE);
        toast.error("Erro no Processo", { description: SIMPLE_ERROR_TOAST_MESSAGE });
      } else {
        setErrorMessage(errorMsg);
        toast.error("Erro no Processo", { description: errorMsg });
      }

      setProcessingState('error'); 
      setActiveStep(3);
      
      // ... (lógica para atualizar job na BD para erro, se tempNewJobId existir) ...
      if (tempNewJobId) {
        try { 
          let failureStatus: FailureStatusDB = 'failed_system'; 
          if (errorMsg.toLowerCase().includes('upload')) failureStatus = 'failed_upload';
          else if (errorMsg.toLowerCase().includes('piccoins') || errorMsg.toLowerCase().includes('saldo')) failureStatus = 'failed_payment';
          else if (errorMsg.toLowerCase().includes('job') || errorMsg.toLowerCase().includes('registo')) failureStatus = 'failed_db_update';
          else if (errorMsg.toLowerCase().includes('trigger') || errorMsg.toLowerCase().includes('backend')) failureStatus = 'failed_trigger';
          
          await supabase.from('transformations')
            .update({ status: failureStatus, error_message: errorMsg.substring(0,500), completed_at: new Date().toISOString() }) 
            .eq('id', tempNewJobId);
        } catch (updateDbErr) {
          console.error("[useImageProcessing - handleStartTransformation] Falha ao atualizar status do job para erro na DB:", updateDbErr); 
        }
      }
    } finally {
      if (!['polling_status', 'processing', 'checking_balance', 'uploading_image', 'creating_job_record', 'spending_coins', 'triggering_processing'].includes(processingState) ) {
         setIsLoading(false);
        }
    }
  }, [
    uploadedImage, selectedStyle, userInfo, isAuthLoading, processingState, 
    spendCoins, refetchBalance, router, handleRefund,
    setActiveStep, setErrorMessage, setIsLoading, setProcessingState, setCurrentJobId, setTransformedImage 
  ]);

  const handleNewImage = useCallback(() => {
    resetAllLocalStates();
  }, [resetAllLocalStates]);

  const handleReset = useCallback(() => {
    handleNewImage();
  }, [handleNewImage]);

  const handleDownload = useCallback(async () => {
    if (!transformedImage) {
      toast.error("Nenhuma imagem transformada para baixar.");
      console.warn('[handleDownload] No transformed image available');
      return;
    }

    try {
      // Fazer fetch da imagem
      const response = await fetch(transformedImage);
      if (!response.ok) {
        throw new Error('Falha ao baixar imagem');
      }
      
      // Converter para blob
      const blob = await response.blob();
      
      // Criar URL temporário
      const url = window.URL.createObjectURL(blob);
      
      // Criar elemento de link temporário para download
      const link = document.createElement('a');
      link.href = url;
      
      // Gerar nome do arquivo com timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const styleName = selectedStyle?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'transformacao';
      link.download = `pictuz_${styleName}_${timestamp}.jpg`;
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporário
      window.URL.revokeObjectURL(url);
      
      toast.success("✅ Imagem baixada com sucesso!");
    } catch (error) {
      console.error('[handleDownload] Erro ao baixar imagem:', error);
      toast.error("❌ Erro ao baixar imagem. Tente novamente.");
      
      // Fallback - abrir em nova aba se download direto falhar
      window.open(transformedImage, '_blank', 'noopener,noreferrer');
      toast.info("📱 Imagem aberta em nova aba para download manual");
    }
  }, [transformedImage, selectedStyle]);

  return {
    uploadedImage, isStyleModalOpen, selectedStyle, processingState, transformedImage,
    activeStep, isLoading, errorMessage, currentJobId, simulatedProgress, currentRating,
    availableStyles, stylesLoading, stylesError,
    setIsStyleModalOpen, setActiveStep, 
    handleFileChange, openStyleSelector, handleStyleSelect,
    handleStartTransformation,
    handleReset, handleNewImage, handleDownload
  };
}
