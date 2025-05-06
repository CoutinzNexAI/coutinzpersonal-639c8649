import type { VercelRequest, VercelResponse } from '@vercel/node'; // Usa tipos Vercel (ou os corretos para o deploy final)
import Stripe from 'stripe';

// Verificar variáveis de ambiente no startup
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY não está configurada nas variáveis de ambiente.');
  // Considera lançar um erro aqui para impedir o arranque se a chave for essencial
}
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

// Obter PRICE_ID da variável de ambiente ou usar um placeholder
const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_substituir_pelo_real';

// Verificar se PRICE_ID é válido
if (PRICE_ID === 'price_substituir_pelo_real') {
  console.warn('⚠️ STRIPE_PRICE_ID não configurado corretamente. Usando placeholder.');
  // Considera lançar um erro ou retornar 500 se for obrigatório
}

type ResponseData = {
  sessionId?: string;
  message?: string;
}

export default async function handler(
  req: VercelRequest, // Usa tipo VercelRequest
  res: VercelResponse // Usa tipo VercelResponse
) {
  // Verificar método
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verificar variáveis de ambiente em runtime
  if (!stripeSecretKey) {
    console.error('❌ STRIPE_SECRET_KEY não está configurada nas variáveis de ambiente.');
    return res.status(500).json({ message: 'Erro de configuração do Stripe. Contate o administrador.' });
  }

  // Verificar PRICE_ID em runtime
  if (PRICE_ID === 'price_substituir_pelo_real') {
    console.error('❌ STRIPE_PRICE_ID não configurado corretamente.');
    return res.status(500).json({ message: 'Erro de configuração do Stripe. Contate o administrador.' });
  }

  try {
    // Inicializar Stripe
    // A API version pode ser especificada para garantir consistência
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-03-31.basil', // Usa a versão da API que estás a testar/usar
      typescript: true
    });

    // Obter dados do corpo da requisição
    // Em Vercel/Node, o corpo já vem parseado se for JSON
    const { jobId, style, imageUrl, userEmail } = req.body;

    // Validar campos obrigatórios
    if (!jobId) {
      return res.status(400).json({ message: 'jobId é obrigatório' });
    }
    // Adiciona mais validações se necessário (ex: style ex iste?)

    // --- CORREÇÃO DA BASE URL ---
    // Determinar URLs de sucesso e cancelamento de forma mais robusta
    // 1. Usa VERCEL_URL se disponível (em produção na Vercel)
    // 2. Usa o header 'x-forwarded-proto' e 'x-forwarded-host' ou 'host' (comum em proxies/vercel dev)
    // 3. Como fallback, usa localhost:3000 para desenvolvimento local
    const proto = req.headers['x-forwarded-proto'] || 'http';
    // VERCEL_URL inclui o host, mas pode não ter o protocolo. Se existir, prefira-a.
    // process.env.VERCEL_URL só existe no ambiente Vercel.
    const host = process.env.VERCEL_URL || req.headers['x-forwarded-host'] || req.headers['host'];
    const defaultBase = `http://localhost:${process.env.PORT || 3000}`; // Usa a porta 3000 por defeito no vercel dev
    const baseUrl = host ? `${proto}://${host}` : defaultBase;

    console.log(`[create-checkout-session] Determined baseUrl: ${baseUrl}`); // Log para debug

    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&job_id=${jobId}`;
    const cancelUrl = `${baseUrl}/?canceled=true&job_id=${jobId}`; // Redireciona para a raiz em caso de cancelamento
    // --- FIM DA CORREÇÃO ---

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        // Garante que os valores passados para metadados são strings
        jobId: String(jobId),
        style: String(style || 'default'),
        // imageUrl pode ser demasiado longo para metadados, considera omitir ou guardar apenas o path/ID
        // imageUrl: String(imageUrl || ''),
      },
      // Passa o email do cliente se disponível
      customer_email: typeof userEmail === 'string' ? userEmail : undefined,
      // Considera criar/associar um Stripe Customer ID se tiveres utilizadores registados
      // customer: stripeCustomerId, // Se tiveres o ID do cliente Stripe
    });

    // Retornar ID da sessão
    if (!session.id) {
        throw new Error("Stripe session ID not found after creation.");
    }
    return res.status(200).json({ sessionId: session.id });

  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);

    // Verificar se é erro de autenticação Stripe
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      console.error('❌ Erro de autenticação no Stripe. Verifique STRIPE_SECRET_KEY.');
      return res.status(500).json({ message: 'Erro de configuração do Stripe. Contate o administrador.' });
    }

    // Formatação do erro genérico
    const errorMessage = error instanceof Error
      ? error.message
      : 'Erro desconhecido ao criar sessão de checkout';

    return res.status(500).json({ message: errorMessage });
  }
}
