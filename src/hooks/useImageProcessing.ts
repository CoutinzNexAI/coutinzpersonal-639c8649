import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { useRouter } from 'next/router';
import { UploadedFile } from './useImageUpload'; // Assuming this path is correct
import { Style } from '@/components/StyleSelectorModal'; // Assuming this path is correct
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePicCoins } from '@/hooks/usePicCoins';

const PICCOINS_PER_TRANSFORMATION = 1;
const MAX_POLL_ATTEMPTS_CONST = 36; // Aprox. 3 minutos (36 * 3s = 108s)
const POLLING_INTERVAL_MS = 3000; // Intervalo de polling (3 segundos)

// Tipos de status de falha que podem ser definidos na DB
type FailureStatusDB = 
  | 'failed_system' 
  | 'failed_upload' 
  | 'failed_checkout_redirect'
  | 'failed_db_update'
  | 'failed_payment'
  | 'failed_trigger';

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

  const [availableStyles, setAvailableStyles] = useState<Style[]>([]);
  const [stylesLoading, setStylesLoading] = useState<boolean>(true);
  const [stylesError, setStylesError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadAttempted = useRef(false);
  const prevUserId = useRef<string | undefined | null>(null);
  const pollCountRef = useRef(0);

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
  }, []); // Removed availableStyles and stylesLoading from deps to prevent re-fetch loops

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
    if (!initialLoadAttempted.current) return; // Don't save before initial load has attempted to restore
    try {
      const stateToSave = { selectedStyleId: selectedStyle?.id || null };
      localStorage.setItem('studioState', JSON.stringify(stateToSave));
      // console.log("[useImageProcessing] Saved style to localStorage:", selectedStyle?.name || 'none');
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
            setIsLoading(false); // Ensure loading is stopped
        }
        return;
      }

      if (isAuthLoading) {
        console.log("[useImageProcessing - Polling] checkStatus: Auth is loading, skipping poll attempt.");
        return;
      }

      pollCountRef.current++;
      console.log(`[useImageProcessing - Polling] Attempt ${pollCountRef.current}/${MAX_POLL_ATTEMPTS_CONST} for jobId: ${currentJobId}`);

      // Direct Storage Check logic
      const shouldDirectCheck = (pollCountRef.current <= 6 && pollCountRef.current > 1 && pollCountRef.current % 2 === 0) || 
                                (pollCountRef.current > 6 && pollCountRef.current % 3 === 0);

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
            // Do not return, proceed to API call as fallback
          } else if (files && files.length > 0) {
            const fileName = files[0].name;
            console.log(`🎯 [useImageProcessing - DirectCheck] FOUND image in storage: ${fileName}`);
            const { data: urlData } = supabase.storage.from('results').getPublicUrl(`${storagePath}/${fileName}`);
            
            if (urlData?.publicUrl) {
              console.log(`🎯 [useImageProcessing - DirectCheck] Generated URL: ${urlData.publicUrl}`);
              setTransformedImage(urlData.publicUrl); 
              setProcessingState('completed'); 
              setActiveStep(3); // Ensure UI moves to the result step
              toast.success("Transformação encontrada diretamente no storage!");
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setIsLoading(false); // Stop general loading
              return; // Skip API call this time
            } else {
              console.warn(`[useImageProcessing - DirectCheck] Could not get public URL for ${fileName}`);
            }
          } else {
            console.log(`[useImageProcessing - DirectCheck] No files found in storage path: ${storagePath}`);
          }
        } catch (storageError) {
          console.error(`[useImageProcessing - DirectCheck] Storage check failed:`, storageError instanceof Error ? storageError.message : storageError);
          // Continue with API call as fallback
        }
      }
      
      // API Call
      try {
        const cacheParam = pollCountRef.current > 10 ? `&_t=${Date.now()}` : ''; // Cache-busting after 10 attempts
        const userParam = userInfo?.id ? `&userId=${userInfo.id}` : ''; // Pass userId for backend verification/logging
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
          const backendErrorMessage = data.error_message || 'Ocorreu uma falha desconhecida no processamento.';
          console.log(`[useImageProcessing - Polling] Job FAILED via API. Status: ${data.status}, Error: ${backendErrorMessage}`);
          setErrorMessage(backendErrorMessage); 
          setProcessingState('error'); 
          setActiveStep(3); 
          toast.error("Falha na Transformação", { description: backendErrorMessage });
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
             // setActiveStep(3); // Already in step 3 if polling
          }
        } else if (data.status) { // Handle other unexpected statuses from API
          console.warn(`[useImageProcessing - Polling] Status inesperado da API: ${data.status || 'vazio'}. JobId: ${currentJobId}`);
        } else {
          console.warn(`[useImageProcessing - Polling] API returned no status for JobId: ${currentJobId}. Response:`, data);
        }
      } catch (apiError) { // Catches errors from fetch() or response.json()
        const errorMsg = apiError instanceof Error ? apiError.message : "Erro de rede ou formato de resposta inválido.";
        console.error(`[useImageProcessing - Polling] ❌ API call error for ${currentJobId}:`, errorMsg);
        // Don't immediately set to 'error' state on a single network blip,
        // allow polling to retry a few times unless it's a critical auth error (handled above).
        // If it's a persistent issue, MAX_POLL_ATTEMPTS_CONST will handle it.
        // toast.error("Erro de Rede", { description: "Falha temporária ao verificar estado. A tentar novamente..." });
      }

      // Timeout Logic (Max Poll Attempts)
      if (pollCountRef.current >= MAX_POLL_ATTEMPTS_CONST && 
          (processingState === 'polling_status' || processingState === 'processing')) {
        console.warn(`[useImageProcessing - Polling] Max attempts reached (${pollCountRef.current}). Trying final direct storage check...`);
        
        try { // Final Direct Storage Check
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
              toast.success("Transformação encontrada após verificação final!");
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setIsLoading(false);
              return; // Successfully completed
            }
          }
        } catch (finalStorageError) {
          console.error(`[useImageProcessing - FinalCheck] Final storage check failed:`, finalStorageError instanceof Error ? finalStorageError.message : finalStorageError);
        }
        
        // If final storage check also fails, then show timeout error
        const timeoutUserMsg = "A sua transformação está a demorar mais que o normal. Por favor, verifique a sua galeria em 'Minha Conta' dentro de momentos ou tente mais tarde.";
        setErrorMessage(timeoutUserMsg);
        setProcessingState('error'); 
        setActiveStep(3);
        toast.error("Processamento Demorado", { description: timeoutUserMsg, duration: 7000 });
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsLoading(false);
      }
    }; // End of checkStatus function

    // --- Polling Interval Control ---
    // Start polling if we have a job ID, user is authenticated, and state is 'polling_status' or 'processing'
    if (currentJobId && 
        userInfo?.id && 
        !isAuthLoading && 
        (processingState === 'polling_status' || processingState === 'processing')) {
      if (!pollingIntervalRef.current) {
        console.log(`[useImageProcessing - PollingEffect] Starting polling for job ${currentJobId} (State: ${processingState}). First check immediate.`);
        pollCountRef.current = 0; // Reset count for new polling session
        checkStatus(); // Call immediately once
        pollingIntervalRef.current = setInterval(checkStatus, POLLING_INTERVAL_MS);
      } else {
        // console.log(`[useImageProcessing - PollingEffect] Polling already active for job ${currentJobId}.`);
      }
    } 
    // Clear interval if conditions to poll are no longer met (e.g., state changes to 'completed', 'error', or 'idle')
    else if (pollingIntervalRef.current && 
             !(processingState === 'polling_status' || processingState === 'processing')) {
      console.log(`[useImageProcessing - PollingEffect] Clearing polling interval. State is ${processingState} (not 'polling_status' or 'processing'). JobId: ${currentJobId}`);
      clearInterval(pollingIntervalRef.current); 
      pollingIntervalRef.current = null;
    } 
    // Also clear if jobId becomes null while interval is active (e.g., user resets)
    else if (!currentJobId && pollingIntervalRef.current) {
        console.log(`[useImageProcessing - PollingEffect] Clearing polling interval because currentJobId is now null.`);
        clearInterval(pollingIntervalRef.current); 
        pollingIntervalRef.current = null;
    }
    
    // Cleanup function for the useEffect
    return () => { 
      if (pollingIntervalRef.current) {
        // console.log("[useImageProcessing - PollingEffect] Cleanup: Clearing polling interval on unmount or dependency change.");
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null; // Ensure it's reset
      }
    };
  // Dependencies for the polling useEffect
  // Key dependencies: currentJobId, processingState, userInfo, isAuthLoading
  // Stable setters from useState are not needed in deps array
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
    localStorage.removeItem('studioState'); 
    localStorage.removeItem('currentJobId');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    pollCountRef.current = 0; // Reset poll count on full reset
  }, [setActiveStep, setUploadedImage, setSelectedStyle, setProcessingState, setTransformedImage, setErrorMessage, setCurrentJobId, setIsLoading]); // Stable setters

  const handleFileChange = useCallback((newFile: UploadedFile | null) => {
    resetAllLocalStates(); // Reset everything before starting with a new file
    if (newFile) {
      setUploadedImage(newFile);
      setActiveStep(2); // Move to style selection step
      console.log("[useImageProcessing] File changed, new file set. Active step: 2");
    } else {
      setActiveStep(1); // Back to upload step if file is removed
      console.log("[useImageProcessing] File removed. Active step: 1");
    }
  }, [resetAllLocalStates, setActiveStep, setUploadedImage]); // Stable setters

  const openStyleSelector = useCallback(() => {
    if (uploadedImage) {
      setIsStyleModalOpen(true);
    } else {
      toast.error("Por favor, carregue uma imagem primeiro.");
    }
  }, [uploadedImage, setIsStyleModalOpen]); // setIsStyleModalOpen is stable

  const handleStyleSelect = useCallback((style: Style) => {
    console.log('[useImageProcessing - handleStyleSelect] Style selected:', style.name);
    setSelectedStyle(style);
    setActiveStep(3); // Move to the transformation/action step
    setIsStyleModalOpen(false);
    setErrorMessage(null); // Clear any previous errors
    // The user now needs to click a button to start the transformation
    setProcessingState('idle'); // Ready for user to click "Transform"
    toast.success(`Estilo "${style.name}" selecionado!`);
  }, [setActiveStep, setSelectedStyle, setIsStyleModalOpen, setErrorMessage, setProcessingState]); // Stable setters


  const handleStartTransformation = useCallback(async () => {
    console.log('[useImageProcessing - handleStartTransformation] Attempting to start transformation. Current state:', { 
      hasImage: !!uploadedImage, 
      hasStyle: !!selectedStyle, 
      styleName: selectedStyle?.name,
      isAuthLoading, 
      userId: userInfo?.id,
      currentProcessingState: processingState // Log current state before changing
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

    // Prevent multiple simultaneous transformations if one is already in a non-idle/non-error state
    if (!['idle', 'error', 'completed'].includes(processingState)) {
        console.warn(`[useImageProcessing - handleStartTransformation] Transformation already in progress or in a non-startable state: ${processingState}. Aborting.`);
        toast.info("Processo em Andamento", { description: "Uma transformação já está em curso ou a finalizar." });
        return;
    }


    setIsLoading(true); // Indicate general loading for the UI
    setProcessingState('checking_balance'); 
    setErrorMessage(null); 
    setTransformedImage(null); 
    setCurrentJobId(null); // Clear previous job ID
    pollCountRef.current = 0; // Reset poll count for a new transformation

    let tempUploadedFilePath: string | null = null;
    let tempNewJobId: string | null = null;

    try {
      console.log('[useImageProcessing - handleStartTransformation] Step: Checking balance...');
      await refetchBalance(); 
      
      // Fetch fresh balance directly as refetchBalance updates state asynchronously
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
        
        // 1. Upload image to Supabase Storage
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
        
        // 2. Create job record in 'transformations' table
        setProcessingState('creating_job_record');
        console.log('[useImageProcessing - handleStartTransformation] Step: Creating job record...');
        const transformationData: TransformationInsert = { 
          user_id: userInfo.id, 
          style_requested: selectedStyle.id, 
          status: 'awaiting_processing', // Initial status before payment/trigger
          input_file_path: tempUploadedFilePath
        };
        const { data: jobData, error: jobError } = await supabase
          .from('transformations').insert(transformationData).select('id').single();
        
        if (jobError || !jobData?.id) {
          if (tempUploadedFilePath) { // Cleanup orphaned image if job creation fails
            supabase.storage.from('images').remove([tempUploadedFilePath])
              .catch(delErr => console.error(`[Cleanup] Falha ao apagar imagem órfã ${tempUploadedFilePath}:`, delErr));
          }
          throw new Error(jobError?.message || "Falha ao criar o registo da transformação na base de dados.");
        }
        tempNewJobId = jobData.id;
        console.log(`[useImageProcessing - handleStartTransformation] Job record created. Job ID: ${tempNewJobId}`);
        
        // 3. Spend PicCoins
        setProcessingState('spending_coins');
        console.log('[useImageProcessing - handleStartTransformation] Step: Spending PicCoins...');
        // CORREÇÃO APLICADA: Removido o terceiro argumento
        await spendCoins(PICCOINS_PER_TRANSFORMATION, tempNewJobId); 
        console.log(`[useImageProcessing - handleStartTransformation] PicCoins spent for Job ID: ${tempNewJobId}`);
        
        // 4. Trigger backend image processing
        setProcessingState('triggering_processing');
        console.log('[useImageProcessing - handleStartTransformation] Step: Triggering backend processing...');
        const internalSecret = process.env.NEXT_PUBLIC_INTERNAL_API_SECRET; // Get from env
        if (!internalSecret) {
            console.error("CRITICAL: NEXT_PUBLIC_INTERNAL_API_SECRET is not defined in the frontend environment.");
            throw new Error("Configuração interna em falta. Não é possível iniciar o processamento.");
        }
        const processImageResponse = await fetch('/api/process-image', {
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json',
            'X-Internal-Secret': internalSecret // Add the internal secret header
          },
          body: JSON.stringify({ jobId: tempNewJobId }),
        });

        if (!processImageResponse.ok) {
          const errorBody = await processImageResponse.json().catch(() => ({message: "Erro desconhecido ao acionar o processamento da imagem."}));
          // Update job status to failed_trigger directly
          await supabase.from('transformations')
            .update({ status: 'failed_trigger' as FailureStatusDB, error_message: `Falha ao acionar /api/process-image: ${errorBody.message}`.substring(0,500) }) 
            .eq('id', tempNewJobId);
          throw new Error(`Falha ao iniciar o processamento no backend: ${errorBody.message}`);
        }
        console.log(`[useImageProcessing - handleStartTransformation] Backend processing triggered for Job ID: ${tempNewJobId}. API Response: ${processImageResponse.status}`);
        
        // 5. Start polling
        localStorage.setItem('currentJobId', tempNewJobId); // Persist for potential page refresh
        setCurrentJobId(tempNewJobId);
        setProcessingState('polling_status'); // This will trigger the polling useEffect
        setActiveStep(3); // Ensure UI is on the processing/result step
        toast.success("✨ Transformação Iniciada!", { description: "A sua imagem está a ser processada. Pode acompanhar aqui ou voltar mais tarde." });
        // setIsLoading(false) will be handled by the polling logic upon completion/error
        
      } else { // Not enough PicCoins
        toast.warning("💰 Saldo de PicCoins Insuficiente!", { 
          description: `Precisas de ${PICCOINS_PER_TRANSFORMATION} PicCoin para esta transformação (saldo atual: ${currentFreshBalance}). Vamos redirecionar para a página de compra.`,
          duration: 5000
        });
        setProcessingState('idle'); 
        setIsLoading(false);
        setTimeout(() => { router.push('/pricing?from=studio&reason=insufficient_balance'); }, 3000);
        return;
      }

    } catch (err) { // Catch all errors from the try block
      const errorMsg = err instanceof Error ? err.message : 'Ocorreu uma falha desconhecida durante o início da transformação.';
      console.error("[useImageProcessing - handleStartTransformation] Error caught:", err);
      setErrorMessage(errorMsg); 
      toast.error("Erro no Processo", { description: errorMsg });
      setProcessingState('error'); 
      setActiveStep(3); // Go to result/error step
      
      // If a job ID was created, mark it as failed in the DB
      if (tempNewJobId) {
        // Don't clear currentJobId from state if we want polling to potentially pick up a manual fix or different error
        // localStorage.removeItem('currentJobId'); // Maybe keep it for retry/debug?
        // setCurrentJobId(null); // Or keep it to show error for this specific job

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
      // setIsLoading(false) should generally be handled by the polling logic (on complete/error)
      // or if the process fails before polling starts (e.g. insufficient balance)
      // If processState is not one that implies ongoing background work, set isLoading to false.
      if (!['polling_status', 'processing', 'checking_balance', 'uploading_image', 'creating_job_record', 'spending_coins', 'triggering_processing'].includes(processingState) ) {
         setIsLoading(false);
      }
    }
  }, [
    uploadedImage, selectedStyle, userInfo, isAuthLoading, processingState, // Added processingState for pre-check
    spendCoins, refetchBalance, router, 
    setActiveStep, setErrorMessage, setIsLoading, setProcessingState, setCurrentJobId, setTransformedImage // Ensure all setters are here
  ]);

  const handleNewImage = useCallback(() => { 
    resetAllLocalStates(); 
  }, [resetAllLocalStates]);

  const handleReset = useCallback(() => { 
    // Could be more specific, e.g., only reset style if image is kept
    // For now, it's the same as new image
    handleNewImage(); 
  }, [handleNewImage]);

  const handleDownload = useCallback(() => {
    if (transformedImage) {
        const link = document.createElement('a');
        link.href = transformedImage;
        // Attempt to get a filename
        try {
            const url = new URL(transformedImage);
            const pathSegments = url.pathname.split('/');
            link.download = pathSegments.pop() || `pictuz_transformed_${currentJobId || Date.now()}.png`;
        } catch (e) {
            link.download = `pictuz_transformed_${currentJobId || Date.now()}.png`;
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download Iniciado!");
    } else {
        toast.error("Nenhuma imagem transformada para descarregar.");
    }
  }, [transformedImage, currentJobId]);

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
