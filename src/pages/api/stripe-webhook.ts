import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { trackEvent } from '@/lib/posthog';

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
  console.log(`${endpointName} Received webhook request`);

  // 🔥 TRACKING: Webhook received
  try {
    trackEvent('stripe_webhook_received', {
      event_type: 'unknown', // Will be updated once parsed
      timestamp: new Date().toISOString()
    });
  } catch (trackError) {
    console.warn(`${endpointName} Failed to track webhook received:`, trackError);
  }

  if (req.method !== 'POST') {
    console.warn(`${endpointName} Method not allowed: ${req.method}`);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. Get raw body and signature
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      console.error(`${endpointName} ❌ Missing Stripe signature header`);
      return res.status(400).json({ message: 'Missing Stripe signature' });
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

      // 🔥 TRACKING: Webhook signature verified
      trackEvent('stripe_webhook_verified', {
        event_type: event.type,
        event_id: event.id
      });
  } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown verification error';
      console.error(`${endpointName} ❌ Webhook signature verification failed:`, errorMsg);

      // 🔥 TRACKING: Webhook verification failed
      trackEvent('stripe_webhook_verification_failed', {
        error_message: errorMsg,
        has_signature: !!sig
      });

      return res.status(400).json({ message: `Webhook signature verification failed: ${errorMsg}` });
    }

    // 3. Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

      // 🔥 TRACKING: Processing checkout session
      trackEvent('stripe_checkout_session_processing', {
        session_id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total
      });

      // 4. Validate payment was successful
      if (session.payment_status !== 'paid') {
        console.warn(`${endpointName} ⚠️ Payment not completed. Status: ${session.payment_status}`);

        // 🔥 TRACKING: Payment not completed
        trackEvent('stripe_payment_not_completed', {
          session_id: session.id,
          payment_status: session.payment_status,
          amount_total: session.amount_total
        });

        return res.status(400).json({ message: 'Payment not completed' });
      }

      // 5. Extract and validate metadata
      const metadata = session.metadata as unknown as WebhookMetadata;
      const { userId, packageId, piccoinsAmount, packageName } = metadata;

      console.log(`${endpointName} Processing payment for user ${userId}, package ${packageId}`);

      if (!userId || !packageId || !piccoinsAmount || !packageName) {
        console.error(`${endpointName} ❌ Missing required metadata:`, metadata);

        // 🔥 TRACKING: Missing metadata
        trackEvent('stripe_missing_metadata', {
          session_id: session.id,
          has_user_id: !!userId,
          has_package_id: !!packageId,
          has_piccoins_amount: !!piccoinsAmount,
          has_package_name: !!packageName
        });

        return res.status(400).json({ message: 'Missing required metadata in session' });
      }

      const coinsAmount = parseInt(piccoinsAmount);
      if (isNaN(coinsAmount) || coinsAmount <= 0) {
        console.error(`${endpointName} ❌ Invalid piccoins amount: ${piccoinsAmount}`);

        // 🔥 TRACKING: Invalid piccoins amount
        trackEvent('stripe_invalid_piccoins_amount', {
          session_id: session.id,
          user_id: userId,
          piccoins_amount: piccoinsAmount
        });

        return res.status(400).json({ message: 'Invalid piccoins amount' });
      }

      // 6. Check for duplicate processing (idempotency)
      const { data: existingTransaction, error: duplicateCheckError } = await supabaseAdmin
        .from('piccoin_transactions')
        .select('id')
        .eq('reference_id', session.id)
        .eq('user_id', userId)
        .single();

      if (duplicateCheckError && duplicateCheckError.code !== 'PGRST116') {
        console.error(`${endpointName} ❌ Error checking for duplicate transaction:`, duplicateCheckError.message);

        // 🔥 TRACKING: Duplicate check error
        trackEvent('stripe_duplicate_check_error', {
          session_id: session.id,
          user_id: userId,
          error_message: duplicateCheckError.message
        });

        return res.status(500).json({ message: 'Error checking transaction status' });
      }

      if (existingTransaction) {
        // 🔥 TRACKING: Transaction already processed
        trackEvent('stripe_transaction_already_processed', {
          session_id: session.id,
          user_id: userId,
          existing_transaction_id: existingTransaction.id
        });

        return res.status(200).json({ 
          message: 'Transaction already processed', 
          transactionId: existingTransaction.id 
        });
      }

      // 7. Credit PicCoins using the atomic RPC function
      // 🔥 TRACKING: Starting credit process
      trackEvent('stripe_crediting_piccoins_start', {
        session_id: session.id,
        user_id: userId,
        coins_amount: coinsAmount,
        package_id: packageId
      });
      
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

        // 🔥 TRACKING: Crediting failed
        trackEvent('stripe_crediting_piccoins_failed', {
          session_id: session.id,
          user_id: userId,
          error_message: earnError.message,
          coins_amount: coinsAmount
        });

        return res.status(500).json({ message: 'Error crediting PicCoins' });
      }

      if (!earnResult?.success) {
        console.error(`${endpointName} ❌ RPC returned success=false:`, earnResult?.error || 'Unknown RPC error');

        // 🔥 TRACKING: RPC returned failure
        trackEvent('stripe_rpc_returned_failure', {
          session_id: session.id,
          user_id: userId,
          rpc_error: earnResult?.error || 'Unknown RPC error',
          coins_amount: coinsAmount
        });

        return res.status(500).json({ message: 'Failed to credit PicCoins', detail: earnResult?.error });
      }

      // 🔥 TRACKING: Successfully credited PicCoins
      trackEvent('stripe_piccoins_credited_success', {
        session_id: session.id,
        user_id: userId,
        coins_added: coinsAmount,
        new_balance: earnResult.newBalance,
        package_id: packageId,
        package_name: packageName,
        amount_paid: session.amount_total,
        currency: session.currency
      });
      
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
      // 🔥 TRACKING: Unhandled event type
      trackEvent('stripe_webhook_unhandled_event', {
        event_type: event.type,
        event_id: event.id
      });
  
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