import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { useRouter } from 'next/router';
import { UploadedFile } from './useImageUpload'; // Assuming this path is correct
import { Style } from '@/components/StyleSelectorModal'; // Assuming this path is correct
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDailyTransformations } from '@/hooks/useDailyTransformations';
import { 
  trackImageUploadStart, 
  trackImageUploadSuccess, 
  trackStyleSelectionStart, 
  trackStyleSelected,
  trackTransformationProcessStart,
  trackTransformationProcessComplete,
  trackFunnelAbandonment,
  trackDropOff,
  trackHover,
  trackFeatureAdoption,
  trackEvent,
  trackApiPerformance,
  trackError 
} from '@/lib/posthog';
import * as fpixel from '@/lib/fpixel';

// Transformações são agora gratuitas - 10 por dia
const MAX_POLL_ATTEMPTS_CONST = 36; // 36 tentativas total = max 6 minutos
// POLLING ADAPTATIVO: Intervalos progressivos otimizados para detectar jobs rápidos mais cedo
const POLLING_INTERVALS_MS = [1000, 1500, 2000, 3000, 5000, 8000]; // 1s→1.5s→2s→3s→5s→8s (OTIMIZADO)
const getPollingInterval = (attempt: number): number => {
  return POLLING_INTERVALS_MS[Math.min(attempt, POLLING_INTERVALS_MS.length - 1)];
};

