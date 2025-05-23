import Stripe from 'stripe';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { NextApiRequest, NextApiResponse } from 'next';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
  apiVersion: '2025-04-30.basil',
});

const PICCOIN_PACKAGES = {
  starter: { coins: 1, price: 200, name: 'STARTER' }, // 2€
  popular: { coins: 3, price: 500, name: 'POPULAR' }, // 5€
  premium: { coins: 7, price: 1000, name: 'PREMIUM' }, // 10€
  mega: { coins: 15, price: 2000, name: 'MEGA' }, // 20€
  ultimate: { coins: 50, price: 5000, name: 'ULTIMATE' } // 50€
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. Validate authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookies = parseCookieHeader(req.headers.cookie ?? '');
            return cookies[name];
          },
          set: (name: string, value: string, options) => {
            const cookie = serializeCookieHeader(name, value, options);
            let setCookieHeader = res.getHeader('Set-Cookie') ?? [];
            if (typeof setCookieHeader === 'string') {
              setCookieHeader = [setCookieHeader];
            } else if (typeof setCookieHeader === 'number') {
              setCookieHeader = [String(setCookieHeader)];
            }
            res.setHeader('Set-Cookie', [...setCookieHeader, cookie]);
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 2. Only packageId comes from body (userId is from auth)
    const { packageId } = req.body;

    if (!packageId || !PICCOIN_PACKAGES[packageId as keyof typeof PICCOIN_PACKAGES]) {
      return res.status(400).json({ message: 'Invalid package' });
    }

    const selectedPackage = PICCOIN_PACKAGES[packageId as keyof typeof PICCOIN_PACKAGES];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `PicCoins ${selectedPackage.name}`,
              description: `${selectedPackage.coins} PicCoins para transformações de imagem`,
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id, // Secure - comes from auth
        packageId: packageId,
        piccoins: selectedPackage.coins.toString(),
        type: 'piccoin_purchase'
      },
    });

    return res.status(200).json({ sessionId: session.id });

  } catch (error) {
    console.error('Purchase API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 