import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { UploadedFile } from './useImageUpload'; // Assume que este ficheiro existe em src/hooks/
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
  message?: string; // For general API errors
};

type TransformationInsert = {
  user_id: string;
  style_requested: string;
  status: string;
  input_file_path: string;
};

// --- getStripe function ---
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

export type UseImageProcessingResult = ReturnType<typeof useImageProcessing>;

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
  const prevUserId = useRef<string | undefined | null>(null);


  // --- Fetch styles (runs once on mount) ---
  useEffect(() => {
    console.log('[Effect fetchStyles] Effect triggered.');
    const fetchStyles = async () => {
      if (availableStyles.length > 0 && !stylesLoading) {
        console.log(`[Effect fetchStyles] Skipping fetch. Reason: Styles already loaded (length: ${availableStyles.length})`);
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
        if (error) throw error;
        setAvailableStyles(data || []);
      } catch (error: unknown) {
        console.error("❌ Erro ao buscar estilos:", error);
        const errorMessageText = error instanceof Error ? error.message : 'Falha ao carregar estilos.';
        setStylesError(errorMessageText);
        setAvailableStyles([]);
        toast.error("Erro ao Carregar Estilos", { description: errorMessageText });
      } finally {
        setStylesLoading(false);
      }
    };
    fetchStyles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // --- Reset state when user changes ---
  useEffect(() => {
    const currentUserId = userInfo?.id;
    // Se o ID do utilizador mudou (e não é a primeira vez que userInfo é definido)
    // ou se o utilizador fez logout (currentUserId é null e prevUserId existia)
    if (prevUserId.current !== undefined && prevUserId.current !== currentUserId) {
        console.log('[Effect User Change] User changed or logged out. Resetting all states.');
        setUploadedImage(null);
        setSelectedStyle(null);
        setProcessingState('idle');
        setTransformedImage(null);
        setErrorMessage(null);
        setCurrentJobId(null);
        setActiveStep(1);
        setIsLoading(false);
        localStorage.removeItem('studioState');
        localStorage.removeItem('currentJobId'); // Garante que o job ID também é limpo
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        // Força o GhibliHero a recarregar o estado inicial, se necessário,
        // limpando qualquer estado persistido que possa causar problemas.
        // A flag initialLoadAttempted pode precisar ser resetada se a lógica de carga do localStorage for complexa.
        // Para este caso, o reset acima deve ser suficiente.
    }
    prevUserId.current = currentUserId; // Atualiza o ID do utilizador anterior
  }, [userInfo?.id]); // Observa o ID do utilizador


  // --- Load state from localStorage ON MOUNT (Simplified: only selectedStyleId) ---
  useEffect(() => {
    // Só executa após a tentativa de buscar estilos e se a carga inicial não foi feita
    if (initialLoadAttempted.current || stylesLoading) {
        console.log('[Effect localStorage Load] Skipping: Initial load already attempted or styles are loading.');
        return;
    }
    initialLoadAttempted.current = true;
    console.log('--- [Effect localStorage Load] Attempting to load selected style from localStorage ---');
    
    try {
        const savedState = localStorage.getItem('studioState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            const restoredStyleId = parsedState?.selectedStyleId;

            if (restoredStyleId && availableStyles.length > 0) {
                const style = availableStyles.find(s => s.id === restoredStyleId);
                if (style) {
                    setSelectedStyle(style);
                    // Não muda o activeStep ou processingState aqui,
                    // permite que o utilizador continue de onde parou se só selecionou um estilo.
                    // Se uma imagem já estiver carregada (improvável com o reset no user change),
                    // o fluxo normal do handleFileChange / handleStyleSelect deve ocorrer.
                    console.log('[Effect localStorage Load] Restored selected style:', style.name);
                } else {
                    localStorage.removeItem('studioState'); // Limpa se o estilo não existe mais
                }
            }
        }
        // Garante que o estado inicial é 'idle' e passo 1 se nada for restaurado que justifique outro estado.
        // O reset no user change já deve tratar disto, mas como uma segurança adicional:
        if (!currentJobId) { // Se não há job ID (que não é mais restaurado aqui)
            setProcessingState('idle');
            setActiveStep(1);
            setIsLoading(false);
        }

    } catch (error) {
        console.error("❌ Erro ao carregar estado do localStorage:", error);
        localStorage.removeItem('studioState'); // Limpa em caso de erro
    }
  }, [availableStyles, stylesLoading, currentJobId]); // Depende de availableStyles, stylesLoading e currentJobId


  // --- Save state to localStorage (Simplified: only selectedStyleId) ---
  useEffect(() => {
    if (!initialLoadAttempted.current) {
        console.log('[Effect localStorage Save] Skipping save: Initial load not complete.');
        return;
    }
    try {
        // Guarda apenas o selectedStyleId. currentJobId não é mais guardado aqui.
        const stateToSave = { selectedStyleId: selectedStyle?.id || null };
        localStorage.setItem('studioState', JSON.stringify(stateToSave));
        console.log('[Effect localStorage Save] Saved Style State:', stateToSave);

        // Remove currentJobId do localStorage se ele existir, pois não o queremos persistir aqui.
        // A página de sucesso pode gerir o seu próprio jobId no localStorage se necessário.
        if (localStorage.getItem('currentJobId')) {
            localStorage.removeItem('currentJobId');
            console.log('[Effect localStorage Save] Ensured currentJobId is removed from localStorage by GhibliHero hook.');
        }

    } catch (error) {
        console.error("❌ Erro ao salvar estado no localStorage:", error);
    }
  }, [selectedStyle, currentJobId]); // Adicionado currentJobId como dependência


  // --- Polling Effect (Mantido como na versão anterior robusta) ---
  useEffect(() => {
    const POLLING_INTERVAL_MS = 5000;
    let pollCount = 0;
    const MAX_POLL_ATTEMPTS = 72; // Aprox. 6 minutos

    const checkStatus = async () => {
      if (!currentJobId) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsLoading(false);
        return;
      }

      if (!userInfo && !isAuthLoading) {
        setErrorMessage("Autenticação necessária. Por favor, faça login.");
        setProcessingState('error');
        setActiveStep(3);
        toast.error("Autenticação Necessária", { description: "Faça login para ver o progresso." });
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsLoading(false);
        return;
      }
      if (isAuthLoading) return;

      pollCount++;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/get-transformation-status?jobId=${currentJobId}`);
        
        let data: StatusResponse = {};
        if (response.headers.get("content-type")?.includes("application/json")) {
            try {
                data = await response.json();
            } catch {
                // Handle cases where JSON parsing fails for a non-OK response
                const errorMsg = `Falha ao processar resposta do servidor (status: ${response.status})`;
                setErrorMessage(errorMsg);
                toast.error("Erro de Comunicação", { description: errorMsg });
                setProcessingState('error');
                setActiveStep(3);
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                setIsLoading(false);
                return;
            }
        }

        if (!response.ok) {
          // More robust handling for any non-OK response
          const errorMsg = data.message || `Erro ao buscar status (${response.status})`;
          setErrorMessage(errorMsg);
          toast.error("Erro de Polling", { description: errorMsg });
          setProcessingState('error'); 
          setActiveStep(3);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsLoading(false);
          return;
        }

        if (data.status === 'completed' && data.output_url) {
          setTransformedImage(data.output_url); setProcessingState('completed'); setActiveStep(3);
          toast.success("Transformação concluída!");
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null; setIsLoading(false);
        } else if (data.status?.startsWith('failed')) {
          setErrorMessage(data.error_message || 'A transformação falhou.');
          setProcessingState('error'); setActiveStep(3);
          toast.error("Falha na Transformação", { description: data.error_message || 'Ocorreu um erro inesperado.' });
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null; setIsLoading(false);
        } else if (['processing', 'processing_queued', 'paid', 'pending_payment'].includes(data.status || '')) {
          if (processingState !== 'processing') {
             setProcessingState('processing'); setActiveStep(3);
          }
          setIsLoading(true);
        } else {
          // Handle unknown status as an error to stop polling
          const unknownStatusMsg = `Status desconhecido recebido da API: ${data.status || 'vazio'}`;
          console.warn(`[Polling] ${unknownStatusMsg}`);
          setErrorMessage(unknownStatusMsg);
          setProcessingState('error');
          setActiveStep(3);
          toast.error("Erro Inesperado no Status", { description: unknownStatusMsg });
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsLoading(false);
        }
      } catch (error) {
        const catchErrorMsg = error instanceof Error ? error.message : "Erro de comunicação desconhecido.";
        setErrorMessage(catchErrorMsg);
        toast.error("Erro de Rede", { description: "Verifique sua conexão e tente novamente."});
        // Don't set processingState to 'error' here directly unless it's a network error that should stop polling.
        // The finally block or next poll attempt might recover or hit max attempts.
        // However, for a client-side catch (e.g. fetch throws), it's safer to stop.
        setProcessingState('error'); 
        setActiveStep(3);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsLoading(false);
      } finally {
        if (pollCount >= MAX_POLL_ATTEMPTS && (processingState === 'polling_status' || processingState === 'processing')) {
            setErrorMessage("O servidor demorou demasiado para responder. Tente mais tarde.");
            setProcessingState('error'); setActiveStep(3);
            toast.error("Timeout", { description: "O processamento demorou mais que o esperado."});
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null; setIsLoading(false);
        }
      }
    };

    if (currentJobId && (processingState === 'polling_status' || processingState === 'processing') && !isAuthLoading) {
      if (userInfo?.id) { // Changed to userInfo?.id
        if (!pollingIntervalRef.current) {
            pollCount = 0;
            checkStatus();
            pollingIntervalRef.current = setInterval(checkStatus, POLLING_INTERVAL_MS);
        }
      } else if (processingState === 'polling_status' || processingState === 'processing') { // Ensure this check is only if polling was active
        setErrorMessage("Autenticação perdida durante o polling. Faça login.");
        setProcessingState('error'); setActiveStep(3);
        toast.error("Sessão Perdida", { description: "Faça login para continuar monitorando." });
        setIsLoading(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } else if (pollingIntervalRef.current && (processingState !== 'polling_status' && processingState !== 'processing')) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      if (processingState !== 'completed' && processingState !== 'error') {
          setIsLoading(false);
      }
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentJobId, processingState, userInfo, userInfo?.id, isAuthLoading, setActiveStep, setErrorMessage, setIsLoading, setProcessingState, setTransformedImage]); // Added userInfo


  // --- Handlers ---
  const resetAllLocalStates = useCallback(() => {
    setUploadedImage(null);
    setSelectedStyle(null);
    setProcessingState('idle');
    setTransformedImage(null);
    setErrorMessage(null);
    setCurrentJobId(null);
    setActiveStep(1);
    setIsLoading(false);
    // Limpa o localStorage para um novo fluxo
    localStorage.removeItem('studioState'); // Limpa apenas o estilo guardado
    localStorage.removeItem('currentJobId'); // Garante que o job ID é limpo
    if (pollingIntervalRef.current) {
        console.log('[resetAllLocalStates] Clearing polling interval.');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
    }
  }, [setErrorMessage, setIsLoading, setProcessingState, setSelectedStyle, setTransformedImage, setCurrentJobId]); // Removido setActiveStep

  const handleFileChange = useCallback((file: UploadedFile | null) => {
    console.log('[handleFileChange] File changed:', file ? file.file.name : 'null');
    // Se um novo ficheiro é carregado, ou o ficheiro é removido, reseta tudo.
    resetAllLocalStates(); // Chama a função de reset completo
    if (file) {
        setUploadedImage(file);
        setActiveStep(2); // Avança para a seleção de estilo se um ficheiro for carregado
    }
  }, [resetAllLocalStates, setActiveStep, setUploadedImage]);

  const openStyleSelector = useCallback(() => {
    if (uploadedImage) {
      setIsStyleModalOpen(true);
    } else {
      toast.error("Por favor, carregue uma imagem primeiro.");
    }
  }, [uploadedImage]);

  const handleStyleSelect = useCallback((style: Style) => {
    setSelectedStyle(style);
    setActiveStep(3); 
    setIsStyleModalOpen(false);
    setErrorMessage(null);
    // If we have an uploaded image and now a style, we are ready for payment step.
    if (uploadedImage) {
      setProcessingState('awaiting_payment'); // Set state to show payment UI
    }
    toast.success(`Estilo "${style.name}" selecionado!`);
  }, [uploadedImage, setActiveStep, setProcessingState, setSelectedStyle, setIsStyleModalOpen, setErrorMessage]);

  const initiatePayment = useCallback(async () => {
    if (!uploadedImage || !selectedStyle) {
      toast.error("Erro", { description: "Por favor, carregue uma imagem e selecione um estilo." });
      return;
    }
    if (isAuthLoading) {
      toast.info("Aguarde", { description: "A verificar autenticação..." }); return;
    }
    if (!userInfo) {
      toast.error("Autenticação Necessária", { description: "Por favor, faça login para continuar." }); return;
    }

    setIsLoading(true);
    setProcessingState('uploading_image');
    setErrorMessage(null);
    // setCurrentJobId(null); // Já deve estar null devido ao handleFileChange ou reset no user change
    // localStorage.removeItem('currentJobId'); // Já deve estar limpo

    let tempUploadedFilePath: string | null = null;
    let tempNewJobId: string | null = null;

    try {
      const file = uploadedImage.file;
      const fileExt = file.name.split('.').pop();
      const filePath = `public/${userInfo.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error(uploadError.message || "Falha ao fazer upload da imagem.");
      if (!uploadData?.path) throw new Error("Falha ao obter o caminho da imagem após upload.");
      tempUploadedFilePath = uploadData.path;
      
      setProcessingState('creating_job');

      const transformationData: TransformationInsert = { 
        user_id: userInfo.id, style_requested: selectedStyle.id, 
        status: 'pending_payment', input_file_path: tempUploadedFilePath
      };
      const { data: jobData, error: jobError } = await supabase
        .from('transformations').insert(transformationData).select('id').single();
      if (jobError || !jobData?.id) {
        if (tempUploadedFilePath) {
          supabase.storage.from('images').remove([tempUploadedFilePath])
            .catch(delErr => console.error(`Failed to delete orphaned image ${tempUploadedFilePath}:`, delErr));
        }
        throw new Error(jobError?.message || "Falha ao criar o registo da transformação.");
      }
      tempNewJobId = jobData.id;
      
      // Guarda no localStorage ANTES de definir o estado React e redirecionar
      localStorage.setItem('currentJobId', tempNewJobId); // A página success.tsx vai precisar disto
      localStorage.setItem('studioState', JSON.stringify({ selectedStyleId: selectedStyle.id }));

      setCurrentJobId(tempNewJobId);
      setProcessingState('awaiting_payment');

      const checkoutResponse = await fetch('/api/create-checkout-session', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ jobId: tempNewJobId, userEmail: userInfo.email }), 
      });
      if (!checkoutResponse.ok) { 
        let errData = { message: `API Error (${checkoutResponse.status}) ao criar sessão.` }; 
        try { errData = await checkoutResponse.json(); } catch { /* ignore */ } 
        throw new Error(errData.message); 
      }
      const { sessionId } = await checkoutResponse.json();
      if (!sessionId) throw new Error("ID de sessão Stripe não recebido.");
      
      setProcessingState('redirecting_to_payment');

      const stripe = await getStripe();
      if (!stripe) throw new Error("Stripe.js não carregado.");
      
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) throw new Error(stripeError.message || "Falha ao redirecionar para Stripe.");

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Falha ao iniciar o processo.';
      setErrorMessage(errorMsg);
      toast.error("Erro no Processo", { description: errorMsg });
      setProcessingState('error');
      
      localStorage.removeItem('currentJobId'); 
      setCurrentJobId(null);

      if (tempNewJobId) {
        try { 
          let failureStatus = 'failed_system'; 
          if (errorMsg.toLowerCase().includes('upload')) failureStatus = 'failed_upload';
          else if (errorMsg.toLowerCase().includes('checkout') || errorMsg.toLowerCase().includes('stripe')) failureStatus = 'failed_checkout_redirect';
          else if (errorMsg.toLowerCase().includes('job') || errorMsg.toLowerCase().includes('registo')) failureStatus = 'failed_db_update';
          await supabase.from('transformations').update({ status: failureStatus, error_message: errorMsg }).eq('id', tempNewJobId);
        } catch (updateDbError) { 
          console.error("Failed to update job status in DB after error:", updateDbError); 
        }
      }
      setIsLoading(false);
    }
  }, [uploadedImage, selectedStyle, userInfo, isAuthLoading, setErrorMessage, setIsLoading, setProcessingState, setCurrentJobId]);

  const handleNewImage = useCallback(() => {
    console.log('[handleNewImage] Calling full reset.');
    resetAllLocalStates();
  }, [resetAllLocalStates]);

  const handleReset = useCallback(() => {
    console.log('[handleReset] Calling full reset (handleNewImage).');
    handleNewImage(); // handleNewImage já faz o reset completo
  }, [handleNewImage]);

  const handleDownload = useCallback(() => {
    if (!transformedImage) {
      toast.warning("Download Indisponível", { description: "A imagem final ainda não está pronta." });
      return;
    }
    const link = document.createElement('a');
    link.href = transformedImage;
    const fileNameFromUrl = transformedImage.substring(transformedImage.lastIndexOf('/') + 1);
    link.download = fileNameFromUrl || `transformed-${currentJobId || Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download iniciado!");
  }, [transformedImage, currentJobId]);

  return {
    uploadedImage, isStyleModalOpen, selectedStyle, processingState, transformedImage,
    activeStep, isLoading, errorMessage, currentJobId,
    availableStyles, stylesLoading, stylesError,
    setIsStyleModalOpen, setActiveStep,
    handleFileChange, openStyleSelector, handleStyleSelect,
    handlePaymentClick: initiatePayment,
    handleReset, handleNewImage, handleDownload
  };
}