// Mensagens de erro padronizadas
const STANDARD_ERROR_MESSAGE = "Pedimos desculpa, não foi possível processar a sua imagem.";
const SIMPLE_ERROR_TOAST_MESSAGE = "Falha na transformação. Tente novamente com outra imagem ou estilo diferente.";

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
  const { useTransformation, refetch: refetchDaily, status: dailyStatus } = useDailyTransformations();
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
    
    // 🚀 NOVA FÓRMULA MELHORADA: Progresso mais distribuído e fluido
    // - Inicia com 8% na primeira tentativa (mais visível)
    // - Cresce bem até 45% nos primeiros 45s
    // - Salta para 80% quando passa da fase inicial (evita "preso nos 40%")
    // - Cresce gradualmente até 92% no resto do tempo
    // - Nunca chega a 100% (só quando realmente completa)
    
    if (pollCount <= 4) {
      // Primeiros 45s: 8% -> 45% (crescimento visível)
      return 8 + (pollCount * 9); // 8, 17, 26, 35, 44%
    } else if (pollCount <= 8) {
      // 45s -> 90s: 45% -> 80% (salto para evitar "preso")
      return 45 + ((pollCount - 4) * 8.75); // 53.75, 62.5, 71.25, 80%
    } else if (pollCount <= 20) {
      // 90s -> 4min: 80% -> 88% (crescimento moderado)
      return 80 + ((pollCount - 8) * 0.67); // até 88%
    } else {
      // 4min+: 88% -> 92% (crescimento lento mas visível)
      return Math.min(92, 88 + ((pollCount - 20) * 0.4));
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
      // Silent error handling for rating fetch
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
          .select('id, name, description, example_image_url, is_limited_edition, is_active, prompt_template, order, single_person_only')
          .eq('is_active', true)
          .order('order', { ascending: true });
        if (fetchError) throw fetchError;
        setAvailableStyles(data || []);
      } catch (err: unknown) {
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
      // Silent error handling for localStorage save
    }
  }, [selectedStyle]);

  // Função para processar falhas - no novo sistema não há refunds pois transformações são grátis
  const handleFailure = useCallback(async (jobId: string) => {
    if (!jobId || !userInfo?.id) return;
    
    try {
      // No novo sistema das transformações diárias, não há necessidade de refund
      // A transformação falhada não foi "cobrada", era grátis
      await refetchDaily(); // Apenas atualizar status
    } catch (error) {
      // Silent error handling for failure processing
    }
  }, [refetchDaily, userInfo?.id]);

  // Polling effect com intervalos adaptativos
  useEffect(() => {
    const checkStatus = async () => {
      if (!currentJobId || isAuthLoading || !userInfo) return;

      pollCountRef.current += 1;
      setSimulatedProgress(calculateSimulatedProgress(pollCountRef.current));
      
      const startTime = Date.now();
      try {
        const cacheParam = pollCountRef.current > 6 ? `&_t=${Date.now()}` : ''; // Cache bypass mais cedo (era 18)
        const userParam = userInfo?.id ? `&userId=${userInfo.id}` : '';
        const apiUrl = `/api/get-transformation-status?jobId=${currentJobId}${userParam}${cacheParam}`;
        
        const response = await fetch(apiUrl);
        const responseTime = Date.now() - startTime;

        // Track API performance
        trackApiPerformance({
          user_id: userInfo?.id,
          endpoint: '/api/get-transformation-status',
          method: 'GET',
          response_time_ms: responseTime,
          status_code: response.status,
          success: response.ok,
          retry_count: pollCountRef.current
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status} ao buscar status. Sem corpo JSON.` }));
          throw new Error(errorData.message || `Erro HTTP ${response.status}`);
        }

        const data: StatusResponse = await response.json();
        
        if (data.status === 'error' || data.status?.startsWith('failed')) {
          // Track transformation failure
          trackError({
            user_id: userInfo.id,
            error_type: 'api',
            error_message: data.error_message || 'Transformation failed',
            page_path: window.location.pathname,
            user_action: 'transformation_processing',
            severity: 'medium',
            recoverable: true
          });

          // Track transformation failed event
          trackEvent('transformation_failed', {
            user_id: userInfo.id,
            job_id: currentJobId,
            error_status: data.status,
            error_message: data.error_message || 'Unknown processing error',
            poll_attempts: pollCountRef.current,
            processing_time_seconds: pollCountRef.current * 10 // Approximate time
          });

          setErrorMessage(STANDARD_ERROR_MESSAGE);
          setProcessingState('error');
          setActiveStep(3);
          toast.error("Falha na Transformação", {description: SIMPLE_ERROR_TOAST_MESSAGE});

          // Process failure automatically
          await handleFailure(currentJobId);

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsLoading(false);
        } else if (data.status === 'completed' && data.output_url) {
          // Track transformation completion
          trackEvent('transformation_completed', {
            user_id: userInfo.id,
            job_id: currentJobId,
            output_url: data.output_url,
            poll_attempts: pollCountRef.current,
            processing_time_seconds: pollCountRef.current * 10, // Approximate time
            is_free_transformation: true
          });

          setTransformedImage(data.output_url);
          setProcessingState('completed');
          setActiveStep(3);
          setSimulatedProgress(100);
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsLoading(false);
          fetchTransformationRating(currentJobId);
        } else if (data.status === 'processing' || data.status === 'in_progress') {
          // Track processing progress (only log every 5 polls to avoid spam)
          if (pollCountRef.current % 5 === 0) {
            trackEvent('transformation_progress', {
              user_id: userInfo.id,
              job_id: currentJobId,
              status: data.status,
              poll_attempts: pollCountRef.current,
              estimated_progress: calculateSimulatedProgress(pollCountRef.current)
            });
          }

          if (processingState !== 'processing') { 
            setProcessingState('processing'); 
          }

          // Schedule next poll
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            const nextInterval = getPollingInterval(pollCountRef.current);
            pollingIntervalRef.current = setTimeout(checkStatus, nextInterval);
          }
        } else if (data.status) { 
          // Unexpected status from API - silent handling
        } else {
          // API returned no status - silent handling
        }
      } catch (apiError) { 
        const responseTime = Date.now() - startTime;
        const errorMsg = apiError instanceof Error ? apiError.message : "Erro de rede ou formato de resposta inválido.";
        
        // Track API error
        trackApiPerformance({
          user_id: userInfo?.id,
          endpoint: '/api/get-transformation-status',
          method: 'GET',
          response_time_ms: responseTime,
          status_code: 500,
          success: false,
          error_type: 'network_error',
          retry_count: pollCountRef.current
        });

        trackError({
          user_id: userInfo?.id,
          error_type: 'api',
          error_message: errorMsg,
          page_path: window.location.pathname,
          user_action: 'transformation_polling',
          severity: 'medium',
          recoverable: true
        });
      }

      if (pollCountRef.current >= MAX_POLL_ATTEMPTS_CONST && 
          (processingState === 'polling_status' || processingState === 'processing')) {
        
        try { 
          const finalStoragePath = `public/${userInfo.id}/${currentJobId}`;
          const { data: files, error: finalLisError } = await supabase.storage.from('results').list(finalStoragePath, {
            limit: 1,
            sortBy: { column: 'name', order: 'desc' },
          });

          if(finalLisError){
            // Silent error handling for final check
          } else if (files && files.length > 0) {
            const fileName = files[0].name;
            const { data: urlData } = supabase.storage.from('results').getPublicUrl(`${finalStoragePath}/${fileName}`);
            
            if (urlData?.publicUrl) {
              setTransformedImage(urlData.publicUrl); 
              setProcessingState('completed'); 
            setActiveStep(3); 
              setSimulatedProgress(100);
              // Transformação encontrada - visual feedback é suficiente
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
          // Silent error handling for final storage check
        }
        
        setErrorMessage(STANDARD_ERROR_MESSAGE);
        setProcessingState('error'); 
        setActiveStep(3);
        toast.error("Processamento Demorado", { description: "A transformação demorou mais que o esperado. Tente novamente.", duration: 7000 });

        // Process failure for timeout
        await handleFailure(currentJobId);

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
        (processingState === 'polling_status' || processingState === 'processing')) {
      if (!pollingIntervalRef.current) {
        pollCountRef.current = 0; 
        checkStatus(); // Primeira verificação imediata
        // Primeira reagenda com intervalo inicial
        pollingIntervalRef.current = setTimeout(checkStatus, getPollingInterval(0));
      }
    } 
    else if (pollingIntervalRef.current && 
             !(processingState === 'polling_status' || processingState === 'processing')) {
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
  }, [currentJobId, processingState, userInfo, isAuthLoading, setActiveStep, setErrorMessage, setIsLoading, setProcessingState, setTransformedImage, fetchTransformationRating, handleFailure]);


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

  const handleFileChange = useCallback(async (file: UploadedFile | null) => {
    resetAllLocalStates();
    
    if (file) {
      // 🔥 TRACKING: Image upload start
      trackImageUploadStart({
        file_size: file.file.size,
        file_type: file.file.type,
        file_name: file.file.name,
        user_id: userInfo?.id || null
      });

      setUploadedImage(file);
        setActiveStep(2);
      
      // 🔥 TRACKING: Image upload success
      trackImageUploadSuccess({
        file_size: file.file.size,
        file_type: file.file.type,
        user_id: userInfo?.id || null
      });
    } else {
      setUploadedImage(null);
        setActiveStep(1);
    }
  }, [resetAllLocalStates, setActiveStep, setUploadedImage, userInfo?.id]);

  const openStyleSelector = useCallback(() => {
    if (uploadedImage) {
      // 🔥 TRACKING: Style selection modal opened
      trackStyleSelectionStart({
        user_id: userInfo?.id || null,
        has_uploaded_image: !!uploadedImage,
        total_styles_available: availableStyles.length
      });

      setIsStyleModalOpen(true);
    } else {
      toast.error("Por favor, carregue uma imagem primeiro.");
    }
  }, [uploadedImage, setIsStyleModalOpen, userInfo?.id, availableStyles.length]);

  const handleStyleSelect = useCallback((style: Style) => {
    // 🔥 TRACKING: Style selected
    trackStyleSelected({
      style_id: style.id,
      style_name: style.name,
      user_id: userInfo?.id || null,
      has_uploaded_image: !!uploadedImage
    });

    setSelectedStyle(style);
    setActiveStep(3); 
    setIsStyleModalOpen(false);
    setErrorMessage(null); 
    setProcessingState('idle'); 
          // Estilo selecionado - visual feedback é suficiente
  }, [setActiveStep, setSelectedStyle, setIsStyleModalOpen, setErrorMessage, setProcessingState, userInfo?.id, uploadedImage]);


  const handleStartTransformation = useCallback(async () => {
          // 🔥 TRACKING: Transformation start attempt
      trackTransformationProcessStart({
        user_id: userInfo?.id || null,
        style_id: selectedStyle?.id || null,
        style_name: selectedStyle?.name || null,
        file_size: uploadedImage?.file.size || null,
        file_type: uploadedImage?.file.type || null,
        processing_state: processingState
      });

      // 🚀 FACEBOOK PIXEL: StartTrial event (para primeira transformação)
      if (userInfo?.id && dailyStatus?.current_usage === 0) {
        fpixel.trackStartTrial({
          content_name: 'Daily Free Transformations',
          value: 5, // Valor estimado de transformações gratuitas
          currency: 'EUR',
          predicted_ltv: 25 // Lifetime value médio
        });
      }
    
    if (!uploadedImage || !selectedStyle) {
      // 🔥 TRACKING: Transformation start validation error
      trackFunnelAbandonment('transformation_start', 'missing_requirements', {
        error_type: 'missing_requirements',
        has_image: !!uploadedImage,
        has_style: !!selectedStyle,
        user_id: userInfo?.id || null
      });

      toast.error("Erro de Preparação", { description: "Por favor, carregue uma imagem e selecione um estilo antes de transformar." }); 
      return;
    }
    if (isAuthLoading) { 
      // 🔥 TRACKING: Auth loading error
      trackFunnelAbandonment('transformation_start', 'auth_loading', {
        error_type: 'auth_loading',
        user_id: userInfo?.id || null
      });

      // Aguarda silenciosamente que a autenticação termine
      return;
    }
    if (!userInfo?.id) { 
      // 🔥 TRACKING: Authentication required
      trackFunnelAbandonment('transformation_start', 'auth_required', {
        error_type: 'auth_required',
        user_id: null
      });

      toast.error("Autenticação Necessária", { description: "Por favor, faça login para transformar as suas imagens." }); 
      return;
    }

    if (!['idle', 'error', 'completed'].includes(processingState)) {
        // 🔥 TRACKING: Transformation already in progress
        trackFunnelAbandonment('transformation_start', 'already_in_progress', {
          error_type: 'already_in_progress',
          current_state: processingState,
          user_id: userInfo?.id
        });

        toast.info("Processo em Andamento", { description: "Uma transformação já está em curso ou a finalizar." });
        return;
    }

    // 🔥 TRACKING: Transformation start validated
    trackTransformationProcessStart({
      user_id: userInfo.id,
      style_id: selectedStyle.id,
      style_name: selectedStyle.name,
      file_size: uploadedImage.file.size,
      file_type: uploadedImage.file.type,
      is_free_transformation: true
    });

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
      await refetchDaily(); 
      
      // Check daily limit for free transformations
      if (!dailyStatus?.can_transform) {
        // 🔥 TRACKING: Daily limit exceeded
        trackFunnelAbandonment('transformation_start', 'daily_limit_exceeded', {
        user_id: userInfo.id,
          current_usage: dailyStatus?.current_usage || 0,
          daily_limit: dailyStatus?.daily_limit || 10,
          style_id: selectedStyle.id
        });

        const resetTime = dailyStatus?.hours_until_reset || 0;
        const hours = Math.floor(resetTime);
        const minutes = Math.floor((resetTime - hours) * 60);
        
        toast.warning("🎨 Transformações Esgotadas!", { 
          description: `Já usaste as ${dailyStatus?.daily_limit || 10} transformações de hoje! ${hours > 0 ? `Mais transformações disponíveis em ${hours}h${minutes > 0 ? ` ${minutes}m` : ''}` : `Mais transformações disponíveis em ${minutes}m`}.`,
          duration: 5000
        });
        setProcessingState('idle'); 
        setIsLoading(false);
        return;
      }

      // Tem transformações disponíveis - prosseguir
      if (dailyStatus?.can_transform) {
        // Processing transformation - progress bar is sufficient
        
        setProcessingState('uploading_image');

        // 🔥 TRACKING: Image upload to storage start
        trackImageUploadStart({
          user_id: userInfo.id,
          job_id: null, // Not created yet
          file_size: uploadedImage.file.size,
          file_type: uploadedImage.file.type
        });

        const imageFile = uploadedImage.file;
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'tmp';
      const filePath = `public/${userInfo.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images').upload(filePath, imageFile, { cacheControl: '3600', upsert: false });
        if (uploadError) {
          // 🔥 TRACKING: Image upload to storage failed
          trackImageUploadSuccess({
            user_id: userInfo.id,
            error_message: uploadError.message,
            file_size: uploadedImage.file.size,
            file_type: uploadedImage.file.type
          });

          throw new Error(uploadError.message || "Falha ao fazer upload da imagem para o storage.");
        }
      if (!uploadData?.path) {
        // 🔥 TRACKING: Upload data path missing
        trackImageUploadSuccess({
          user_id: userInfo.id,
          error_message: 'Upload data path missing',
          file_size: uploadedImage.file.size,
          file_type: uploadedImage.file.type
        });

        throw new Error("Falha ao obter o caminho da imagem após upload.");
      }
      tempUploadedFilePath = uploadData.path;

      // 🔥 TRACKING: Image upload to storage success
      trackImageUploadSuccess({
        user_id: userInfo.id,
        file_path: tempUploadedFilePath,
        file_size: uploadedImage.file.size,
        file_type: uploadedImage.file.type
      });
      
        setProcessingState('creating_job_record');

        // 🔥 TRACKING: Job creation start
        trackTransformationProcessStart({
          user_id: userInfo.id,
          style_id: selectedStyle.id,
          input_file_path: tempUploadedFilePath
        });

      const transformationData: TransformationInsert = { 
          user_id: userInfo.id, 
          style_requested: selectedStyle.id, 
          status: 'awaiting_processing', 
          input_file_path: tempUploadedFilePath
      };
      const { data: jobData, error: jobError } = await supabase
        .from('transformations').insert(transformationData).select('id').single();
        
      if (jobError || !jobData?.id) {
        // 🔥 TRACKING: Job creation failed
        trackTransformationProcessComplete({
          user_id: userInfo.id,
          error_message: jobError?.message || 'No job ID returned',
          style_id: selectedStyle.id,
          input_file_path: tempUploadedFilePath
        });

        if (tempUploadedFilePath) { 
          supabase.storage.from('images').remove([tempUploadedFilePath])
              .catch(delErr => {
                // Silent error handling for cleanup
              });
        }
          throw new Error(jobError?.message || "Falha ao criar o registo da transformação na base de dados.");
      }
      tempNewJobId = jobData.id;

      // 🔥 TRACKING: Job creation success
      trackTransformationProcessComplete({
        user_id: userInfo.id,
        job_id: tempNewJobId,
        style_id: selectedStyle.id,
        input_file_path: tempUploadedFilePath
      });
        
        setProcessingState('spending_coins');

        // 🔥 TRACKING: Daily transformation usage start
        trackEvent('daily_transformation_used', {
          user_id: userInfo.id,
          job_id: tempNewJobId,
          remaining_before: dailyStatus?.remaining_count || 0
        });

        // Consumir uma transformação diária
        const useResult = await fetch('/api/daily-transformations/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transformationId: tempNewJobId })
        });
        
        if (!useResult.ok) {
          const errorData = await useResult.json().catch(() => ({message: 'Falha ao registar transformação diária'}));
          throw new Error(errorData.message);
        }
        
        const useResultData = await useResult.json();

        // 🔥 TRACKING: Daily transformation usage success
        trackEvent('daily_transformation_success', {
          user_id: userInfo.id,
          job_id: tempNewJobId,
          remaining_after: useResultData.remaining_count || 0
        });
        
        setProcessingState('triggering_processing');
        
        // 🔥 TRACKING: Processing trigger start
        trackTransformationProcessStart({
          user_id: userInfo.id,
          job_id: tempNewJobId,
          style_id: selectedStyle.id
        });
        
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

          // 🔥 TRACKING: Processing trigger failed
          trackTransformationProcessComplete({
            user_id: userInfo.id,
            job_id: tempNewJobId,
            http_status: processImageResponse.status,
            error_message: errorBody.message
          });

          await supabase.from('transformations')
            .update({ status: 'failed_trigger' as FailureStatusDB, error_message: `Falha ao acionar /api/process-image: ${errorBody.message}`.substring(0,500) }) 
            .eq('id', tempNewJobId);
          throw new Error(`Falha ao iniciar o processamento no backend: ${errorBody.message}`);
        }

        // 🔥 TRACKING: Processing trigger success
        trackTransformationProcessComplete({
          user_id: userInfo.id,
          job_id: tempNewJobId,
          style_id: selectedStyle.id
        });
      
      localStorage.setItem('currentJobId', tempNewJobId);
      setCurrentJobId(tempNewJobId); 
        setProcessingState('polling_status'); 
        setActiveStep(3); 

        // 🔥 TRACKING: Transformation polling start
        trackTransformationProcessStart({
          user_id: userInfo.id,
          job_id: tempNewJobId,
          style_id: selectedStyle.id,
          style_name: selectedStyle.name
        });

        // Transformação iniciada - progress bar é suficiente
        
      }

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      
      // 🔥 TRACKING: Transformation error
      trackTransformationProcessComplete({
        user_id: userInfo?.id || null,
        job_id: tempNewJobId,
        error_message: errorMsg,
        error_step: processingState,
        style_id: selectedStyle?.id || null,
        file_size: uploadedImage?.file.size || null
      });

      toast.error("Ops! Algo correu mal", { description: STANDARD_ERROR_MESSAGE });
      setProcessingState('error');
      setActiveStep(3);
      setErrorMessage(errorMsg);

      // Process failure if job was created
      if (tempNewJobId && processingState !== 'checking_balance' && processingState !== 'idle') {
        await handleFailure(tempNewJobId);
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
          // Silent error handling for DB update failure
        }
      }
    } finally {
      if (!['polling_status', 'processing', 'checking_balance', 'uploading_image', 'creating_job_record', 'spending_coins', 'triggering_processing'].includes(processingState) ) {
         setIsLoading(false);
        }
    }
  }, [
    uploadedImage, selectedStyle, userInfo, isAuthLoading, processingState, 
    refetchDaily, router, handleFailure,
    setActiveStep, setErrorMessage, setIsLoading, setProcessingState, setCurrentJobId, setTransformedImage, dailyStatus
  ]);

  const handleNewImage = useCallback(() => {
    // 🔥 TRACKING: New image action
    trackTransformationProcessComplete({
      user_id: userInfo?.id || null,
      previous_job_id: currentJobId,
      previous_state: processingState
    });

    resetAllLocalStates();
  }, [resetAllLocalStates, userInfo?.id, currentJobId, processingState]);

  const handleReset = useCallback(() => {
    // 🔥 TRACKING: Reset/restart action
    trackTransformationProcessComplete({
      user_id: userInfo?.id || null,
      previous_job_id: currentJobId,
      previous_state: processingState,
      had_transformed_image: !!transformedImage
    });

    handleNewImage();
  }, [handleNewImage, userInfo?.id, currentJobId, processingState, transformedImage]);

  const handleDownload = useCallback(async () => {
    if (!transformedImage) {
      // 🔥 TRACKING: Download attempt with no image
      trackTransformationProcessComplete({
        user_id: userInfo?.id || null,
        job_id: currentJobId
      });

      toast.error("Nenhuma imagem transformada para baixar.");
      return;
    }

    // 🔥 TRACKING: Download start
    trackTransformationProcessComplete({
      user_id: userInfo?.id || null,
      job_id: currentJobId,
      style_name: selectedStyle?.name || null,
      output_url: transformedImage
    });

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
      
      // 🔥 TRACKING: Download success
      trackTransformationProcessComplete({
        user_id: userInfo?.id || null,
        job_id: currentJobId,
        style_name: selectedStyle?.name || null,
        file_name: link.download,
        file_size: blob.size
      });
      
      // Imagem baixada - a ação de download é feedback suficiente
    } catch (error) {
      // 🔥 TRACKING: Download error
      trackTransformationProcessComplete({
        user_id: userInfo?.id || null,
        job_id: currentJobId,
        error_message: error instanceof Error ? error.message : 'Unknown download error',
        output_url: transformedImage
      });

      toast.error("❌ Erro ao baixar imagem. Tente novamente.");
      
      // Fallback - abrir em nova aba se download direto falhar
      window.open(transformedImage, '_blank', 'noopener,noreferrer');
      toast.info("📱 Imagem aberta em nova aba para download manual");
    }
  }, [transformedImage, selectedStyle, userInfo?.id, currentJobId]);

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
