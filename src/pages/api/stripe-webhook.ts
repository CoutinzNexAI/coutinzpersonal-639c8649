import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
  apiVersion: '2025-04-30.basil',
});

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Disable default body parser for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

interface WebhookMetadata {
  userId: string;
  packageId: string;
  piccoinsAmount: string;
  packageName: string;
  purchaseType: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const endpointName = '[API stripe-webhook]';

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. Get the raw body for signature verification
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ message: 'Missing stripe-signature header' });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    // 2. Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown verification error';
      if (process.env.NODE_ENV === 'development') {
        console.error(`${endpointName} ❌ Webhook signature verification failed:`, errorMsg);
      }
      return res.status(400).json({ message: `Webhook Error: ${errorMsg}` });
    }

    // 3. Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ message: 'Payment not completed' });
      }

      const metadata = session.metadata;
      if (!metadata?.userId || !metadata?.packageId || !metadata?.piccoinsAmount) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`${endpointName} ❌ Invalid or missing metadata in session ${session.id}:`, metadata);
        }
        return res.status(400).json({ message: 'Invalid session metadata' });
      }

      // Rest of webhook logic...
      return res.status(200).json({ received: true });
    } else {
      return res.status(200).json({ received: true, ignored: true });
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    if (process.env.NODE_ENV === 'development') {
      console.error(`${endpointName} ❌ Unexpected error processing webhook:`, errorMsg);
    }
    
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? errorMsg : undefined 
    });
  }
} 