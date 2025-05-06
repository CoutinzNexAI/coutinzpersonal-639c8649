import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Verificar variáveis de ambiente no startup
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY não está configurada nas variáveis de ambiente.');
}

type ResponseData = {
  success?: boolean;
  message?: string;
  status?: string;
  metadata?: Record<string, string | null>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Verificar método
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Verificar variáveis de ambiente em runtime
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY não está configurada nas variáveis de ambiente.');
    return res.status(500).json({ message: 'Configuração do servidor incompleta. Contate o administrador.' });
  }
  
  // Obter ID da sessão do query param
  const { session_id } = req.query;
  
  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ message: 'Session ID é obrigatório' });
  }

  try {
    // Inicializar Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
      typescript: true
    });

    // Buscar detalhes da sessão
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!session) {
      return res.status(404).json({ message: 'Sessão não encontrada' });
    }

    // Verificar se o pagamento foi bem-sucedido
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false,
        status: session.payment_status,
        message: 'Pagamento não concluído' 
      });
    }

    // Aqui você iniciaria o processamento real da imagem
    // Por exemplo, chamar uma fila de processamento assíncrono
    // ou iniciar o processamento da imagem diretamente

    // Por enquanto, apenas retornamos sucesso e os metadados
    return res.status(200).json({
      success: true,
      status: session.payment_status,
      message: 'Pagamento verificado, processamento iniciado',
      metadata: session.metadata
    });
    
  } catch (error) {
    console.error('Erro ao verificar sessão do Stripe:', error);
    
    // Verificar se é erro de autenticação Stripe
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      console.error('❌ Erro de autenticação no Stripe. Verifique STRIPE_SECRET_KEY.');
      return res.status(500).json({ message: 'Erro de configuração do Stripe. Contate o administrador.' });
    }
    
    // Formatação do erro genérico
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erro ao verificar sessão do Stripe';
    
    return res.status(500).json({ message: errorMessage });
  }
} 