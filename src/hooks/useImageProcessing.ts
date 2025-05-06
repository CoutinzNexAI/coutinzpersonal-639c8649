import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { UploadedFile } from './useImageUpload';
import { Style } from '@/components/StyleSelectorModal';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type ProcessingState =
  | 'idle'
  | 'creating_job'
  | 'uploading_image'
  | 'awaiting_payment'
  | 'redirecting_to_payment'
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

const getSessionId = () => {
  let sessionId = localStorage.getItem('anonymous_session_id');
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('anonymous_session_id', sessionId);
  }
  return sessionId;
};

let stripePromise: Promise<Stripe | null>;
const getStripe = () => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
        console.error("❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables.");
        toast.error("Erro de Configuração", { description: "A chave de pagamento não está configurada." });
        return Promise.resolve(null);
    }
    if (!stripePromise) {
        stripePromise = loadStripe(publishableKey);
    }
    return stripePromise;
};

export function useImageProcessing() {
  const { userInfo, isLoading: isAuthLoading } = useAuth();
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

  // --- Fetch styles (runs once on mount) ---
  useEffect(() => {
    console.log('[Effect fetchStyles] Effect triggered.');
    const fetchStyles = async () => {
      if (availableStyles.length > 0) {
          console.log(`[Effect fetchStyles] Skipping fetch. Reason: Styles already loaded (length: ${availableStyles.length})`);
          if (stylesLoading) setStylesLoading(false);
          return;
      }
      console.log('[Effect fetchStyles] Fetching styles from Supabase...');
      setStylesLoading(true);
      setStylesError(null);
      try {
        const { data, error } = await supabase
          .from('styles')
          .select('*')
          .eq('is_active', true)
          .order('order', { ascending: true });
        console.log('[Effect fetchStyles] Supabase response:', { data, error });
        if (error) throw error;
        console.log('[Effect fetchStyles] Styles fetched successfully:', data?.length || 0);
        setAvailableStyles(data || []);
      } catch (error: unknown) {
        console.error("❌ Erro ao buscar estilos:", error);
        const errorMessage = error instanceof Error ? error.message : 'Falha ao carregar estilos.';
        setStylesError(errorMessage);
        setAvailableStyles([]);
        toast.error("Erro ao Carregar Estilos", { description: errorMessage });
      } finally {
        console.log('[Effect fetchStyles] Setting stylesLoading to false.');
        setStylesLoading(false);
      }
    };
    fetchStyles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // --- Load state from localStorage ON MOUNT (runs once) ---
  useEffect(() => {
    if (initialLoadAttempted.current) {
       console.log('[Effect localStorage Load] Skipping: Initial load already attempted.');
       return;
    }
    initialLoadAttempted.current = true;
    console.log('--- [Effect localStorage Load] Attempting to load state from localStorage (runs once) ---');
    let restoredJobId: string | null = null;
    let restoredStyleId: string | null = null;
    try {
      const savedJobId = localStorage.getItem('currentJobId');
      const savedState = localStorage.getItem('studioState');
      console.log('[Effect localStorage Load] Raw saved Job ID:', savedJobId);
      console.log('[Effect localStorage Load] Raw saved State:', savedState);
      if (savedJobId) {
         restoredJobId = savedJobId;
         console.log(`[Effect localStorage Load] Found Job ID: ${restoredJobId}. Setting state.`);
         setCurrentJobId(restoredJobId);
         setProcessingState('polling_status');
         setActiveStep(3);
         setIsLoading(true);
         console.log(`[Effect localStorage Load] Set state to polling_status, step 3, isLoading true.`);
      }
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        restoredStyleId = parsedState?.selectedStyleId;
        if (restoredStyleId) {
           console.log(`[Effect localStorage Load] Found Style ID: ${restoredStyleId}. Will apply style later.`);
        }
      }
      if (!restoredJobId) {
         console.log('[Effect localStorage Load] No Job ID found. Ensuring default state.');
         setProcessingState('idle');
         setActiveStep(1);
         setIsLoading(false);
         setSelectedStyle(null);
      }
      console.log('--- [Effect localStorage Load] Finished initial load attempt ---');
    } catch (error) {
      console.error("❌ Erro ao carregar estado do localStorage:", error);
      localStorage.removeItem('currentJobId');
      localStorage.removeItem('studioState');
    }
  }, []);


  // --- Apply restored style object AFTER styles are loaded ---
  useEffect(() => {
      if (!stylesLoading && availableStyles.length > 0 && !selectedStyle) {
          const savedState = localStorage.getItem('studioState');
          if (savedState) {
              try {
                  const parsedState = JSON.parse(savedState);
                  const restoredStyleId = parsedState?.selectedStyleId;
                  if (restoredStyleId) {
                      console.log(`[Effect Apply Style] Styles loaded. Trying to apply restored style ID: ${restoredStyleId}`);
                      const style = availableStyles.find(s => s.id === restoredStyleId);
                      if (style) {
                          console.log('[Effect Apply Style] Matching style found, setting selectedStyle object:', style.name);
                          setSelectedStyle(style);
                      } else {
                          console.warn('[Effect Apply Style] Restored style ID not found in loaded styles.');
                      }
                  }
              } catch (error) {
                  console.error("❌ Erro ao aplicar estilo do localStorage:", error);
              }
          }
      }
  }, [availableStyles, stylesLoading, selectedStyle]);


  // --- Save state to localStorage ---
  useEffect(() => {
    if (!initialLoadAttempted.current) {
       console.log('[Effect localStorage Save] Skipping save: Initial load not complete.');
       return;
    }
    console.log('[Effect localStorage Save] Attempting to save state. Style:', selectedStyle?.name, 'Job ID:', currentJobId);
    try {
      const stateToSave = { selectedStyleId: selectedStyle?.id || null };
      // Save Job ID based on current state
      if (currentJobId) {
         // REMOVED CHECK: Always try to save the current state value
         localStorage.setItem('currentJobId', currentJobId);
         console.log('[Effect localStorage Save] Saved/Updated Job ID:', currentJobId);
      } else {
         // Remove if state is null/undefined
         if (localStorage.getItem('currentJobId')) {
             localStorage.removeItem('currentJobId');
             console.log('[Effect localStorage Save] Removed Job ID from localStorage.');
         }
      }
      // Always save style state
      localStorage.setItem('studioState', JSON.stringify(stateToSave));
      console.log('[Effect localStorage Save] Saved Style State:', stateToSave);
    } catch (error) {
      console.error("❌ Erro ao salvar estado no localStorage:", error);
    }
  }, [selectedStyle, currentJobId]); // Save when style or job ID state changes


  // --- Polling Effect (remains the same) ---
  useEffect(() => {
    const checkStatus = async () => {
      if (!currentJobId) {
        console.warn('[Polling Effect] No currentJobId found during checkStatus. Stopping polling.');
        if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; }
        setIsLoading(false);
        return;
      }
      console.log(`[Polling Effect] Checking status for job: ${currentJobId}`);
      setIsLoading(true);
      try {
        const response = await fetch(`/api/get-transformation-status?jobId=${currentJobId}`);
        if (!response.ok) {
           let errorMsg = `Erro ao buscar status (${response.status})`;
           try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (e) { /* ignore */ }
           console.error(`[Polling Effect] API error fetching status for ${currentJobId}. Status: ${response.status}, Message: ${errorMsg}`);
           setErrorMessage(errorMsg);
           if (response.status === 404 || response.status === 403) {
              setProcessingState('error');
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
              setIsLoading(false);
           }
           return;
        }
        const data: StatusResponse = await response.json();
        console.log(`[Polling Effect] Received status for ${currentJobId}: ${data.status}`);
        if (data.status === 'completed' && data.output_url) {
          console.log(`[Polling Effect] Job ${currentJobId} completed! Output URL: ${data.output_url}`);
          setTransformedImage(data.output_url);
          setProcessingState('completed');
          setActiveStep(3);
          toast.success("Transformação concluída!");
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setIsLoading(false);
          // localStorage.removeItem('currentJobId'); // Optional: Clear job ID on completion
        } else if (data.status?.startsWith('failed')) {
          console.error(`[Polling Effect] Job ${currentJobId} failed! Reason: ${data.error_message}`);
          setErrorMessage(data.error_message || 'A transformação falhou.');
          setProcessingState('error');
          setActiveStep(3);
          toast.error("Falha na Transformação", { description: data.error_message || 'Ocorreu um erro inesperado.' });
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setIsLoading(false);
          // localStorage.removeItem('currentJobId'); // Optional: Clear job ID on failure
        } else if (['processing', 'processing_queued', 'paid', 'pending_payment'].includes(data.status || '')) {
           if (processingState !== 'processing' && processingState !== 'polling_status') {
               console.log(`[Polling Effect] Updating state to 'processing' based on backend status '${data.status}'`);
               setProcessingState('processing');
               setActiveStep(3);
           } else { console.log(`[Polling Effect] Job ${currentJobId} is still '${data.status}'. Continuing polling.`); }
           setIsLoading(true);
        } else { console.warn(`[Polling Effect] Job ${currentJobId} has unexpected status: ${data.status}. Continuing polling.`); setIsLoading(true); }
      } catch (error) {
        console.error(`[Polling Effect] Network error fetching status for ${currentJobId}:`, error);
        setErrorMessage("Erro de rede ao verificar o estado da transformação.");
      }
    };
    if (currentJobId && processingState === 'polling_status') {
       console.log(`[Polling Effect] Starting polling interval for job ${currentJobId} due to 'polling_status' state.`);
       if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
       checkStatus();
       pollingIntervalRef.current = setInterval(checkStatus, 5000);
    } else if (!currentJobId || (processingState !== 'polling_status' && processingState !== 'processing')) {
       if (pollingIntervalRef.current) {
          console.log(`[Polling Effect] Stopping polling interval. Reason: No Job ID or State is '${processingState}'.`);
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          if (processingState !== 'completed' && processingState !== 'error') { setIsLoading(false); }
       }
    }
    return () => {
      if (pollingIntervalRef.current) {
        console.log('[Polling Effect] Cleanup: Clearing polling interval.');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentJobId, processingState]);


  // --- Other handlers (handleFileChange, openStyleSelector, handleStyleSelect, initiatePayment, handleNewImage, handleReset, handleDownload) remain the same ---
  // Ensure they are wrapped in useCallback with correct dependencies if needed for performance

  const handleFileChange = useCallback((file: UploadedFile | null) => {
    console.log('[handleFileChange] File changed:', file ? file.file.name : 'null');
    setUploadedImage(file);
    console.log('[handleFileChange] Resetting state for new file/removal.');
    setSelectedStyle(null);
    setProcessingState('idle');
    setTransformedImage(null);
    setErrorMessage(null);
    setCurrentJobId(null);
    setActiveStep(file ? 2 : 1);
    setIsLoading(false);
    localStorage.removeItem('studioState');
    localStorage.removeItem('currentJobId');
    if (pollingIntervalRef.current) {
       console.log('[handleFileChange] Clearing polling interval.');
       clearInterval(pollingIntervalRef.current);
       pollingIntervalRef.current = null;
    }
  }, []);

   const openStyleSelector = useCallback(() => {
     console.log('[openStyleSelector] Attempting to open modal. Image uploaded?', !!uploadedImage);
     if (uploadedImage) {
       setIsStyleModalOpen(true);
     } else {
       toast.error("Por favor, carregue uma imagem primeiro.");
     }
   }, [uploadedImage]);

  const handleStyleSelect = useCallback((style: Style) => {
    console.log('[handleStyleSelect] Started. Received style:', style?.name, style?.id);
    setSelectedStyle(style);
    setProcessingState('creating_job');
    setActiveStep(3);
    setIsStyleModalOpen(false);
    setErrorMessage(null);
    toast.success(`Estilo "${style.name}" selecionado!`);
  }, []);

  const initiatePayment = useCallback(async () => {
    console.log('[initiatePayment] Function called.');
    if (!uploadedImage || !selectedStyle || isAuthLoading || !userInfo) {
       if (!uploadedImage || !selectedStyle) toast.error("Erro", { description: "Imagem ou estilo não selecionados." });
       if (isAuthLoading) toast.info("Aguarde", { description: "A verificar autenticação..." });
       if (!userInfo) toast.error("Autenticação Necessária", { description: "Por favor, faça login para continuar." });
      return;
    }
    console.log("[initiatePayment] Checks passed. Initiating payment flow...");
    setIsLoading(true);
    setProcessingState('uploading_image');
    setErrorMessage(null);
    setCurrentJobId(null); // Clear previous job ID state
    localStorage.removeItem('currentJobId'); // Clear previous job ID from storage immediately

    let uploadedFilePath: string | null = null;
    let newJobId: string | null = null;
    try {
      console.log("[initiatePayment] Uploading image...");
      const file = uploadedImage.file;
      const fileExt = file.name.split('.').pop();
      const filePath = `public/${userInfo.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('images').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error(uploadError.message || "Falha ao fazer upload da imagem.");
      if (!uploadData?.path) throw new Error("Falha ao obter o caminho da imagem após upload.");
      uploadedFilePath = uploadData.path;
      console.log(`[initiatePayment] ✅ Image uploaded: ${uploadedFilePath}`);
      setProcessingState('creating_job');

      console.log("[initiatePayment] Creating job record...");
      const transformationData: TransformationInsert = { user_id: userInfo.id, style_requested: selectedStyle.id, status: 'pending_payment', input_file_path: uploadedFilePath };
      const { data: jobData, error: jobError } = await supabase.from('transformations').insert(transformationData).select('id').single();
      if (jobError || !jobData?.id) {
        if (uploadedFilePath) supabase.storage.from('images').remove([uploadedFilePath]).catch(delErr => console.error(`Failed to delete orphaned image ${uploadedFilePath}:`, delErr));
        throw new Error(jobError?.message || "Falha ao criar o registo da transformação.");
      }
      newJobId = jobData.id;

      // --- CRITICAL FIX: Save to localStorage BEFORE setting state and redirecting ---
      console.log(`[initiatePayment] ✅ Job created: ${newJobId}. Saving to localStorage BEFORE redirect.`);
      localStorage.setItem('currentJobId', newJobId); // SAVE HERE!
      // Also save style state immediately if needed
      localStorage.setItem('studioState', JSON.stringify({ selectedStyleId: selectedStyle.id }));

      // Now set React state (this might not finish before redirect, but localStorage is saved)
      setCurrentJobId(newJobId);
      setProcessingState('awaiting_payment');

      console.log("[initiatePayment] Creating Stripe session...");
      const response = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: newJobId, userEmail: userInfo.email }), });
      if (!response.ok) { let err = { m: `API Error (${response.status})` }; try { err = await response.json(); } catch (e) { /* ignore */ } throw new Error(err.m); }
      const { sessionId } = await response.json();
      if (!sessionId) throw new Error("No session ID received.");
      console.log(`[initiatePayment] ✅ Stripe session: ${sessionId}`);
      setProcessingState('redirecting_to_payment');

      console.log("[initiatePayment] Attempting redirect to Stripe...");
      const stripe = await getStripe();
      if (!stripe) throw new Error("Stripe.js not loaded.");
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) throw new Error(stripeError.message || "Redirect failed.");

    } catch (error) {
      console.error("[initiatePayment] Flow failed:", error);
      const errorMsg = error instanceof Error ? error.message : 'Falha.';
      setErrorMessage(errorMsg);
      toast.error("Erro", { description: errorMsg });
      setProcessingState('error');
      // Clear potentially saved (but failed) job ID from storage
      localStorage.removeItem('currentJobId');
      if (newJobId) { // Try update DB status if job was created
        try { await supabase.from('transformations').update({ status: 'failed_system', error_message: errorMsg }).eq('id', newJobId); } catch (e) { /* ignore */ }
      }
      setIsLoading(false);
    }
  }, [uploadedImage, selectedStyle, userInfo, isAuthLoading]);


   const handleNewImage = useCallback(() => {
       console.log('[handleNewImage] Resetting everything.');
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
          console.log('[handleNewImage] Clearing polling interval.');
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
   }, []);

   const handleReset = useCallback(() => {
       // Reset should probably go back to the beginning? Or just before payment?
       // Let's reset fully for now.
       handleNewImage(); // Call the full reset logic
       // Alternatively, if you want to retry payment for the same job/style:
       // setProcessingState('awaiting_payment');
       // setTransformedImage(null);
       // setErrorMessage(null);
       // setIsLoading(false);
       // if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; }
   }, [handleNewImage]); // Depend on handleNewImage

   const handleDownload = useCallback(() => {
       if (!transformedImage) {
          console.warn("[handleDownload] No transformed image URL available.");
          toast.warning("Download Indisponível", { description: "A imagem final ainda não está pronta." });
          return;
       }
       console.log(`[handleDownload] Attempting download from URL: ${transformedImage}`);
       const link = document.createElement('a');
       link.href = transformedImage;
       link.download = `transformed-${currentJobId || Date.now()}.png`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       toast.success("Download iniciado", { description: "Sua obra de arte está sendo baixada." });
   }, [transformedImage, currentJobId]);


  return {
    // States
    uploadedImage,
    isStyleModalOpen,
    selectedStyle,
    processingState,
    transformedImage,
    activeStep,
    // progressValue, // REMOVED
    isLoading,
    errorMessage,
    currentJobId,

    // Styles states
    availableStyles,
    stylesLoading, // Export this state
    stylesError,

    // Modal state handler
    setIsStyleModalOpen,

    // Action Handlers wrapped in useCallback
    handleFileChange,
    openStyleSelector,
    handleStyleSelect,
    handlePaymentClick: initiatePayment,
    // handleSimulatedPaymentClick, // REMOVED
    // handleTransformImage, // REMOVED
    handleReset,
    handleNewImage,
    handleDownload
  };
}
