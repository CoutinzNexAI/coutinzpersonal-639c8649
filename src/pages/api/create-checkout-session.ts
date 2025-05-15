// src/pages/api/create-checkout-session.ts
import { NextApiRequest, NextApiResponse } from 'next'; // Usando tipos Next.js
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

// Definindo o tipo para a resposta, se necessário (opcional)
// type ResponseData = {
//   sessionId?: string;
//   message?: string;
//   url?: string; // Adicionado para corresponder à lógica que retorna session.url
// }

export default async function handler(
  req: NextApiRequest, // Usando tipo NextApiRequest
  res: NextApiResponse // Usando tipo NextApiResponse
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
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-04-30.basil', // CORRIGIDO AQUI - Usa a versão que o erro de tipo aceita
      typescript: true
    });

    // Obter dados do corpo da requisição
    const { jobId, style, userEmail } = req.body;

    // Validar campos obrigatórios
    if (!jobId) {
      return res.status(400).json({ message: 'jobId é obrigatório' });
    }
    // Adiciona mais validações se necessário (ex: style existe?)

    // Determinar URLs de sucesso e cancelamento de forma mais robusta
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = process.env.VERCEL_URL || req.headers['x-forwarded-host'] || req.headers['host'];
    const defaultBase = `https://www.pictuz.com/`;
    const baseUrl = host ? `${proto}://${host}` : defaultBase;

    console.log(`[create-checkout-session] Determined baseUrl: ${baseUrl}`);

    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&job_id=${jobId}`;
    const cancelUrl = `${baseUrl}/?canceled=true&job_id=${jobId}`;

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal'], // Adicionado PayPal como exemplo, ajuste conforme necessário
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
        jobId: String(jobId),
        style: String(style || 'default'),
      },
      customer_email: typeof userEmail === 'string' ? userEmail : undefined,
    });

    // Retornar ID da sessão e URL
    if (!session.id || !session.url) { // Verifica também session.url
        throw new Error("Stripe session ID ou URL não encontrados após a criação.");
    }
    // O teu código localmente funcionava retornando session.url, então vamos manter isso.
    // A versão anterior que te dei retornava sessionId: session.id e url: session.url
    // Se o teu frontend espera apenas o session.id, muda para:
    // return res.status(200).json({ sessionId: session.id });
    // Se espera o URL para redirecionamento (mais comum):
    return res.status(200).json({ sessionId: session.id, url: session.url });


  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);

    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      console.error('❌ Erro de autenticação no Stripe. Verifique STRIPE_SECRET_KEY.');
      return res.status(500).json({ message: 'Erro de configuração do Stripe. Contate o administrador.' });
    }

    const errorMessage = error instanceof Error
      ? error.message
      : 'Erro desconhecido ao criar sessão de checkout';

    return res.status(500).json({ message: errorMessage });
  }
}
