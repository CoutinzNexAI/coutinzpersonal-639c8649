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
  console.log(`${endpointName} Webhook received. Method: ${req.method}`);

  if (req.method !== 'POST') {
    console.warn(`${endpointName} Method not allowed: ${req.method}`);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. Get the raw body for signature verification
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      console.error(`${endpointName} Missing stripe-signature header`);
      return res.status(400).json({ message: 'Missing stripe-signature header' });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error(`${endpointName} STRIPE_WEBHOOK_SECRET not configured`);
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    // 2. Verify webhook signature
  let event: Stripe.Event;
  try {
      event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
      console.log(`${endpointName} ✅ Webhook signature verified. Event type: ${event.type}`);
  } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown verification error';
      console.error(`${endpointName} ❌ Webhook signature verification failed:`, errorMsg);
      return res.status(400).json({ message: `Webhook Error: ${errorMsg}` });
    }

    // 3. Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;


      // 4. Validate payment was successful
      if (session.payment_status !== 'paid') {
        console.warn(`${endpointName} ⚠️ Session ${session.id} payment not completed. Status: ${session.payment_status}`);
        return res.status(200).json({ message: 'Payment not completed, no action taken' });
      }

      // 5. Extract and validate metadata
      const metadata = session.metadata as unknown as WebhookMetadata;
      if (!metadata?.userId || !metadata?.piccoinsAmount || !metadata?.purchaseType) {
        console.error(`${endpointName} ❌ Invalid or missing metadata in session ${session.id}:`, metadata);
        return res.status(400).json({ message: 'Invalid session metadata' });
      }

      const { userId, piccoinsAmount, packageId, packageName } = metadata;
      const coinsAmount = parseInt(piccoinsAmount, 10);

      if (isNaN(coinsAmount) || coinsAmount <= 0) {
        console.error(`${endpointName} ❌ Invalid piccoinsAmount: ${piccoinsAmount}`);
        return res.status(400).json({ message: 'Invalid piccoins amount' });
      }


      // 6. Check for duplicate processing (idempotency)
      const { data: existingTransaction, error: checkError } = await supabaseAdmin
        .from('piccoin_transactions')
        .select('id, reference_id')
        .eq('reference_id', session.id)
        .eq('type', 'purchase')
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found (expected)
        console.error(`${endpointName} ❌ Error checking for existing transaction:`, checkError.message);
        return res.status(500).json({ message: 'Database error during idempotency check' });
      }

      if (existingTransaction) {
        return res.status(200).json({ 
          message: 'Transaction already processed', 
          transactionId: existingTransaction.id 
        });
      }

      // 7. Credit PicCoins using the atomic RPC function
      
      const { data: earnResult, error: earnError } = await supabaseAdmin.rpc('earn_piccoins', {
        p_user_id: userId,
        p_amount: coinsAmount,
        p_type: 'purchase',
        p_reference_id: session.id,
        p_description: `Compra de ${coinsAmount} PicCoins - Pacote ${packageName} (${packageId})`
      });

      if (earnError) {
        console.error(`${endpointName} ❌ Error crediting PicCoins:`, earnError.message);
        // Log full error details for debugging
        console.error(`${endpointName} Full RPC error:`, JSON.stringify(earnError, null, 2));
        return res.status(500).json({ message: 'Error crediting PicCoins' });
      }

      if (!earnResult?.success) {
        console.error(`${endpointName} ❌ RPC returned success=false:`, earnResult?.error || 'Unknown RPC error');
        return res.status(500).json({ message: 'Failed to credit PicCoins', detail: earnResult?.error });
      }

      
      return res.status(200).json({ 
        success: true,
        message: 'PicCoins credited successfully',
        sessionId: session.id,
        userId: userId,
        coinsAdded: coinsAmount,
        newBalance: earnResult.newBalance
      });

    } else {
      // Handle other event types if needed
  
      return res.status(200).json({ message: `Unhandled event type: ${event.type}` });
    }

  } catch (error: unknown) {
    console.error(`${endpointName} ❌ Unexpected error processing webhook:`, error);
    
    let errorMessage = 'Internal server error';
    let errorDetail: string | undefined;

    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = error.message || 'Stripe webhook error';
      errorDetail = `${error.type}: ${error.code}`;
    } else if (error instanceof Error) {
      errorMessage = 'Webhook processing error';
      errorDetail = error.message;
  } else {
      errorDetail = String(error);
    }

    return res.status(500).json({ 
      message: errorMessage,
      detail: errorDetail 
    });
  }
} 