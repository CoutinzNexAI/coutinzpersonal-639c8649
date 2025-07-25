import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      code = 'TESTE1', 
      percent_off = 90, 
      max_redemptions = 100,
      description = 'Código de teste - 90% desconto'
    } = req.body;

    console.log('🎫 Criando código de desconto:', { code, percent_off, max_redemptions });

    // 1. Criar Coupon primeiro
    const coupon = await stripe.coupons.create({
      percent_off: percent_off,
      duration: 'once', // Aplicado apenas uma vez
      max_redemptions: max_redemptions,
      name: description,
      id: code.toLowerCase(), // ID do coupon = código em minúsculas
    });

    console.log('✅ Coupon criado:', coupon.id);

    // 2. Criar Promotion Code associado ao coupon
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code.toUpperCase(), // Código em maiúsculas para o cliente
      active: true,
      max_redemptions: max_redemptions,
    });

    console.log('✅ Código promocional criado:', promotionCode.code);

    return res.status(200).json({ 
      success: true,
      coupon: {
        id: coupon.id,
        percent_off: coupon.percent_off,
        max_redemptions: coupon.max_redemptions
      },
      promotion_code: {
        id: promotionCode.id,
        code: promotionCode.code,
        active: promotionCode.active,
        max_redemptions: promotionCode.max_redemptions
      },
      message: `Código "${promotionCode.code}" criado com ${percent_off}% de desconto!`
    });

  } catch (error) {
    console.error('❌ Erro ao criar código de desconto:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      // Se coupon já existe, tentar apenas criar promotion code
      if (error.code === 'resource_already_exists') {
        try {
          const existingCoupon = await stripe.coupons.retrieve(req.body.code?.toLowerCase() || 'teste1');
          const promotionCode = await stripe.promotionCodes.create({
            coupon: existingCoupon.id,
            code: (req.body.code || 'TESTE1').toUpperCase(),
            active: true,
          });

          return res.status(200).json({ 
            success: true,
            existing_coupon: true,
            promotion_code: {
              id: promotionCode.id,
              code: promotionCode.code,
              active: promotionCode.active
            },
            message: `Código "${promotionCode.code}" criado usando coupon existente!`
          });
        } catch (secondError) {
          return res.status(400).json({ 
            error: `Erro ao criar promotion code: ${secondError instanceof Error ? secondError.message : 'Unknown error'}`,
            stripe_error: error.message 
          });
        }
      }

      return res.status(400).json({ 
        error: `Erro Stripe: ${error.message}`,
        code: error.code,
        type: error.type 
      });
    }

    return res.status(500).json({ 
      error: 'Erro interno do servidor ao criar código de desconto',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 