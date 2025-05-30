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
const STANDARD_ERROR_MESSAGE = "Ocorreu um erro a processar. Os nossos servidores podem estar com muito tráfego ou a sua imagem demorou demasiado. Por favor, tente novamente mais tarde. O seu crédito será reembolsado ou a fotografia aparecerá no seu perfil em breve. Pedimos desculpa!";
const SIMPLE_ERROR_TOAST_MESSAGE = "Falha na transformação. Por favor, tente novamente.";

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
  const { spendCoins, refetchBalance } = usePicCoins();
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

  // Fetch available styles
  useEffect(() => {
    const fetchStylesHandler = async () => {
      if (availableStyles.length > 0 && !stylesLoading) return;
      console.log("[useImageProcessing] Fetching styles...");
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
        console.log("[useImageProcessing] Styles fetched successfully:", data?.length || 0);
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
      console.log("[useImageProcessing] User changed. Resetting state.");
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
    console.log("[useImageProcessing] Attempting to restore state from localStorage.");
    try {
        const savedState = localStorage.getItem('studioState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            const restoredStyleId = parsedState?.selectedStyleId;
        if (restoredStyleId) {
                const style = availableStyles.find(s => s.id === restoredStyleId);
                if (style) {
                    setSelectedStyle(style);
            console.log("[useImageProcessing] Restored selected style:", style.name);
                } else {
                    localStorage.removeItem('studioState');
            console.log("[useImageProcessing] Restored style ID not found in available styles. Cleared saved state.");
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

  // Polling Logic useEffect
  useEffect(() => {
    const checkStatus = async () => {
      if (!currentJobId || !userInfo?.id) {
        console.warn(`[useImageProcessing - Polling] checkStatus: Conditions not met for polling (JobId: ${currentJobId}, UserInfo: ${!!userInfo?.id}). Clearing interval.`);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (!userInfo?.id && currentJobId) {
            setErrorMessage("Sessão inválida. Por favor, faça login novamente.");
            setProcessingState('error');
        setIsLoading(false);
        }
        return;
      }

      if (isAuthLoading) {
        console.log("[useImageProcessing - Polling] checkStatus: Auth is loading, skipping poll attempt.");
        return;
      }

      pollCountRef.current++;
      console.log(`[useImageProcessing - Polling] Attempt ${pollCountRef.current}/${MAX_POLL_ATTEMPTS_CONST} for jobId: ${currentJobId}`);

      // Atualizar progresso simulado
      const newProgress = calculateSimulatedProgress(pollCountRef.current);
      setSimulatedProgress(newProgress);
      console.log(`[useImageProcessing - Progress] Poll ${pollCountRef.current}: ${newProgress.toFixed(1)}%`);

      const shouldDirectCheck = (pollCountRef.current <= 3) || // Primeiras 3 tentativas (0-30s)
                                (pollCountRef.current > 3 && pollCountRef.current <= 12 && pollCountRef.current % 2 === 0) || // A cada 20s até 2min
                                (pollCountRef.current > 12 && pollCountRef.current % 3 === 0); // A cada 30s depois dos 2min

      if (shouldDirectCheck) {
        console.log(`[useImageProcessing - DirectCheck] Attempt ${pollCountRef.current}: Checking Supabase storage directly...`);
      try {
          const storagePath = `public/${userInfo.id}/${currentJobId}`;
          const { data: files, error: listError } = await supabase.storage.from('results').list(storagePath, {
            limit: 1,
            sortBy: { column: 'name', order: 'desc' },
          });

          if (listError) {
            console.error(`[useImageProcessing - DirectCheck] Error listing files in ${storagePath}:`, listError.message);
          } else if (files && files.length > 0) {
            const fileName = files[0].name;
            console.log(`🎯 [useImageProcessing - DirectCheck] FOUND image in storage: ${fileName}`);
            const { data: urlData } = supabase.storage.from('results').getPublicUrl(`${storagePath}/${fileName}`);
            
            if (urlData?.publicUrl) {
              console.log(`🎯 [useImageProcessing - DirectCheck] Generated URL: ${urlData.publicUrl}`);
              setTransformedImage(urlData.publicUrl); 
              setProcessingState('completed'); 
              setActiveStep(3); 
              setSimulatedProgress(100); // Progresso completo!
              toast.success("Transformação encontrada diretamente no storage!");
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setIsLoading(false); 
                return;
            } else {
              console.warn(`[useImageProcessing - DirectCheck] Could not get public URL for ${fileName}`);
            }
          } else {
            console.log(`[useImageProcessing - DirectCheck] No files found in storage path: ${storagePath}`);
          }
        } catch (storageError) {
          console.error(`[useImageProcessing - DirectCheck] Storage check failed:`, storageError instanceof Error ? storageError.message : String(storageError));
        }
      }
      
      try {
        const cacheParam = pollCountRef.current > 18 ? `&_t=${Date.now()}` : '';
        const userParam = userInfo?.id ? `&userId=${userInfo.id}` : '';
        const apiUrl = `/api/get-transformation-status?jobId=${currentJobId}${userParam}${cacheParam}`;
        console.log(`[useImageProcessing - Polling] Fetching API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        console.log(`[useImageProcessing - Polling] Response for ${currentJobId} - Status: ${response.status}, OK: ${response.ok}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status} ao buscar status. Sem corpo JSON.` }));
          console.error(`[useImageProcessing - Polling] Error data from API for ${currentJobId}:`, errorData);
          throw new Error(errorData.message || `Erro HTTP ${response.status}`);
        }

        const data: StatusResponse = await response.json();
        console.log(`[useImageProcessing - Polling] Data received from API for ${currentJobId}:`, JSON.stringify(data, null, 2));
        
        if (data.status === 'error' || data.status?.startsWith('failed')) {
          const backendErrorMessage = data.error_message || 'Falha desconhecida no backend.';
          console.log(`[useImageProcessing - Polling] Job FAILED via API. Status: ${data.status}, Backend Msg: ${backendErrorMessage}`);

          setErrorMessage(STANDARD_ERROR_MESSAGE); // <<< USA A MENSAGEM PADRÃO
            setProcessingState('error');
            setActiveStep(3);
          toast.error("Falha na Transformação", {description: SIMPLE_ERROR_TOAST_MESSAGE}); // Toast simples

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsLoading(false);
        } else if (data.status === 'completed' && data.output_url) {
          console.log(`[useImageProcessing - Polling] JOB COMPLETED via API! Output URL: ${data.output_url}`);
          setTransformedImage(data.output_url);
          setProcessingState('completed');
          setActiveStep(3);
          setSimulatedProgress(100); // Progresso completo!
          toast.success("Transformação concluída!");
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsLoading(false);
        } else if (['processing', 'processing_queued'].includes(data.status || '')) {
          console.log(`[useImageProcessing - Polling] Job still PROCESSING via API. Status: ${data.status}`);
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
            console.log(`🎯 [useImageProcessing - FinalCheck] FOUND image in final check: ${fileName}`);
            const { data: urlData } = supabase.storage.from('results').getPublicUrl(`${finalStoragePath}/${fileName}`);
            
            if (urlData?.publicUrl) {
              console.log(`🎯 [useImageProcessing - FinalCheck] Success in final check: ${urlData.publicUrl}`);
              setTransformedImage(urlData.publicUrl); 
              setProcessingState('completed'); 
            setActiveStep(3); 
              setSimulatedProgress(100); // Progresso completo!
              toast.success("Transformação encontrada após verificação final!");
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setIsLoading(false);
              return; 
            }
        }
        } catch (finalStorageError) {
          console.error(`[useImageProcessing - FinalCheck] Final storage check failed:`, finalStorageError instanceof Error ? finalStorageError.message : String(finalStorageError));
        }
        
        console.warn(`[useImageProcessing - Polling] Max attempts reached (${pollCountRef.current}). Final direct storage check failed or API timed out after 6 minutes.`);

        setErrorMessage(STANDARD_ERROR_MESSAGE); // <<< USA A MENSAGEM PADRÃO
        setProcessingState('error'); 
        setActiveStep(3);
        toast.error("Processamento Demorado", { description: "A transformação está a demorar mais que o esperado. A sua imagem pode aparecer no perfil em breve.", duration: 7000 }); // Toast mais informativo

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
        console.log(`[useImageProcessing - PollingEffect] Starting polling for job ${currentJobId} (State: ${processingState}). First check immediate.`);
        pollCountRef.current = 0; 
        checkStatus(); 
        pollingIntervalRef.current = setInterval(checkStatus, POLLING_INTERVAL_MS);
      }
    } 
    else if (pollingIntervalRef.current && 
             !(processingState === 'polling_status' || processingState === 'processing')) { // <<< CONDIÇÃO CORRIGIDA AQUI
      console.log(`[useImageProcessing - PollingEffect] Clearing polling interval. State is ${processingState} (not 'polling_status' or 'processing'). JobId: ${currentJobId}`);
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      }
    else if (!currentJobId && pollingIntervalRef.current) {
        console.log(`[useImageProcessing - PollingEffect] Clearing polling interval because currentJobId is now null.`);
        clearInterval(pollingIntervalRef.current); 
        pollingIntervalRef.current = null;
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentJobId, processingState, userInfo, isAuthLoading, setActiveStep, setErrorMessage, setIsLoading, setProcessingState, setTransformedImage]);


  const resetAllLocalStates = useCallback(() => {
    console.log("[useImageProcessing] resetAllLocalStates called.");
    setUploadedImage(null);
    setSelectedStyle(null);
    setProcessingState('idle');
    setTransformedImage(null);
    setErrorMessage(null);
    setCurrentJobId(null);
    setActiveStep(1);
    setIsLoading(false);
    setSimulatedProgress(0); // Reset do progresso simulado
    localStorage.removeItem('studioState');
    localStorage.removeItem('currentJobId');
    if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
    }
    pollCountRef.current = 0; 
  }, [setActiveStep, setErrorMessage, setIsLoading, setCurrentJobId, setProcessingState, setSelectedStyle, setTransformedImage, setUploadedImage]); 

  const handleFileChange = useCallback((newFile: UploadedFile | null) => {
    resetAllLocalStates();
    if (newFile) {
      setUploadedImage(newFile);
        setActiveStep(2);
      console.log("[useImageProcessing] File changed, new file set. Active step: 2");
    } else {
        setActiveStep(1);
      console.log("[useImageProcessing] File removed. Active step: 1");
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
    console.log('[useImageProcessing - handleStyleSelect] Style selected:', style.name);
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
      console.log('[useImageProcessing - handleStartTransformation] Step: Checking balance...');
      await refetchBalance(); 
      
      const balanceResponse = await fetch('/api/piccoins/balance');
      if(!balanceResponse.ok) {
        const errorData = await balanceResponse.json().catch(() => ({message: "Falha ao obter saldo."}));
        throw new Error(errorData.message || "Falha ao verificar saldo atualizado.");
      }
      const currentBalanceData = await balanceResponse.json();
      const currentFreshBalance = currentBalanceData.balance;
      console.log(`[useImageProcessing - handleStartTransformation] Fresh balance: ${currentFreshBalance}`);

      if (currentFreshBalance >= PICCOINS_PER_TRANSFORMATION) {
        toast.info("💰 Usando PicCoins...", { description: `A preparar a sua transformação. Saldo: ${currentFreshBalance}` });
        
        setProcessingState('uploading_image');
        console.log('[useImageProcessing - handleStartTransformation] Step: Uploading image...');
        const imageFile = uploadedImage.file;
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'tmp';
      const filePath = `public/${userInfo.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images').upload(filePath, imageFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(uploadError.message || "Falha ao fazer upload da imagem para o storage.");
      if (!uploadData?.path) throw new Error("Falha ao obter o caminho da imagem após upload.");
      tempUploadedFilePath = uploadData.path;
        console.log(`[useImageProcessing - handleStartTransformation] Image uploaded to: ${tempUploadedFilePath}`);
      
        setProcessingState('creating_job_record');
        console.log('[useImageProcessing - handleStartTransformation] Step: Creating job record...');
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
        console.log(`[useImageProcessing - handleStartTransformation] Job record created. Job ID: ${tempNewJobId}`);
        
        setProcessingState('spending_coins');
        console.log('[useImageProcessing - handleStartTransformation] Step: Spending PicCoins...');
        await spendCoins(PICCOINS_PER_TRANSFORMATION, tempNewJobId); 
        console.log(`[useImageProcessing - handleStartTransformation] PicCoins spent for Job ID: ${tempNewJobId}`);
        
        setProcessingState('triggering_processing');
        console.log('[useImageProcessing - handleStartTransformation] Step: Triggering backend processing...');
        
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
        console.log(`[useImageProcessing - handleStartTransformation] Backend processing triggered for Job ID: ${tempNewJobId}. API Response: ${processImageResponse.status}`);
      
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

      // Se o erro ocorreu DEPOIS de tentar gastar moedas ou acionar o backend
      // (podes verificar o processingState ou se tempNewJobId existe)
      // OU para simplificar, se já passou da fase de 'checking_balance'
      if (processingState !== 'checking_balance' && processingState !== 'idle') {
        setErrorMessage(STANDARD_ERROR_MESSAGE);
        toast.error("Erro no Processo", { description: SIMPLE_ERROR_TOAST_MESSAGE });
      } else {
        // Para erros antes de gastar moedas, pode ser uma mensagem mais direta
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
          
          console.log(`[useImageProcessing - handleStartTransformation] Updating job ${tempNewJobId} to status ${failureStatus} due to error: ${errorMsg.substring(0,100)}`);
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
    spendCoins, refetchBalance, router, 
    setActiveStep, setErrorMessage, setIsLoading, setProcessingState, setCurrentJobId, setTransformedImage 
  ]);

  const handleNewImage = useCallback(() => {
    resetAllLocalStates();
  }, [resetAllLocalStates]);

  const handleReset = useCallback(() => {
    handleNewImage();
  }, [handleNewImage]);

  const handleDownload = useCallback(() => {
    if (transformedImage) {
      // Abre a imagem numa nova aba para visualização/download manual
      window.open(transformedImage, '_blank', 'noopener,noreferrer');
      toast.success("Imagem aberta em novo separador!");
      console.log('[handleDownload] Opened image in new tab:', transformedImage);
    } else {
      toast.error("Nenhuma imagem transformada para abrir.");
      console.warn('[handleDownload] No transformed image available');
    }
  }, [transformedImage]);

  return {
    uploadedImage, isStyleModalOpen, selectedStyle, processingState, transformedImage,
    activeStep, isLoading, errorMessage, currentJobId, simulatedProgress,
    availableStyles, stylesLoading, stylesError,
    setIsStyleModalOpen, setActiveStep, 
    handleFileChange, openStyleSelector, handleStyleSelect,
    handleStartTransformation,
    handleReset, handleNewImage, handleDownload
  };
}
