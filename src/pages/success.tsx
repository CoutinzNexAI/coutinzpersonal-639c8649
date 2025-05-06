import React, { useEffect, useState, useRef, useCallback } from 'react';
// Importa o componente Image do Next.js
import Image from 'next/image';
import { Check, Loader2, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

// Estados possíveis desta página
type SuccessProcessingState =
  | 'initializing'        // Novo estado inicial antes de verificar tudo
  | 'verifying_payment'
  | 'polling_status'
  | 'processing'
  | 'completed'
  | 'error';

// Tipos de resposta da API (assumidos)
type StatusResponse = {
  status?: string;
  output_url?: string | null;
  error_message?: string | null;
  message?: string;
};

// Dados do job concluído
type CompletedJobData = {
  outputUrl: string;
  jobId: string;
};

// Constantes para polling
const POLLING_INTERVAL_MS = 5000; // 5 segundos
const MAX_POLL_ATTEMPTS = 24; // Limite de tentativas (24 * 5s = 2 minutos)

const SuccessPage = () => {
  // Estados da página
  const [pageState, setPageState] = useState<SuccessProcessingState>('initializing');
  const [loadingMessage, setLoadingMessage] = useState('Aguarde um momento...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedJobData, setCompletedJobData] = useState<CompletedJobData | null>(null);
  const [jobId, setJobId] = useState<string | null>(null); // Guarda o Job ID a ser processado

  // Refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef<number>(0);
  const hasVerifiedPayment = useRef<boolean>(false); // Flag para evitar verificar pagamento múltiplas vezes

  // --- Funções Auxiliares ---

  // Limpa o intervalo de polling e o localStorage
  const stopPollingAndCleanup = useCallback((finalState: 'completed' | 'error') => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log(`[Cleanup] Polling stopped. Final state: ${finalState}`);
    }
    try {
        console.log('[Cleanup] Removing localStorage items...');
        localStorage.removeItem('currentJobId');
        localStorage.removeItem('studioState');
    } catch (e) {
        console.error('[Cleanup] Error removing localStorage items:', e);
    }
  }, []);

  // Navega para a página inicial (limpando tudo antes)
  const navigateToHome = useCallback(() => {
    stopPollingAndCleanup('error'); // Considera erro se sair antes de completar
    window.location.href = '/';
  }, [stopPollingAndCleanup]);

  // Download da imagem
  const handleDownload = useCallback(() => {
    if (!completedJobData?.outputUrl) return;
    const link = document.createElement('a');
    link.href = completedJobData.outputUrl;
    link.download = `transformed-${completedJobData.jobId || Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download iniciado!");
  }, [completedJobData]);


  // --- Efeito Principal (Montagem e Atualização) ---
  useEffect(() => {
    console.log("[SuccessPage Effect] Running. State:", pageState, "Job ID:", jobId);

    // --- Função Interna para Verificar Estado do Job ---
    const checkJobStatus = async (currentJobIdToCheck: string) => {
      pollCountRef.current += 1;
      const currentPollCount = pollCountRef.current;

      // Verifica limite de tentativas
      if (currentPollCount > MAX_POLL_ATTEMPTS) {
        console.error(`[Polling #${currentPollCount}] Max poll attempts reached for job ${currentJobIdToCheck}. Stopping.`);
        setErrorMessage(`Não foi possível obter o estado final após ${MAX_POLL_ATTEMPTS} tentativas.`);
        setPageState('error');
        stopPollingAndCleanup('error'); // Limpa ao atingir limite
        return;
      }

      console.log(`[Polling #${currentPollCount}/${MAX_POLL_ATTEMPTS}] Checking status for job: ${currentJobIdToCheck}...`);

      try {
        const response = await fetch(`/api/get-transformation-status?jobId=${currentJobIdToCheck}`);

        if (!response.ok) {
            let errorMsg = `Erro API (${response.status})`;
            // Tenta ler a mensagem de erro do corpo da resposta JSON
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch (_e) { // Ignora erro se o corpo não for JSON ou estiver vazio (corrige erro ESLint)
                 console.warn(`[Polling #${currentPollCount}] Could not parse error response body for status ${response.status}.`);
            }
            console.error(`[Polling #${currentPollCount}] API error: ${errorMsg}`);
            setErrorMessage(errorMsg);
            // Para polling em erros fatais (404, 403) ou erros de servidor (5xx)
            if (response.status === 404 || response.status === 403 || response.status >= 500) {
                setPageState('error');
                stopPollingAndCleanup('error'); // Limpa em erro fatal
            } // Continua polling para outros erros (ex: rate limit)
            return;
        }

        // Se a resposta for OK, tenta ler como JSON
        const data: StatusResponse = await response.json();
        console.log(`[Polling #${currentPollCount}] Received status: ${data.status}`);

        // Processa o estado recebido
        if (data.status === 'completed' && data.output_url) {
            console.log(`[Polling #${currentPollCount}] Job completed! Stopping poll.`);
            setCompletedJobData({ outputUrl: data.output_url, jobId: currentJobIdToCheck });
            setPageState('completed');
            toast.success("Transformação concluída!");
            stopPollingAndCleanup('completed'); // Limpa ao completar
        } else if (data.status?.startsWith('failed')) {
            console.error(`[Polling #${currentPollCount}] Job failed! Reason: ${data.error_message}. Stopping poll.`);
            setErrorMessage(data.error_message || 'A transformação falhou.');
            setPageState('error');
            toast.error("Falha na Transformação", { description: data.error_message || 'Erro.' });
            stopPollingAndCleanup('error'); // Limpa ao falhar
        } else if (['processing', 'processing_queued', 'paid'].includes(data.status || '')) {
            setPageState('processing'); // Garante estado correto
            setLoadingMessage('Processando sua imagem... Pode levar um minuto.');
            console.log(`[Polling #${currentPollCount}] Job still '${data.status}'. Continuing.`);
        } else {
            console.warn(`[Polling #${currentPollCount}] Unexpected status: ${data.status}. Continuing.`);
            setPageState('processing');
            setLoadingMessage('Aguardando estado final...');
        }

      } catch (error) {
        console.error(`[Polling #${currentPollCount}] Network/fetch error:`, error);
        setErrorMessage("Erro de rede ao verificar estado. Tentando novamente...");
        // Não para o polling em erro de rede, tentará novamente
      }
    };
    // --- Fim da função checkJobStatus ---


    // --- Lógica de Inicialização ---
    if (pageState === 'initializing') {
        console.log("[SuccessPage Init] Initializing...");
        const params = new URLSearchParams(window.location.search);
        const sessionIdFromUrl = params.get('session_id');
        const jobIdFromUrl = params.get('job_id'); // Fallback da URL
        let jobIdFromStorage: string | null = null;

        // 1. Tenta obter jobId do localStorage PRIMEIRO
        try {
            jobIdFromStorage = localStorage.getItem('currentJobId');
            console.log("[SuccessPage Init] Job ID from localStorage:", jobIdFromStorage);
        } catch (e) {
            console.error("[SuccessPage Init] Error reading localStorage:", e);
        }

        const finalJobId = jobIdFromStorage || jobIdFromUrl; // Prioriza localStorage

        if (finalJobId) {
            setJobId(finalJobId); // Define o jobId no estado
            if (sessionIdFromUrl) {
                // Se temos Job ID e Session ID, vamos verificar pagamento
                setPageState('verifying_payment');
                setLoadingMessage('A confirmar pagamento...');
            } else {
                // Se temos Job ID mas não Session ID (ex: voltou à página depois), vai direto para polling
                console.warn("[SuccessPage Init] Job ID found, but no Session ID in URL. Assuming payment ok/pending, starting poll.");
                setPageState('polling_status');
                setLoadingMessage('A verificar estado da transformação...');
            }
        } else {
            // Sem Job ID de nenhuma fonte
            console.error("[SuccessPage Init] CRITICAL: No Job ID found in localStorage or URL.");
            setErrorMessage("Não foi possível encontrar a informação da sua transformação.");
            setPageState('error');
            stopPollingAndCleanup('error'); // Limpa por segurança
        }
        return; // Sai do useEffect após inicialização
    }

    // --- Lógica de Verificação de Pagamento e Início do Polling ---
    if (pageState === 'verifying_payment' && jobId && !hasVerifiedPayment.current) {
      console.log("[SuccessPage Effect] Verifying payment...");
      hasVerifiedPayment.current = true; // Marca como verificado para não repetir
      const sessionIdFromUrl = new URLSearchParams(window.location.search).get('session_id');

      if (!sessionIdFromUrl) {
          console.error("[SuccessPage Verify] Missing session_id for verification.");
          setErrorMessage("ID da sessão de pagamento em falta.");
          setPageState('error');
          stopPollingAndCleanup('error');
          return; // Interrompe
      }

      const verifyPaymentAndStartPolling = async (jobIdToPoll: string) => {
        setLoadingMessage('Confirmando pagamento...');
        setErrorMessage(null);
        pollCountRef.current = 0; // Reseta contador
        try {
          const response = await fetch(`/api/verify-session?session_id=${sessionIdFromUrl}`);
          if (!response.ok) { throw new Error('Falha ao verificar pagamento'); }
          await response.json();
          toast.success('Pagamento confirmado!');
          setPageState('polling_status'); // Muda para polling
          setLoadingMessage('Iniciando verificação de estado...');
          console.log('[SuccessPage] Payment verified. Starting first status check...');
          await checkJobStatus(jobIdToPoll); // Verifica imediatamente

          // Inicia intervalo APENAS SE não terminou na primeira verificação
          setPageState(currentState => {
              if (currentState !== 'completed' && currentState !== 'error') {
                  console.log('[SuccessPage] Setting interval.');
                  if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = setInterval(() => checkJobStatus(jobIdToPoll), POLLING_INTERVAL_MS);
                  return 'processing'; // Define estado como processando
              }
              return currentState; // Mantém estado final
          });

        } catch (error) {
          console.error('[SuccessPage] Erro ao verificar pagamento:', error);
          setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
          setPageState('error');
          stopPollingAndCleanup('error'); // Limpa em erro
        }
      };
      verifyPaymentAndStartPolling(jobId); // Chama a função
    }

    // --- Lógica para iniciar polling se já estava nesse estado (ex: vindo do localStorage) ---
    if (pageState === 'polling_status' && jobId && !pollingIntervalRef.current) {
        console.log("[SuccessPage Effect] State is polling_status, starting polling interval...");
        pollCountRef.current = 0; // Reseta contador
        checkJobStatus(jobId); // Verifica imediatamente
        // Inicia intervalo APENAS SE não terminou na primeira verificação
         setPageState(currentState => {
              if (currentState !== 'completed' && currentState !== 'error') {
                  console.log('[SuccessPage] Setting interval from polling_status.');
                  if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = setInterval(() => checkJobStatus(jobId), POLLING_INTERVAL_MS);
                  return 'processing'; // Define estado como processando
              }
              return currentState; // Mantém estado final
          });
    }


    // Função de limpeza principal do useEffect
    return () => {
      if (pollingIntervalRef.current) {
        console.log('[SuccessPage Cleanup] Clearing polling interval on unmount/re-run.');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null; // Limpa a ref também
      }
    };
  // Depende de `jobId` e `pageState` para re-executar a lógica de controle
  }, [jobId, pageState, stopPollingAndCleanup]); // Adiciona stopPollingAndCleanup como dependência


  // Função para renderizar o conteúdo baseado no pageState
  const renderContent = () => {
    switch (pageState) {
      case 'initializing': // Novo estado inicial de loading
      case 'verifying_payment':
      case 'polling_status':
      case 'processing':
        return (
          <>
            <div className="bg-primary/10 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
                {pageState === 'verifying_payment' ? 'Verificando Pagamento' :
                 pageState === 'processing' ? 'Processando Imagem' :
                 'Aguarde...'}
            </h1>
            <p className="text-muted-foreground mb-4 text-center">
              {loadingMessage} <br />
              {/* Mostra aviso apenas se estiver realmente processando */}
              {(pageState === 'processing' || pageState === 'polling_status') && '(Pode fechar esta página e voltar mais tarde se quiser)'}
            </p>
            {/* Mostra Job ID se disponível (para debug) */}
            {jobId && <p className="text-xs text-gray-400 mt-4">Job ID: {jobId}</p>}
          </>
        );
      case 'completed':
        if (!completedJobData) return null; // Segurança extra
        return (
            <div className="w-full flex flex-col items-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-4 text-center">Transformação Concluída!</h1>
                {/* Container da Imagem Final */}
                <div className="w-full max-w-md aspect-square rounded-lg overflow-hidden border mb-6 bg-gray-100 relative">
                    {/* Usa o componente Image do Next.js */}
                    <Image
                        src={completedJobData.outputUrl}
                        alt="Imagem Transformada"
                        fill // Faz a imagem preencher o container pai
                        style={{ objectFit: 'contain' }} // Equivalente a object-contain
                        priority // Prioriza o carregamento desta imagem (LCP)
                        unoptimized // Desativa otimização da Vercel se a URL for externa e não configurada
                        onError={(e) => { /* Lógica de erro da imagem */
                            // Esconde a imagem se falhar
                            e.currentTarget.style.display = 'none';
                            // Mostra o placeholder de erro (definido abaixo)
                            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                            if(placeholder) placeholder.style.display = 'flex';
                        }}
                    />
                    {/* Placeholder de erro para a imagem (inicialmente escondido) */}
                    <div className="absolute inset-0 w-full h-full bg-gray-200 items-center justify-center text-center text-xs text-red-500 p-2" style={{display: 'none'}}>
                        <AlertTriangle className="h-6 w-6 mx-auto mb-1"/> Erro ao<br/>carregar<br/>imagem
                    </div>
                </div>
                {/* Botões de Ação */}
                <div className="flex gap-4 w-full max-w-md">
                    <Button onClick={handleDownload} variant="outline" className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Baixar
                    </Button>
                    <Button onClick={navigateToHome} className="flex-1 ghibli-button">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Nova Imagem
                    </Button>
                </div>
            </div>
        );
      case 'error':
        return (
          <>
            <div className="bg-destructive/10 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado</h1>
            <p className="text-muted-foreground mb-4 text-center">{errorMessage || 'Ocorreu um erro inesperado durante o processo.'}</p>
            <Button onClick={navigateToHome} variant="outline" className="w-full max-w-xs mx-auto">
              Voltar para o Início
            </Button>
             {/* Mostra Job ID se disponível (para debug do erro) */}
            {jobId && <p className="text-xs text-gray-400 mt-4">Job ID: {jobId}</p>}
          </>
        );
      default:
        // Caso algum estado inesperado ocorra
        return <p className="text-muted-foreground">Estado desconhecido.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-ghibli-cream flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <div className="text-center">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
