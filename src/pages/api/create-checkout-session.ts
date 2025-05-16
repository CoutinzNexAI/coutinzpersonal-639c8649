// src/pages/api/create-checkout-session.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Verificar variáveis de ambiente no startup
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY não está configurada nas variáveis de ambiente.');
  // Considera lançar um erro aqui para impedir o arranque se a chave for essencial
  // throw new Error('STRIPE_SECRET_KEY não está configurada.');
}
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

// Obter PRICE_ID da variável de ambiente ou usar um placeholder
const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_substituir_pelo_real';

// Verificar se PRICE_ID é válido no startup
if (PRICE_ID === 'price_substituir_pelo_real' && process.env.NODE_ENV === 'production') {
  // Em produção, é mais crítico se o PRICE_ID não estiver configurado
  console.error('❌ ERRO CRÍTICO: STRIPE_PRICE_ID não configurado para produção.');
  // Considera lançar um erro para impedir o arranque em produção
  // throw new Error('STRIPE_PRICE_ID não configurado para produção.');
} else if (PRICE_ID === 'price_substituir_pelo_real') {
  console.warn('⚠️ STRIPE_PRICE_ID não configurado corretamente. Usando placeholder. Isto pode não funcionar.');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar método
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verificar variáveis de ambiente em runtime (importante para funções serverless)
  if (!stripeSecretKey) {
    console.error('❌ STRIPE_SECRET_KEY não está configurada nas variáveis de ambiente (runtime).');
    return res.status(500).json({ message: 'Erro de configuração do Stripe. Contate o administrador.' });
  }

  // Verificar PRICE_ID em runtime
  if (PRICE_ID === 'price_substituir_pelo_real') {
    console.error('❌ STRIPE_PRICE_ID não configurado corretamente (runtime).');
    return res.status(500).json({ message: 'Erro de configuração do Stripe. Contate o administrador.' });
  }

  try {
    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-04-30.basil', // Mantém a versão que funciona para ti
      typescript: true
    });

    // Obter dados do corpo da requisição
    const { jobId, style, userEmail } = req.body;

    // Validar campos obrigatórios
    if (!jobId) {
      return res.status(400).json({ message: 'jobId é obrigatório' });
    }
    // Adiciona mais validações se necessário (ex: style existe?)

    // Determinar URLs de sucesso e cancelamento
    let baseUrl;

    // 1. Usar NEXT_PUBLIC_APP_URL se estiver definido (ideal para produção e para forçar um URL específico)
    if (process.env.NEXT_PUBLIC_APP_URL) {
      let appUrl = process.env.NEXT_PUBLIC_APP_URL;
      // Adicionar https:// se estiver em falta e não for localhost
      if (!appUrl.startsWith('http') && !appUrl.includes('localhost')) {
        console.warn(`[create-checkout-session] NEXT_PUBLIC_APP_URL (${appUrl}) não tem protocolo. Adicionando https://`);
        appUrl = `https://${appUrl}`;
      }
      baseUrl = appUrl;
    }
    // 2. Se não, tentar VERCEL_URL (bom para previews da Vercel)
    else if (process.env.VERCEL_URL) {
      const proto = req.headers['x-forwarded-proto'] || 'https'; // Vercel usa HTTPS
      baseUrl = `${proto}://${process.env.VERCEL_URL}`;
    }
    // 3. Fallback para req.headers.origin (pode ser útil, mas menos previsível)
    else if (req.headers.origin) {
        baseUrl = req.headers.origin;
    }
    // 4. Fallback final para localhost (para desenvolvimento local)
    else {
      const port = process.env.PORT || 3000;
      baseUrl = `http://localhost:${port}`;
    }

    // Remover barra no final de baseUrl, se existir, para evitar barras duplas
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    console.log(`[create-checkout-session] Determined baseUrl: ${baseUrl}`);
    console.log(`[create-checkout-session] Original NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
    console.log(`[create-checkout-session] Using VERCEL_URL: ${process.env.VERCEL_URL}`);


    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&job_id=${jobId}`;
    const cancelUrl = `${baseUrl}/?canceled=true&job_id=${jobId}`; // Ou uma página de cancelamento específica: ${baseUrl}/cancel?job_id=${jobId}

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[], // Ajuste conforme os métodos de pagamento ativos na tua conta Stripe
      line_items: [
        {
          price: PRICE_ID, // Usa o PRICE_ID do teu ambiente
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        jobId: String(jobId), // Garante que é uma string
        style: String(style || 'default'), // Garante que é uma string
        // userId: String(userId), // Se tiveres userId, passa-o também
      },
      // customer_email é útil para o Stripe associar o pagamento a um cliente
      // e para preencher o email na página de checkout.
      customer_email: typeof userEmail === 'string' && userEmail.includes('@') ? userEmail : undefined,
    });

    // Retornar ID da sessão e URL para redirecionamento
    if (!session.id || !session.url) {
      console.error('❌ Stripe session ID ou URL não encontrados após a criação.');
      throw new Error("Stripe session ID ou URL não encontrados após a criação.");
    }
    
    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('❌ Erro ao criar sessão de checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao criar sessão de checkout';

    if (error instanceof Stripe.errors.StripeError) {
        // Tratar erros específicos do Stripe de forma mais detalhada
        switch (error.type) {
            case 'StripeCardError':
                console.error(`❌ Erro de Cartão Stripe: ${error.message}`);
                // Este erro é geralmente exibido ao cliente pelo Stripe.js, mas é bom logar.
                break;
            case 'StripeRateLimitError':
                console.error(`❌ Erro de Limite de Taxa Stripe: ${error.message}`);
                break;
            case 'StripeInvalidRequestError':
                console.error(`❌ Erro de Requisição Inválida Stripe: ${error.message}`);
                break;
            case 'StripeAPIError':
                console.error(`❌ Erro de API Stripe: ${error.message}`);
                break;
            case 'StripeConnectionError':
                console.error(`❌ Erro de Conexão Stripe: ${error.message}`);
                break;
            case 'StripeAuthenticationError':
                console.error('❌ Erro de autenticação no Stripe. Verifique STRIPE_SECRET_KEY.');
                break;
            default:
                console.error(`❌ Outro erro Stripe: ${error.message}`);
                break;
        }
    }
    return res.status(500).json({ message: `Erro ao processar pagamento: ${errorMessage}` });
  }
}
