import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

// Estados possíveis desta página
type SuccessProcessingState =
  | 'initializing'
  | 'awaiting_auth'
  | 'auth_failed'
  | 'verifying_payment'
  | 'polling_status' // Estado onde o polling está ativamente a ser preparado/executado
  | 'processing'     // Estado visual enquanto o backend processa (polling continua)
  | 'completed'
  | 'error';

// Tipos de resposta da API
type StatusResponse = {
  status?: string;
  output_url?: string | null;
  error_message?: string | null;
  message?: string; // Mensagem genérica da API
};

// Dados do job concluído
type CompletedJobData = {
  outputUrl: string;
  jobId: string;
};

// Constantes para polling
const POLLING_INTERVAL_MS = 3000; // 3 segundos
const MAX_POLL_ATTEMPTS = 120;    // 120 tentativas (6 minutos)

const SuccessPage = (): JSX.Element => {
  const router = useRouter();
  const { userInfo, isLoading: isAuthLoading } = useAuth();

  const [pageState, setPageState] = useState<SuccessProcessingState>('initializing');
  const [loadingMessage, setLoadingMessage] = useState('A carregar detalhes da transformação...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedJobData, setCompletedJobData] = useState<CompletedJobData | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef<number>(0);
  const hasVerifiedPayment = useRef<boolean>(false); // Para garantir que a verificação de pagamento só ocorre uma vez

  // Função para parar o polling e limpar o localStorage
  const stopPollingAndCleanup = useCallback((finalState: 'completed' | 'error') => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log(`[SuccessPage Cleanup] Polling STOPPED. Final state: ${finalState}, JobID: ${jobId}`);
    }
    // Limpa o localStorage apenas se o job foi concluído com sucesso ou deu erro definitivo.
    if (finalState === 'completed' || finalState === 'error') {
      try {
        console.log('[SuccessPage Cleanup] Removing localStorage items for completed/failed job...');
        localStorage.removeItem('currentJobId');
        localStorage.removeItem('studioState'); // Limpa também o estado do estúdio relacionado
      } catch (e) {
        console.error('[SuccessPage Cleanup] Error removing localStorage items:', e);
      }
    }
  }, [jobId]); // Adicionado jobId para o log, caso seja útil

  // Navega para a página inicial
  const navigateToHome = useCallback(() => {
    stopPollingAndCleanup('error'); // Considera um erro se o utilizador sair antes de completar
    // Usa router.push em vez de window.location.href para navegação client-side
    router.push('/');
  }, [stopPollingAndCleanup, router]);

  // Handler para download da imagem
  const handleDownload = useCallback(() => {
    if (!completedJobData?.outputUrl) return;
    toast.info("Preparando download...");
    fetch(completedJobData.outputUrl, {
      method: 'GET',
      mode: 'cors', // Tenta com CORS
      cache: 'no-cache',
    })
    .then(response => {
      if (!response.ok) throw new Error(`Falha ao buscar imagem: ${response.status}`);
      return response.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `transformacao-${completedJobData.jobId?.slice(0, 8) || Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download iniciado!");
    })
    .catch(error => {
      console.error("[Download Error - Fetch Attempt]", error);
      // Fallback para download direto se o fetch falhar (ex: CORS)
      const link = document.createElement('a');
      link.href = completedJobData.outputUrl; // URL direta
      link.download = `transformacao-${completedJobData.jobId?.slice(0, 8) || Date.now()}.png`;
      link.target = "_blank"; // Ajuda em alguns browsers
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.warning("Download via URL direto iniciado. Se não funcionar, tente clicar com botão direito na imagem e selecionar 'Salvar imagem como...'");
    });
  }, [completedJobData]);

  // Função para verificar diretamente no Supabase Storage
  const checkDirectlyInSupabase = useCallback(async (jobIdToCheck: string, userId?: string) => {
    console.log(`[SuccessPage DirectCheck] Attempting direct Supabase check for job ${jobIdToCheck}`);
    try {
      const effectiveUserId = userId || userInfo?.id;
      if (!effectiveUserId) {
        console.warn('[SuccessPage DirectCheck] No user ID available for direct Supabase check');
        return false;
      }
      const { data: results, error } = await supabase
        .storage
        .from('results') // Nome do seu bucket de resultados
        .list(`public/${effectiveUserId}/${jobIdToCheck}`, { // Caminho correto
          limit: 1,
          sortBy: { column: 'name', order: 'desc' },
        });

      if (error) {
        console.error('[SuccessPage DirectCheck] Error checking Supabase storage:', error);
        return false;
      }

      if (results && results.length > 0) {
        const fileName = results[0].name;
        console.log(`[SuccessPage DirectCheck] Found file in Supabase: ${fileName}`);
        const { data: urlData } = supabase // Removido await desnecessário aqui
          .storage
          .from('results')
          .getPublicUrl(`public/${effectiveUserId}/${jobIdToCheck}/${fileName}`);

        if (urlData?.publicUrl) {
          console.log(`[SuccessPage DirectCheck] Generated public URL: ${urlData.publicUrl}`);
          setCompletedJobData({ outputUrl: urlData.publicUrl, jobId: jobIdToCheck });
          // Apenas atualiza o estado se ainda não estiver 'completed' para evitar loops
          if (pageState !== 'completed') {
            setPageState('completed');
          }
          toast.success("Imagem encontrada no sistema (verificação direta)!");
          stopPollingAndCleanup('completed'); // Para o polling aqui
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('[SuccessPage DirectCheck] Exception during Supabase check:', e);
      return false;
    }
  }, [userInfo, stopPollingAndCleanup, pageState]); // pageState adicionado para evitar setPageState desnecessário

  // Função para verificar o estado do job
  const checkJobStatus = useCallback(async (jobIdToCheck: string) => {
    // Não faz polling se já tivermos um resultado ou erro terminal
    if (completedJobData || pageState === 'error' || pageState === 'completed') {
      console.log(`[Polling Aborted] Job already completed or in error state. State: ${pageState}, JobID: ${jobIdToCheck}`);
      // Garante que o polling é parado se por alguma razão ainda estiver ativo
      if (pageState === 'completed' || pageState === 'error') {
        stopPollingAndCleanup(pageState);
      }
      return;
    }

    pollCountRef.current += 1;
    const currentPollCount = pollCountRef.current;

    // Tenta verificação direta no Supabase a cada X tentativas (exceto na primeira)
    if (currentPollCount % 3 === 0 && currentPollCount > 1) {
      console.log(`[Polling #${currentPollCount}] Attempting direct check in Supabase for job ${jobIdToCheck}...`);
      const found = await checkDirectlyInSupabase(jobIdToCheck);
      if (found) return; // Se encontrado, checkDirectlyInSupabase já parou o polling
    }

    // Verifica o limite máximo de tentativas
    if (currentPollCount > MAX_POLL_ATTEMPTS) {
      console.error(`[Polling #${currentPollCount}] Max poll attempts reached for ${jobIdToCheck}.`);
      const found = await checkDirectlyInSupabase(jobIdToCheck); // Última tentativa direta
      if (found) return;
      
      // Type assertion to fix narrowing issue
      if ((pageState as SuccessProcessingState) !== 'error') {
        setErrorMessage(`Não foi possível obter o estado final após ${MAX_POLL_ATTEMPTS} tentativas. Tente verificar na página de "Minhas Fotos" mais tarde.`);
        setPageState('error');
      }
      stopPollingAndCleanup('error'); // Para o polling
      return;
    }
    
    console.log(`[Polling #${currentPollCount}/${MAX_POLL_ATTEMPTS}] Checking API status for job ${jobIdToCheck}... Current PageState: ${pageState}`);
    if (pageState === 'polling_status' || pageState === 'processing') { // Só atualiza mensagem se estiver nestes estados
      // Mantendo uma mensagem mais estável e mágica conforme solicitado
      setLoadingMessage('A sua imagem está a ser preparada...');
    }
    
    try {
      let apiUrl = `/api/get-transformation-status?jobId=${jobIdToCheck}`;
      if (userInfo?.id) { // Adiciona userId se disponível
        apiUrl += `&userId=${userInfo.id}`;
      }
      
      console.log(`[Polling #${currentPollCount}] Calling API: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: {
          'x-from-success-page': 'true', // Header para lógica de fallback na API
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      let data: StatusResponse = {};
      if (response.headers.get("content-type")?.includes("application/json")) {
        try { 
          data = await response.json(); 
          console.log(`[Polling #${currentPollCount}] API Response for ${jobIdToCheck}:`, JSON.stringify(data));
        } catch (e) { 
          console.error(`[Polling #${currentPollCount}] Failed to parse JSON response for job ${jobIdToCheck}`, e);
          // Não para o polling aqui, apenas loga e continua, pode ser erro temporário.
          // A próxima tentativa pode funcionar, ou MAX_POLL_ATTEMPTS será atingido.
          return; 
        }
      } else if (!response.ok) { // Se não for JSON e não estiver OK
        console.error(`[Polling #${currentPollCount}] API Error for ${jobIdToCheck}: Status ${response.status}, Content-Type: ${response.headers.get("content-type")}`);
        // Não para o polling aqui, apenas loga e continua.
        return;
      }

      // Se a resposta não foi OK (mesmo que seja JSON com erro)
      if (!response.ok) {
        const apiErrorMsg = data.message || `Erro API (${response.status})`;
        console.error(`[Polling #${currentPollCount}] API error for job ${jobIdToCheck}: Status ${response.status}, Message: ${apiErrorMsg}`);
        
        const found = await checkDirectlyInSupabase(jobIdToCheck); // Tenta verificação direta
        if (found) return;
        
        // Para o polling se o erro for de autenticação/autorização ou não encontrado, ou após muitas tentativas
        if (response.status === 401 || response.status === 403 || response.status === 404 || currentPollCount > 20) {
          if ((pageState as SuccessProcessingState) !== 'error') {
            setErrorMessage(apiErrorMsg);
            setPageState('error');
          }
          stopPollingAndCleanup('error');
        }
        return; // Continua polling para outros erros temporários se não atingiu o limite de 20
      }

      console.log(`[Polling #${currentPollCount}] Received API status for ${jobIdToCheck}: ${data.status}, URL: ${data.output_url || 'none'}`);

      // Lógica para tratar o status recebido
      if (data.output_url && data.output_url.startsWith('http')) { // Prioriza a URL de output
        console.log(`[Polling #${currentPollCount}] Output URL found for ${jobIdToCheck}, treating as completed.`);
        setCompletedJobData({ outputUrl: data.output_url, jobId: jobIdToCheck });
        if ((pageState as SuccessProcessingState) !== 'completed') setPageState('completed');
        toast.success("Transformação concluída!");
        stopPollingAndCleanup('completed'); // Para o polling
        return; // Sai da função checkJobStatus
      }
      
      if ((data.status === 'completed' || data.status?.startsWith('completed')) && data.output_url) {
        console.log(`[Polling #${currentPollCount}] Job ${jobIdToCheck} completed with output URL.`);
        setCompletedJobData({ outputUrl: data.output_url, jobId: jobIdToCheck });
        if ((pageState as SuccessProcessingState) !== 'completed') setPageState('completed');
        toast.success("Transformação concluída!");
        stopPollingAndCleanup('completed'); // Para o polling
      } else if (data.status?.startsWith('failed') || data.status === 'error') {
        console.error(`[Polling #${currentPollCount}] Job ${jobIdToCheck} failed. Reason: ${data.error_message}`);
        if ((pageState as SuccessProcessingState) !== 'error') {
          setErrorMessage(data.error_message || 'A transformação falhou.');
          setPageState('error');
        }
        toast.error("Falha na Transformação", { description: data.error_message || 'Erro.' });
        stopPollingAndCleanup('error'); // Para o polling
      } else if (data.status === 'pending_payment') {
        // Se o estado não mudou para 'processing', atualize.
        if (pageState !== 'processing' && pageState !== 'verifying_payment') { // Evita voltar de verifying_payment
          setPageState('processing'); // Ou um estado visual específico para 'pending_payment'
        }
        setLoadingMessage('A sua magia está a aguardar confirmação de pagamento...');
        // O polling continua
      } else if (['processing', 'processing_queued', 'paid', 'pending'].includes(data.status || '')) {
        // Se o estado não mudou para 'processing', atualize.
        if (pageState !== 'processing') {
          setPageState('processing');
        }
        setLoadingMessage('A sua magia está a ser preparada...');
        // O polling continua
      } else { // Status desconhecido ou inesperado
        console.warn(`[Polling #${currentPollCount}] Unexpected status for ${jobIdToCheck}: ${data.status}. Assuming still processing.`);
        if (pageState !== 'processing') { // Garante que está em estado de processamento visualmente
          setPageState('processing');
        }
        setLoadingMessage('A sua magia está a ser preparada...');
        // O polling continua
      }
    } catch (error) { // Erros de rede ou fetch
      const catchErrorMsg = error instanceof Error ? error.message : "Erro de comunicação desconhecido.";
      console.error(`[Polling #${currentPollCount}] Network/Fetch error for ${jobIdToCheck}:`, catchErrorMsg);
      
      const found = await checkDirectlyInSupabase(jobIdToCheck); // Tenta verificação direta em erro de rede
      if (found) return; // Se encontrado, para o polling
      // Não para o polling aqui em erros de rede, permite que continue até MAX_POLL_ATTEMPTS
      // ou até que um erro persistente seja tratado pelo limiar de X tentativas.
    }
  }, [userInfo, pageState, completedJobData, stopPollingAndCleanup, checkDirectlyInSupabase]); // Adicionado pageState e completedJobData

  // Efeito Principal para controlar o fluxo da página e o polling
  useEffect(() => {
    console.log(`[SuccessPage Effect] State: ${pageState}, JobID: ${jobId}, AuthLoading: ${isAuthLoading}, User: ${!!userInfo}, PollingActive: ${!!pollingIntervalRef.current}, Completed: ${!!completedJobData}, Error: ${!!errorMessage}`);

    // --- Lógica de Inicialização ---
    if (pageState === 'initializing') {
      console.log("[SuccessPage Init] Initializing: Getting Job ID.");
      setLoadingMessage('A obter detalhes da transformação...');
      const params = new URLSearchParams(window.location.search);
      const jobIdFromUrl = params.get('job_id');
      let jobIdFromStorage: string | null = null;
      try {
        jobIdFromStorage = localStorage.getItem('currentJobId');
        console.log(`[SuccessPage Init] JobID from localStorage: ${jobIdFromStorage}, from URL: ${jobIdFromUrl}`);
      } catch (e) { console.error("[SuccessPage Init] Error reading localStorage for JobID:", e); }
      
      const finalJobId = jobIdFromStorage || jobIdFromUrl;
      if (finalJobId) {
        setJobId(finalJobId);
        console.log(`[SuccessPage Init] JobID set: ${finalJobId}. Transitioning to awaiting_auth.`);
        setPageState('awaiting_auth'); 
      } else {
        console.error("[SuccessPage Init] CRITICAL: No JobID found in URL or localStorage.");
        if ((pageState as SuccessProcessingState) !== 'error') { // Evita setar estado se já for erro
          setErrorMessage("Informação da transformação não encontrada. Verifique o URL ou tente aceder a partir do seu histórico de transformações.");
          setPageState('error');
        }
        stopPollingAndCleanup('error'); // Garante limpeza se der erro aqui
      }
      return; // Sai do useEffect após inicialização
    }

    // --- Lógica de Autenticação ---
    if (pageState === 'awaiting_auth') {
      console.log("[SuccessPage AuthCheck] In awaiting_auth state.");
      if (isAuthLoading) {
        console.log("[SuccessPage AuthCheck] Authentication is loading...");
        setLoadingMessage('A verificar sessão...');
        return; // Ainda a carregar, espera pela próxima execução do efeito
      }
      console.log("[SuccessPage AuthCheck] Authentication loading complete. UserInfo present:", !!userInfo);
      const params = new URLSearchParams(window.location.search);
      const sessionIdFromUrl = params.get('session_id');
      
      if (sessionIdFromUrl && !hasVerifiedPayment.current) {
        console.log("[SuccessPage AuthCheck] SessionID found in URL. Transitioning to verifying_payment.");
        setPageState('verifying_payment');
      } else {
        console.log("[SuccessPage AuthCheck] No SessionID in URL or payment already verified. Transitioning to polling_status.");
        setPageState('polling_status'); 
      }
      return; // Sai do useEffect
    }
    
    // --- Lógica de Verificação de Pagamento ---
    if (pageState === 'verifying_payment' && jobId && !hasVerifiedPayment.current) {
      console.log(`[SuccessPage PaymentVerify] Verifying payment for job: ${jobId}`);
      setLoadingMessage('A confirmar pagamento...');
      hasVerifiedPayment.current = true; // Marca para não repetir
      
      const params = new URLSearchParams(window.location.search);
      const sessionIdFromUrl = params.get('session_id');

      if (!sessionIdFromUrl) {
        console.warn("[SuccessPage Payment] No session_id in URL, skipping payment verification, proceeding to poll.");
        setPageState('polling_status');
        return; // Sai do useEffect
      }

      const verifyPayment = async () => {
        try {
          const response = await fetch(`/api/verify-session?session_id=${sessionIdFromUrl}`);
          if (!response.ok) { 
            const errorData = await response.json().catch(() => ({ message: 'Falha ao verificar pagamento (resposta não JSON)' }));
            throw new Error(errorData.message || 'Falha ao verificar pagamento'); 
          }
          await response.json(); // Não precisamos do resultado, apenas que foi OK
          toast.success('Pagamento confirmado!');
          setPageState('polling_status'); // Transita para iniciar o polling
        } catch (error) {
          console.error('[SuccessPage Payment] Error verifying payment:', error);
          if ((pageState as SuccessProcessingState) !== 'error') { // Evita setar estado se já for erro
            setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido na verificação do pagamento.');
            setPageState('error'); 
          }
          stopPollingAndCleanup('error'); // Para tudo em caso de erro de pagamento
        }
      };
      verifyPayment();
      return; // Importante para não continuar a executar o useEffect nesta renderização
    }

    // --- Lógica Centralizada para Iniciar/Gerir o Polling ---
    if (jobId && (pageState === 'polling_status' || pageState === 'processing')) {
      // Só inicia/continua o polling se a autenticação estiver resolvida E
      // se o job ainda não estiver completo OU com erro definitivo.
      if (!isAuthLoading && !completedJobData && !errorMessage) {
        if (!pollingIntervalRef.current) { // Só cria um novo intervalo se não existir um
          console.log(`[SuccessPage PollingManager] Starting/Restarting polling interval for JobID: ${jobId}, Current State: ${pageState}`);
          pollCountRef.current = 0; // Reseta o contador ao (re)iniciar o polling
          checkJobStatus(jobId);    // Faz a primeira chamada imediatamente
          
          pollingIntervalRef.current = setInterval(() => {
            // A função checkJobStatus é responsável por parar o polling quando apropriado
            if (jobId) { // Segurança extra
              checkJobStatus(jobId);
            }
          }, POLLING_INTERVAL_MS);
        } else {
          console.log(`[SuccessPage PollingManager] Polling already active for JobID: ${jobId}, Current State: ${pageState}`);
        }
      } else if (isAuthLoading) {
        console.log(`[SuccessPage PollingManager] Auth is loading, polling paused for JobID: ${jobId}`);
        if (pageState === 'polling_status' || pageState === 'processing') { // Só mostra mensagem se estiver nestes estados
          setLoadingMessage('A verificar sessão antes de continuar...');
        }
      } else if (completedJobData || errorMessage) {
        // Se já completou ou deu erro, e por alguma razão o polling ainda está ativo, limpa.
        if (pollingIntervalRef.current) {
          console.log(`[SuccessPage PollingManager] Job is ${completedJobData ? 'completed' : 'in error'}. Ensuring polling is stopped.`);
          stopPollingAndCleanup(completedJobData ? 'completed' : 'error');
        }
      }
    } else if (pollingIntervalRef.current && (pageState === 'completed' || pageState === 'error' || pageState === 'auth_failed')) {
      // Se o estado mudou para um estado final e o polling ainda está ativo, limpa-o.
      // Esta é uma salvaguarda, pois checkJobStatus já deve ter chamado stopPollingAndCleanup.
      console.log(`[SuccessPage PollingManager] Job is ${pageState}. Ensuring polling is stopped for JobID: ${jobId}`);
      stopPollingAndCleanup(pageState === 'completed' ? 'completed' : 'error');
    }
    
    // Função de limpeza do useEffect:
    // Limpa o intervalo se o componente for desmontado ou se as dependências críticas (jobId) mudarem.
    return () => {
      if (pollingIntervalRef.current) {
        console.log('[SuccessPage Effect Cleanup] Clearing polling interval due to unmount or critical dependency change (e.g., jobId).');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [pageState, jobId, isAuthLoading, userInfo, completedJobData, errorMessage, stopPollingAndCleanup, checkJobStatus]);

  const renderContent = () => {
    switch (pageState) {
      case 'initializing':
      case 'awaiting_auth':
      case 'verifying_payment':
      case 'polling_status': 
      case 'processing':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="relative bg-ghibli-paper rounded-full p-3 w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <motion.div
                className="absolute inset-0 rounded-full bg-ghibli-moss/20"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.4, 0.7, 0.4] 
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <Loader2 className="h-12 w-12 text-ghibli-moss animate-spin" />
            </div>
            <h1 className="text-3xl font-ghibli font-bold text-ghibli-wood mb-3">
              { pageState === 'awaiting_auth' ? 'Autenticando...' :
                pageState === 'verifying_payment' ? 'Verificando Pagamento...' :
                pageState === 'processing' ? 'Criando a sua obra de arte...' :
                pageState === 'polling_status' ? 'Criando a sua obra de arte...' : 
                'Aguarde...' // Para initializing
              }
            </h1>
            <p className="text-ghibli-earth mb-4 text-center text-lg">
              {loadingMessage} 
            </p>
            <p className="text-ghibli-earth/70 text-sm mb-4">
              {(pageState === 'processing' || pageState === 'polling_status') && 'Pode fechar esta página e ver o resultado no menu "Fotos Transformadas" se estiver na sua conta'}
            </p>
          </motion.div>
        );
      case 'completed':
        if (!completedJobData) return null; // Segurança
        return (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              <motion.div 
                className="bg-ghibli-moss/20 rounded-full p-4 w-24 h-24 flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Check className="h-12 w-12 text-ghibli-moss" />
              </motion.div>
              
              <motion.h1 
                className="text-3xl font-ghibli font-bold text-ghibli-wood mb-6 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Transformação Concluída!
              </motion.h1>
              
              <motion.div 
                className="w-full max-w-md aspect-square rounded-xl overflow-hidden border-4 border-ghibli-paper shadow-lg mb-8 bg-gray-100 relative"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                {/* Imagem de preload escondida para tentar carregar na cache do browser */}
                <div className="hidden">
                  <Image 
                    src={completedJobData.outputUrl} 
                    alt="Preload" 
                    width={1}
                    height={1}
                    onLoad={() => console.log("[Success Page Image] Preloaded successfully")}
                    onError={() => console.error("[Success Page Image] Preload failed")}
                    unoptimized
                  />
                </div>
                <Image
                  src={completedJobData.outputUrl}
                  alt="Imagem Transformada"
                  fill // Usa fill para preencher o container
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Ajuste conforme necessário
                  style={{ objectFit: 'contain' }} // 'contain' para garantir que a imagem inteira seja visível
                  priority // Importante para LCP (Largest Contentful Paint)
                  unoptimized={true} // Se as URLs são de Supabase Storage ou similar e não otimizadas pelo Next/Image
                  onError={(e) => {
                    console.error('[Success Page Image] Image loading error:', e);
                    console.error('[Success Page Image] Failed URL:', completedJobData.outputUrl);
                    // Tenta mostrar o placeholder
                    const target = e.currentTarget;
                    target.style.display = 'none'; // Esconde a imagem quebrada
                    const placeholder = target.nextElementSibling as HTMLElement; // Apanha o div de erro
                    if(placeholder && placeholder.classList.contains('image-error-placeholder')) {
                       placeholder.style.display = 'flex'; // Mostra o placeholder
                    }
                  }}
                />
                {/* Placeholder para erro de imagem */}
                <div 
                  className="image-error-placeholder absolute inset-0 w-full h-full bg-gray-200 flex flex-col items-center justify-center text-center text-xs text-ghibli-wood p-2" 
                  style={{display: 'none'}} // Inicialmente escondido
                >
                  <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-ghibli-wood"/> Erro ao<br/>carregar<br/>imagem
                </div>
              </motion.div>
              
              <motion.div 
                className="flex gap-4 w-full max-w-md"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Button 
                  onClick={handleDownload} 
                  variant="outline" 
                  className="flex-1 bg-ghibli-paper text-ghibli-wood border-ghibli-moss hover:bg-ghibli-moss/10 transition-all"
                >
                  <Download className="mr-2 h-4 w-4" /> Baixar
                </Button>
                <Button 
                  onClick={navigateToHome} 
                  className="flex-1 bg-ghibli-moss text-ghibli-paper hover:bg-ghibli-moss/90 transition-all shadow-md"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Nova Imagem
                </Button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        );
      case 'auth_failed': 
      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="bg-ghibli-paper rounded-full p-4 w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-12 w-12 text-ghibli-wood" />
            </div>
            <h1 className="text-3xl font-ghibli font-bold text-ghibli-wood mb-3">
              {pageState === 'auth_failed' ? 'Autenticação Falhou' : 'Ops! Algo deu errado'}
            </h1>
            <p className="text-ghibli-earth mb-6 text-center text-lg">
              {errorMessage || (pageState === 'auth_failed' ? 'Não foi possível verificar a sua sessão. Por favor, tente fazer login novamente ou recarregue a página.' : 'Ocorreu um erro inesperado.')}
            </p>
            <Button 
              onClick={navigateToHome} 
              className="bg-ghibli-paper text-ghibli-wood border-ghibli-wood hover:bg-ghibli-wood/10 transition-all w-full max-w-xs mx-auto"
            >
              Voltar para o Início
            </Button>
          </motion.div>
        );
      default: // Estado inesperado
        // Para garantir que algo é renderizado em caso de estado desconhecido
        console.warn(`[SuccessPage Render] Unexpected page state: ${pageState}`);
        return (
          <div className="text-center">
            <div className="bg-ghibli-paper rounded-full p-3 w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-12 w-12 text-ghibli-moss animate-spin" />
            </div>
            <h1 className="text-3xl font-ghibli font-bold text-ghibli-wood mb-3">Aguarde...</h1>
            <p className="text-ghibli-earth mb-4 text-center text-lg">{loadingMessage || 'A processar o seu pedido.'}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-ghibli-cream flex flex-col items-center justify-center p-4 text-ghibli-charcoal">
      <motion.div 
        className="max-w-lg w-full bg-ghibli-paper rounded-2xl shadow-xl p-8 sm:p-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default SuccessPage;