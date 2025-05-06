import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
// Optional: Import Supabase client for user session check if needed
// import { createServerClient, type CookieOptions } from '@supabase/ssr'
// import { cookies } from 'next/headers' // If using Next.js App Router style session handling

type ResponseData = {
  status?: string;
  output_url?: string | null;
  error_message?: string | null;
  message?: string; // For general errors
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log('[API get-transformation-status] Received request');

  if (req.method !== 'GET') {
    console.warn('[API get-transformation-status] Method not allowed:', req.method);
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { jobId } = req.query;

  if (!jobId || typeof jobId !== 'string') {
    console.error('[API get-transformation-status] Missing or invalid jobId query parameter.');
    return res.status(400).json({ message: 'Missing or invalid jobId query parameter' });
  }

  console.log(`[API get-transformation-status] Fetching status for jobId: ${jobId}`);

  // --- Security Check (Choose ONE method) ---
  // Method 1: Assume RLS protects the data via Supabase Client (Simpler if RLS is set up)
  //           Requires using the client SDK and handling user sessions.
  // Method 2: Use Supabase Admin Client and verify user ownership server-side (More explicit)
  //           Requires getting the authenticated user server-side.

  // Example using Method 2 (Admin Client + User Check - Requires session handling)
  // This part depends heavily on how you handle auth server-side in API routes.
  // If using Supabase SSR helpers:
  /*
  const cookieStore = cookies() // Requires Next.js headers()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
      console.error('[API get-transformation-status] Not authenticated.');
      return res.status(401).json({ message: 'Not authenticated' });
  }
  const userId = session.user.id;
  console.log(`[API get-transformation-status] Authenticated user: ${userId}`);
  */
  // --- End Security Check Example ---

  try {
    // Fetch only necessary fields using Admin client (bypasses RLS unless user check is added)
    const { data, error } = await supabaseAdmin
      .from('transformations')
      .select('status, output_url, error_message, user_id') // Select user_id for ownership check if needed
      .eq('id', jobId)
      .single(); // Expecting one result

    if (error) {
      if (error.code === 'PGRST116') { // Code for "Not found"
         console.warn(`[API get-transformation-status] Job not found: ${jobId}`);
         return res.status(404).json({ message: 'Job not found' });
      }
      console.error(`[API get-transformation-status] Supabase error fetching job ${jobId}:`, error);
      throw error; // Throw to be caught below
    }

    if (!data) { // Should be caught by PGRST116, but as fallback
        console.warn(`[API get-transformation-status] Job data unexpectedly null for ${jobId}`);
        return res.status(404).json({ message: 'Job not found' });
    }

    // --- Optional: Verify Ownership (if using Admin Client without RLS) ---
    /*
    if (data.user_id !== userId) { // Compare fetched user_id with authenticated userId
        console.error(`[API get-transformation-status] User ${userId} attempted to access job ${jobId} owned by ${data.user_id}.`);
        return res.status(403).json({ message: 'Forbidden: You do not own this job.' });
    }
    console.log(`[API get-transformation-status] Ownership verified for job ${jobId}.`);
    */
    // --- End Ownership Verification ---


    console.log(`[API get-transformation-status] Status for job ${jobId}: ${data.status}, URL: ${data.output_url}, Error: ${data.error_message}`);

    // Return the relevant data
    return res.status(200).json({
      status: data.status,
      output_url: data.output_url,
      error_message: data.error_message,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    console.error(`[API get-transformation-status] Failed to get transformation status for job ${jobId}:`, errorMessage);
    return res.status(500).json({ message: 'Failed to get transformation status' });
  }
}

import { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import { toast } from '@/components/ui/sonner';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Style } from '@/components/StyleSelectorModal';
// import { useProcessingSimulation } from './useProcessingSimulation'; // REMOVED Simulation
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UploadedFile } from '@/hooks/useImageUpload';

// Define the processing states, ensure they match your Supabase enum
type ProcessingState =
  | 'idle'
  | 'creating_job'
  | 'uploading_image'
  | 'awaiting_payment'
  | 'redirecting_to_payment'
  | 'polling_status' // New state for when we are actively checking status
  | 'processing' // Can be set by polling if backend is processing
  | 'completed'
  | 'error';

// Define a type for the status API response
type StatusResponse = {
  status?: string;
  output_url?: string | null;
  error_message?: string | null;
  message?: string; // General API errors
};


type TransformationInsert = {
  user_id: string;
  style_requested: string;
  status: string;
  input_file_path: string;
};

// --- getSessionId function remains the same ---
const getSessionId = () => {
  let sessionId = localStorage.getItem('anonymous_session_id');
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('anonymous_session_id', sessionId);
  }
  return sessionId;
};


// --- getStripe function remains the same ---
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
  const [isLoading, setIsLoading] = useState(false); // General loading (e.g., during payment init, polling)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const [availableStyles, setAvailableStyles] = useState<Style[]>([]);
  const [stylesLoading, setStylesLoading] = useState<boolean>(true);
  const [stylesError, setStylesError] = useState<string | null>(null);

  // Ref to store the polling interval ID
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // REMOVED useProcessingSimulation hook

  // --- useEffect hooks for localStorage and fetching styles remain the same ---
  useEffect(() => {
    console.log('[Effect localStorage Load] Running. Available styles count:', availableStyles.length);
    try {
      const savedState = localStorage.getItem('studioState');
      const savedJobId = localStorage.getItem('currentJobId'); // Also load Job ID

      console.log('[Effect localStorage Load] Found saved state:', savedState);
      console.log('[Effect localStorage Load] Found saved Job ID:', savedJobId);

      if (savedJobId) {
         setCurrentJobId(savedJobId);
         // If we have a job ID on load, immediately try to check its status
         // Set appropriate initial state (e.g., polling or processing)
         // This handles cases where the user closed the tab and came back
         setProcessingState('polling_status'); // Start polling immediately
         setActiveStep(3); // Assume we are at the result step
         setIsLoading(true); // Indicate loading while polling starts
         console.log(`[Effect localStorage Load] Restored Job ID ${savedJobId}, setting state to polling_status.`);
      }

      if (savedState) {
        const { selectedStyleId } = JSON.parse(savedState);
        console.log('[Effect localStorage Load] Parsed selectedStyleId:', selectedStyleId);
        if (selectedStyleId && availableStyles.length > 0) {
          console.log('[Effect localStorage Load] Trying to find style for ID:', selectedStyleId);
          const style = availableStyles.find(s => s.id === selectedStyleId);
          if (style) {
            if (!selectedStyle) {
              console.log('[Effect localStorage Load] Found style, setting state:', style.name);
              setSelectedStyle(style);
              // If we restored a job ID above, we already set the step/state
              if (!savedJobId) {
                 // If only style was saved, maybe set step to 3? Depends on desired flow.
                 // setActiveStep(3);
                 // setProcessingState('awaiting_payment'); // Or 'creating_job'?
              }
            } else {
              console.log('[Effect localStorage Load] Style already selected by user, ignoring localStorage style.');
            }
          } else {
            console.log('[Effect localStorage Load] Style ID from localStorage not found in available styles.');
          }
        } else {
          console.log('[Effect localStorage Load] Skipping style set (no ID or styles not loaded).');
        }
      }
    } catch (error) {
      console.error("Erro ao carregar estado do localStorage:", error);
    }
    // Run only once on mount after styles are loaded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableStyles]);

  // Save state (including Job ID) to localStorage
  useEffect(() => {
    console.log('[Effect localStorage Save] Running. Selected style:', selectedStyle?.name, 'Job ID:', currentJobId);
    try {
      const stateToSave = {
        selectedStyleId: selectedStyle?.id || null
      };
      localStorage.setItem('studioState', JSON.stringify(stateToSave));
      if (currentJobId) {
         localStorage.setItem('currentJobId', currentJobId);
      } else {
         localStorage.removeItem('currentJobId'); // Remove if no job ID
      }
      console.log('[Effect localStorage Save] Saved state:', stateToSave, 'Job ID:', currentJobId);
    } catch (error) {
      console.error("Erro ao salvar estado no localStorage:", error);
    }
  }, [selectedStyle, currentJobId]); // Save when style or job ID changes

  // Fetch styles
  useEffect(() => {
    const fetchStyles = async () => {
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
        console.log('[Effect fetchStyles] Styles fetched successfully:', data?.length || 0);
        setAvailableStyles(data || []);
      } catch (error: unknown) {
        console.error("Erro ao buscar estilos:", error);
        const errorMessage = error instanceof Error ? error.message : 'Falha ao carregar estilos.';
        setStylesError(errorMessage);
        setAvailableStyles([]);
      } finally {
        setStylesLoading(false);
      }
    };
    fetchStyles();
  }, []);


  // --- Polling Effect ---
  useEffect(() => {
    // Function to check job status
    const checkStatus = async () => {
      if (!currentJobId) {
        console.warn('[Polling Effect] No currentJobId, stopping polling.');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }

      console.log(`[Polling Effect] Checking status for job: ${currentJobId}`);
      setIsLoading(true); // Indicate loading during check
      try {
        const response = await fetch(`/api/get-transformation-status?jobId=${currentJobId}`);
        const data: StatusResponse = await response.json();

        if (!response.ok) {
          console.error(`[Polling Effect] API error fetching status for ${currentJobId}. Status: ${response.status}, Message: ${data.message}`);
          // Decide how to handle API errors during polling
          // Option 1: Stop polling on error
          // throw new Error(data.message || `Failed to fetch status (HTTP ${response.status})`);
          // Option 2: Log and continue polling (might retry indefinitely)
          setErrorMessage(data.message || `Erro ao buscar status (${response.status})`);
          // Don't stop polling here, maybe the API will recover?
          return; // Exit this check, wait for next interval
        }

        console.log(`[Polling Effect] Received status for ${currentJobId}: ${data.status}`);

        // Process the received status
        if (data.status === 'completed' && data.output_url) {
          console.log(`[Polling Effect] Job ${currentJobId} completed! Output URL: ${data.output_url}`);
          setTransformedImage(data.output_url);
          setProcessingState('completed');
          setActiveStep(3); // Ensure we are on the result step
          toast.success("Transformação concluída!");
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); // Stop polling
          pollingIntervalRef.current = null;
          setIsLoading(false); // Stop loading
        } else if (data.status?.startsWith('failed')) {
          console.error(`[Polling Effect] Job ${currentJobId} failed! Reason: ${data.error_message}`);
          setErrorMessage(data.error_message || 'A transformação falhou.');
          setProcessingState('error');
          setActiveStep(3); // Show error on result step
          toast.error("Falha na Transformação", { description: data.error_message || 'Ocorreu um erro inesperado.' });
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); // Stop polling
          pollingIntervalRef.current = null;
          setIsLoading(false); // Stop loading
        } else if (data.status === 'processing' || data.status === 'processing_queued' || data.status === 'paid') {
           // Still processing, update state if needed (e.g., show 'processing' instead of 'polling_status')
           if (processingState !== 'processing') {
              setProcessingState('processing');
              setActiveStep(3); // Ensure we show processing on step 3
           }
           console.log(`[Polling Effect] Job ${currentJobId} is still '${data.status}'. Continuing polling.`);
           // Keep polling, isLoading might remain true or be set based on 'processing' state UI
           setIsLoading(true); // Keep loading indicator active while processing/polling
        } else {
           // Handle other statuses if necessary (e.g., 'pending_payment' shouldn't normally be seen here)
           console.warn(`[Polling Effect] Job ${currentJobId} has unexpected status: ${data.status}. Continuing polling.`);
           // Keep polling
           setIsLoading(true);
        }

      } catch (error) {
        console.error(`[Polling Effect] Network error fetching status for ${currentJobId}:`, error);
        setErrorMessage("Erro de rede ao verificar o estado da transformação.");
        // Option 1: Stop polling on network error
        // setProcessingState('error');
        // if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        // pollingIntervalRef.current = null;
        // setIsLoading(false);
        // Option 2: Continue polling (might retry indefinitely)
      } finally {
         // Optional: Set isLoading to false between polls if you only want loading during the fetch itself
         // setIsLoading(false);
      }
    };

    // Start polling only if we have a jobId and the state indicates processing/polling should occur
    if (currentJobId && (processingState === 'polling_status' || processingState === 'processing')) {
       // Clear any existing interval before starting a new one
       if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
       }
       console.log(`[Polling Effect] Starting polling interval for job ${currentJobId}`);
       // Check immediately first
       checkStatus();
       // Then set interval
       pollingIntervalRef.current = setInterval(checkStatus, 5000); // Check every 5 seconds
    }

    // Cleanup function: clear interval when component unmounts or dependencies change
    return () => {
      if (pollingIntervalRef.current) {
        console.log('[Polling Effect] Clearing polling interval.');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentJobId, processingState]); // Rerun effect if jobId or state changes


  // --- handleFileChange remains the same ---
  const handleFileChange = useCallback((file: UploadedFile | null) => {
    console.log('[handleFileChange] File changed:', file ? file.file.name : 'null');
    setUploadedImage(file);
    if (activeStep <= 1 || !selectedStyle) {
      console.log('[handleFileChange] Resetting style, state, etc. (Initial upload)');
      setSelectedStyle(null);
      setProcessingState('idle');
      setTransformedImage(null);
      setErrorMessage(null);
      setCurrentJobId(null); // Reset Job ID on new file upload
      setActiveStep(file ? 2 : 1);
      // Clear polling interval if a new image is uploaded
      if (pollingIntervalRef.current) {
         clearInterval(pollingIntervalRef.current);
         pollingIntervalRef.current = null;
      }
    } else {
      console.warn('[handleFileChange] Called again after style selection. Ignoring state reset.');
    }
  }, [activeStep, selectedStyle]);

  // --- openStyleSelector remains the same ---
   const openStyleSelector = useCallback(() => {
     console.log('[openStyleSelector] Attempting to open modal. Image uploaded?', !!uploadedImage);
     if (uploadedImage) {
       setIsStyleModalOpen(true);
     } else {
       toast.error("Por favor, carregue uma imagem primeiro.");
     }
   }, [uploadedImage]);

  // --- handleStyleSelect remains the same ---
  const handleStyleSelect = useCallback((style: Style) => {
    console.log('[handleStyleSelect] Started. Received style:', style?.name, style?.id);
    console.log('[handleStyleSelect] Current state before update:', { selectedStyle: selectedStyle?.name, processingState, activeStep });
    setSelectedStyle(style);
    setProcessingState('creating_job'); // Ready to create job/upload image
    setActiveStep(3); // Move to the payment/result area visually
    setIsStyleModalOpen(false);
    setErrorMessage(null);
    console.log('[handleStyleSelect] States set. Setting style to:', style.name);
    toast.success(`Estilo "${style.name}" selecionado!`);
  }, [selectedStyle, processingState, activeStep]);


  // --- initiatePayment remains largely the same ---
  // (Ensure status 'pending_payment' exists in your enum)
  const initiatePayment = useCallback(async () => {
    console.log('[initiatePayment] Function called.');
    console.log('[initiatePayment] Checking values:', { hasUploadedImage: !!uploadedImage, hasSelectedStyle: !!selectedStyle, isAuthLoading: isAuthLoading, hasUser: !!userInfo });

    if (!uploadedImage || !selectedStyle || isAuthLoading || !userInfo) {
      // Handle checks and toasts as before...
       if (!uploadedImage || !selectedStyle) toast.error("Erro", { description: "Imagem ou estilo não selecionados." });
       if (isAuthLoading) toast.info("Aguarde", { description: "A verificar autenticação..." });
       if (!userInfo) toast.error("Autenticação Necessária", { description: "Por favor, faça login para continuar." });
      return;
    }

    console.log("[initiatePayment] Checks passed. Initiating payment flow...");
    setIsLoading(true);
    setProcessingState('uploading_image');
    setErrorMessage(null);
    setCurrentJobId(null); // Reset just in case

    let uploadedFilePath: string | null = null;
    let newJobId: string | null = null;

    try {
      // 1. Upload Image
      console.log("[initiatePayment] Uploading image to Supabase Storage...");
      const file = uploadedImage.file;
      const fileExt = file.name.split('.').pop();
      const filePath = `public/${userInfo.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error(uploadError.message || "Falha ao fazer upload da imagem.");
      if (!uploadData?.path) throw new Error("Falha ao obter o caminho da imagem após upload.");
      uploadedFilePath = uploadData.path;
      console.log(`[initiatePayment] ✅ Image uploaded successfully. Path: ${uploadedFilePath}`);
      setProcessingState('creating_job');

      // 2. Create Job Record
      console.log("[initiatePayment] Creating job record in Supabase with image path...");
      const transformationData: TransformationInsert = {
        user_id: userInfo.id,
        style_requested: selectedStyle.id,
        status: 'pending_payment', // Ensure exists in enum
        input_file_path: uploadedFilePath
      };
      const { data: jobData, error: jobError } = await supabase
        .from('transformations')
        .insert(transformationData)
        .select('id')
        .single();
      if (jobError || !jobData?.id) {
        if (uploadedFilePath) {
           console.warn(`[initiatePayment] Job creation failed, attempting to delete uploaded image: ${uploadedFilePath}`);
           supabase.storage.from('images').remove([uploadedFilePath]).catch(delErr => console.error(`[initiatePayment] Failed to delete orphaned image ${uploadedFilePath}:`, delErr));
        }
        throw new Error(jobError?.message || "Falha ao criar o registo da transformação.");
      }
      newJobId = jobData.id;
      setCurrentJobId(newJobId); // Set the Job ID for polling later
      console.log(`[initiatePayment] ✅ Job record created with ID: ${newJobId}`);
      setProcessingState('awaiting_payment');

      // 3. Create Stripe Session
      console.log("[initiatePayment] Calling API to create Stripe session...");
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: newJobId, userEmail: userInfo.email }),
      });
      console.log(`[initiatePayment] API Response Status: ${response.status}`);
      if (!response.ok) {
        let errorData = { message: `Falha ao criar sessão de pagamento (Status: ${response.status})` };
        try { errorData = await response.json(); } catch (e) { /* ignore */ }
        throw new Error(errorData.message);
      }
      const { sessionId } = await response.json();
      if (!sessionId) throw new Error("Não foi possível obter o ID da sessão de pagamento.");
      console.log(`[initiatePayment] ✅ Stripe session created: ${sessionId}`);
      setProcessingState('redirecting_to_payment');

      // 4. Redirect to Stripe
      console.log("[initiatePayment] Redirecting to Stripe Checkout...");
      const stripe = await getStripe();
      if (!stripe) throw new Error("Não foi possível carregar o Stripe.");
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) throw new Error(stripeError.message || "Falha ao redirecionar para o pagamento.");
      // User is redirected... no more code runs here on success

    } catch (error) {
      console.error("[initiatePayment] Payment initiation flow failed:", error);
      const errorMsg = error instanceof Error ? error.message : 'Falha ao iniciar o processo.';
      setErrorMessage(errorMsg);
      toast.error("Erro", { description: errorMsg });
      setProcessingState('error');
      if (newJobId) { // Try to update job status if created
        try {
          let failureStatus = 'failed_system'; // Ensure exists
          if (errorMsg.toLowerCase().includes('upload')) failureStatus = 'failed_upload';
          else if (errorMsg.toLowerCase().includes('checkout') || errorMsg.toLowerCase().includes('pagamento')) failureStatus = 'failed_checkout_redirect';
          else if (errorMsg.toLowerCase().includes('job') || errorMsg.toLowerCase().includes('transformação')) failureStatus = 'failed_db_update';
          console.log(`[initiatePayment] Attempting to update job ${newJobId} status to '${failureStatus}' after error.`);
          await supabase.from('transformations').update({ status: failureStatus, error_message: errorMsg }).eq('id', newJobId);
        } catch (updateError) { console.error("[initiatePayment] Failed to update job status after error:", updateError); }
      }
      setIsLoading(false);
    }
  }, [uploadedImage, selectedStyle, userInfo, isAuthLoading]);


  // REMOVED handleTransformImage and handleSimulatedPaymentClick


  // --- handleReset, handleNewImage, handleDownload remain the same ---
   const handleReset = useCallback(() => {
       setProcessingState('awaiting_payment');
       setTransformedImage(null);
       setErrorMessage(null);
       setIsLoading(false);
       // Clear polling interval if resetting
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
   }, []);

   const handleNewImage = useCallback(() => {
       setUploadedImage(null);
       setSelectedStyle(null);
       setProcessingState('idle');
       setTransformedImage(null);
       setErrorMessage(null);
       setCurrentJobId(null); // Reset Job ID
       setActiveStep(1);
       setIsLoading(false);
       localStorage.removeItem('studioState'); // Clear saved state
       localStorage.removeItem('currentJobId'); // Clear saved Job ID
       // Clear polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
   }, []);

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
    stylesLoading,
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
