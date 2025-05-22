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
  | 'polling_status' // Job created, polling before processing starts on backend
  | 'processing'     // Backend confirmed processing
  | 'completed'
  | 'error';

type StatusResponse = {
  status?: string;
  output_url?: string | null;
  error_message?: string | null;
  message?: string; // For general API errors
  // Consider adding: output_metadata?: { originalDetailedErrorStatus?: string };
};

type TransformationInsert = {
  user_id: string;
  style_requested: string;
  status: string;
  input_file_path: string;
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

export type UseImageProcessingResult = ReturnType<typeof useImageProcessing>;

export function useImageProcessing() {
  const { userInfo, isLoading: isAuthLoading } = useAuth();
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // General loading for UI, distinct from processingState
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const [availableStyles, setAvailableStyles] = useState<Style[]>([]);
  const [stylesLoading, setStylesLoading] = useState<boolean>(true);
  const [stylesError, setStylesError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadAttempted = useRef(false);
  const prevUserId = useRef<string | undefined | null>(null);


  useEffect(() => {
    const fetchStyles = async () => {
      if (availableStyles.length > 0 && !stylesLoading) {
        return;
      }
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
    }
    prevUserId.current = currentUserId;
  }, [userInfo?.id]);


  useEffect(() => {
    if (initialLoadAttempted.current || stylesLoading) {
        return;
    }
    initialLoadAttempted.current = true;
    
    try {
        const savedState = localStorage.getItem('studioState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            const restoredStyleId = parsedState?.selectedStyleId;

            if (restoredStyleId && availableStyles.length > 0) {
                const style = availableStyles.find(s => s.id === restoredStyleId);
                if (style) {
                    setSelectedStyle(style);
                } else {
                    localStorage.removeItem('studioState');
                }
            }
        }
        if (!currentJobId) {
            setProcessingState('idle');
            setActiveStep(1);
            setIsLoading(false);
        }
    } catch (error) {
        console.error("❌ Erro ao carregar estado do localStorage:", error);
        localStorage.removeItem('studioState');
    }
  }, [availableStyles, stylesLoading, currentJobId]);


  useEffect(() => {
    if (!initialLoadAttempted.current) {
        return;
    }
    try {
        const stateToSave = { selectedStyleId: selectedStyle?.id || null };
        localStorage.setItem('studioState', JSON.stringify(stateToSave));
        // currentJobId is saved by initiatePayment and cleared by success.tsx or resetAllLocalStates
    } catch (error) {
        console.error("❌ Erro ao salvar estado no localStorage:", error);
    }
  }, [selectedStyle]);


  useEffect(() => {
    const POLLING_INTERVAL_MS = 5000;
    let pollCount = 0;
    const MAX_POLL_ATTEMPTS = 27; // Aprox. 2.5 minutes

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
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setIsLoading(false);
        return;
      }
      if (isAuthLoading) return; // Aguarda a autenticação carregar

      pollCount++;
      setIsLoading(true); // Indica que uma verificação está em curso

      try {
        const response = await fetch(`/api/get-transformation-status?jobId=${currentJobId}`);
        
        let data: StatusResponse = {};
        if (response.headers.get("content-type")?.includes("application/json")) {
            try {
                data = await response.json();
            } catch (jsonError) { // jsonError é usado aqui
                console.warn('[useImageProcessing] Failed to parse JSON response from get-transformation-status:', jsonError);
                const errorMsg = `Falha ao processar resposta do servidor (status: ${response.status})`;
                setErrorMessage(errorMsg);
                toast.error("Erro de Comunicação", { description: errorMsg });
                setProcessingState('error'); setActiveStep(3);
                if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null; setIsLoading(false);
                return;
            }
        }

        if (!response.ok) {
          const errorMsg = data.message || `Erro ao buscar status (${response.status})`;
          setErrorMessage(errorMsg);
          toast.error("Erro de Polling", { description: errorMsg });
          setProcessingState('error'); setActiveStep(3);
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null; setIsLoading(false);
          return;
        }
        
        if (data.status === 'error' || data.status?.startsWith('failed')) {
            const backendErrorMessage = data.error_message || 'Ocorreu uma falha desconhecida durante a transformação.';
            let userFriendlyMessage = "Ops! Algo deu errado durante a transformação. Tente novamente ou contacte o suporte.";

            if (backendErrorMessage.includes("Ficheiro inválido após pagamento")) {
                userFriendlyMessage = backendErrorMessage;
            } else if (backendErrorMessage.includes("OpenAI API Error: timeout") || backendErrorMessage.includes("OpenAI API Error")) {
                userFriendlyMessage = "Os nossos servidores de IA estão com muito tráfego ou a sua imagem demorou demasiado a processar. Por favor, verifique a sua galeria em 'Minha Conta' dentro de alguns minutos.";
            } else if (currentJobId) { 
                userFriendlyMessage = "Ocorreu um problema durante a transformação. Por favor, verifique o estado em 'Minha Conta' ou contacte o suporte se o erro persistir.";
            }

            setErrorMessage(userFriendlyMessage);
            setProcessingState('error');
            setActiveStep(3);
            toast.error("Falha na Transformação", { description: userFriendlyMessage });
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null; setIsLoading(false);

        } else if (data.status === 'completed' && data.output_url) {
          setTransformedImage(data.output_url);
          setProcessingState('completed');
          setActiveStep(3);
          toast.success("Transformação concluída!");
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null; setIsLoading(false);
        } else if (['processing', 'processing_queued', 'paid', 'pending_payment'].includes(data.status || '')) {
          if (processingState !== 'processing') { 
            setProcessingState('processing'); 
            setActiveStep(3); 
          }
          setIsLoading(true); 
        } else if (data.status && data.status !== 'idle' && data.status !== 'awaiting_payment') { 
          const unknownStatusMsg = `Status inesperado recebido: ${data.status || 'vazio'}. A verificar novamente.`;
          console.warn(`[Polling] ${unknownStatusMsg}`);
           if(processingState !== 'processing') setIsLoading(true);
        }
      } catch (error) { 
        console.error("❌ Network error during status check:", error);
        const userFriendlyNetworkError = currentJobId
            ? "Houve um problema de comunicação ao verificar o estado. Por favor, verifique sua conexão e 'Minha Conta' em breve."
            : "Erro de rede. Verifique sua conexão e tente novamente.";

        setErrorMessage(userFriendlyNetworkError);
        toast.error("Erro de Rede", { description: userFriendlyNetworkError }); // Usar a mensagem amigável
        setProcessingState('error'); 
        setActiveStep(3);
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null; setIsLoading(false);
      } finally {
        if (pollCount >= MAX_POLL_ATTEMPTS && 
            (processingState === 'polling_status' || processingState === 'processing')) {
            const timeoutUserMsg = "A sua transformação está a demorar mais que o normal. Por favor, verifique o estado em 'Minha Conta' dentro de alguns minutos.";
            setErrorMessage(timeoutUserMsg);
            setProcessingState('error'); setActiveStep(3);
            toast.error("Processamento Demorado", { description: timeoutUserMsg });
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null; setIsLoading(false);
        }
      }
    };

    if (currentJobId && (processingState === 'polling_status' || processingState === 'processing') && !isAuthLoading) {
      if (userInfo?.id) {
        if (!pollingIntervalRef.current) {
          pollCount = 0; 
          checkStatus(); 
          pollingIntervalRef.current = setInterval(checkStatus, POLLING_INTERVAL_MS);
        }
      } else if (processingState === 'polling_status' || processingState === 'processing') {
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
  }, [currentJobId, processingState, userInfo, isAuthLoading, setActiveStep, setErrorMessage, setIsLoading, setProcessingState, setTransformedImage]);


  const resetAllLocalStates = useCallback(() => {
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
  }, [setActiveStep /* Adicionado setActiveStep se ele realmente é alterado aqui, caso contrário pode ser omitido se sempre for para 1 */]);

  const handleFileChange = useCallback((file: UploadedFile | null) => {
    resetAllLocalStates();
    if (file) {
        setUploadedImage(file);
        setActiveStep(2);
    } else {
        setActiveStep(1);
    }
  }, [resetAllLocalStates, setActiveStep]); 

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
    if (uploadedImage) {
      setProcessingState('awaiting_payment');
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
    if (!userInfo?.id || !userInfo?.email) { 
      toast.error("Autenticação Necessária", { description: "Por favor, faça login para continuar." }); return;
    }

    setIsLoading(true);
    setProcessingState('uploading_image'); 
    setErrorMessage(null);

    let tempUploadedFilePath: string | null = null;
    let tempNewJobId: string | null = null;

    try {
      const file = uploadedImage.file;
      const fileExt = file.name.split('.').pop() || 'tmp';
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
      
      localStorage.setItem('currentJobId', tempNewJobId);
      localStorage.setItem('studioState', JSON.stringify({ selectedStyleId: selectedStyle.id }));

      setCurrentJobId(tempNewJobId); 

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
      setActiveStep(3); 
      
      localStorage.removeItem('currentJobId'); 
      setCurrentJobId(null); 

      if (tempNewJobId) {
        try { 
          let failureStatus = 'failed_system'; 
          if (errorMsg.toLowerCase().includes('upload')) failureStatus = 'failed_upload';
          else if (errorMsg.toLowerCase().includes('checkout') || errorMsg.toLowerCase().includes('stripe')) failureStatus = 'failed_checkout_redirect';
          else if (errorMsg.toLowerCase().includes('job') || errorMsg.toLowerCase().includes('registo')) failureStatus = 'failed_db_update';
          
          await supabase.from('transformations')
            .update({ status: failureStatus, error_message: errorMsg.substring(0,500) }) 
            .eq('id', tempNewJobId);
        } catch (updateDbError) { 
          console.error("Failed to update job status in DB after error:", updateDbError); 
        }
      }
    } finally {
        if (processingState !== 'redirecting_to_payment' && processingState !== 'completed' && processingState !== 'error') {
            setIsLoading(false); // Ensure loading is stopped if not redirecting or in a final state
        } else if (processingState === 'error' || processingState === 'completed'){
            setIsLoading(false); // Also stop loading if it's an error or completed state
        }
    }
  }, [uploadedImage, selectedStyle, userInfo, isAuthLoading, setActiveStep, processingState /* Adicionado processingState */]);

  const handleNewImage = useCallback(() => {
    resetAllLocalStates();
  }, [resetAllLocalStates]);

  const handleReset = useCallback(() => {
    handleNewImage();
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