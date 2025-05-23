import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { supabaseAdmin } from '@/lib/supabase/admin'; // Re-enabled

export const config = {
  api: {
    bodyParser: false,
  },
};

type ResponseData = {
  received?: boolean;
  message: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log('[Webhook] Received request. Method:', req.method);

  if (req.method !== 'POST') {
    console.warn('[Webhook] Method not allowed:', req.method);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // --- Step 1: Read Raw Body ---
  let rawBody: Buffer;
  try {
    console.log('[Webhook] Attempting to read raw body using buffer(req)...');
    rawBody = await buffer(req);
    console.log('[Webhook] Successfully read raw body. Length:', rawBody.length);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ [Webhook] Error reading raw body: ${errorMessage}`);
    return res.status(500).json({ message: 'Failed to read request body', error: errorMessage });
  }

  // --- Step 2: Get Stripe Signature ---
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    console.error('❌ [Webhook] No Stripe signature found in request headers');
    return res.status(400).json({ message: 'No Stripe signature found' });
  }
  console.log('[Webhook] Stripe signature found in headers.');

  // --- Step 3: Verify Environment Variables ---
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const internalSecret = process.env.INTERNAL_API_SECRET; // Needed for fetch

  if (!stripeSecretKey || !webhookSecret || !internalSecret) {
     console.error('❌ [Webhook] Missing required environment variables (Stripe keys or Internal Secret)');
     const missing = [];
     if (!stripeSecretKey) missing.push('STRIPE_SECRET_KEY');
     if (!webhookSecret) missing.push('STRIPE_WEBHOOK_SECRET');
     if (!internalSecret) missing.push('INTERNAL_API_SECRET');
     return res.status(500).json({ message: `Server configuration incomplete: Missing ${missing.join(', ')}` });
  }

  // --- Step 4: Construct Stripe Event ---
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeSecretKey, {
      typescript: true,
      apiVersion: '2025-04-30.basil', // Or your preferred version
    });

    event = stripe.webhooks.constructEvent(
      rawBody.toString(),
      signature,
      webhookSecret
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ [Webhook] Error constructing Stripe event (Webhook signature verification failed?): ${errorMessage}`);
    return res.status(400).json({ message: `Webhook Error: ${errorMessage}`, error: errorMessage });
  }

  // --- Step 5: Process the event ---
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Check if this is a transformation payment or PicCoin purchase
    const jobId = session.metadata?.jobId;
    const packageId = session.metadata?.packageId;
    const userId = session.metadata?.userId;

    if (jobId) {
      // Handle transformation payment
      if (session.payment_status === 'paid') {
        console.log(`✅ [Webhook] Payment successful for job: ${jobId}, session: ${session.id}, payment_intent: ${session.payment_intent}`);

        try {
          // --- Step 5a: Update Supabase ---
          const { error: updateError } = await supabaseAdmin
            .from('transformations')
            .update({
              status: 'paid',
              stripe_charge_id: session.payment_intent as string
            })
            .eq('id', jobId);

          if (updateError) {
            console.error(`❌ [Webhook] Failed to update job status to 'paid' for job ${jobId}: ${updateError.message}`);
            return res.status(500).json({ message: 'Failed to update job status', error: updateError.message });
          }

          // --- Step 5b: Trigger Image Processing ---
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.origin || 'https://www.pictuz.com/';
          const processImageUrl = `${baseUrl}/api/process-image`;

          // Intentionally NOT awaiting fetch - run in background
          fetch(processImageUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Secret': internalSecret
            },
            body: JSON.stringify({ jobId })
          })
          .then(async (response) => {
              const responseBody = await response.text();
              if (!response.ok) {
                  console.error(`❌ [Webhook] Failed fetch to trigger image processing for job ${jobId}. Status: ${response.status}. Response: ${responseBody}`);
              } else {
                  console.log(`✅ [Webhook] Successfully triggered image processing for job ${jobId}. Response Status: ${response.status}. Response: ${responseBody}`);
              }
          })
          .catch(error => {
            const fetchErrorMessage = error instanceof Error ? error.message : 'Unknown fetch error';
            console.error(`❌ [Webhook] Network error during fetch to trigger image processing for job ${jobId}: ${fetchErrorMessage}`);
          });

          return res.status(200).json({ received: true, message: 'Payment confirmed, processing triggered.' });

        } catch (dbError) {
          const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error during DB update';
          console.error(`❌ [Webhook] Error during Supabase update for job ${jobId}: ${errorMessage}`);
          return res.status(500).json({ message: 'Server error during database update', error: errorMessage });
        }

      } else {
        console.warn(`[Webhook] Payment not completed for job: ${jobId}, session: ${session.id}, status: ${session.payment_status}`);
        return res.status(200).json({ received: true, message: `Payment status was ${session.payment_status}` });
      }

    } else if (packageId && userId) {
      // Handle PicCoin purchase
      if (session.payment_status === 'paid') {
        console.log(`✅ [Webhook] PicCoin purchase successful for user: ${userId}, package: ${packageId}, session: ${session.id}`);

        try {
          // Define package configurations
          const packages: Record<string, { coins: number; price: number }> = {
            starter: { coins: 1, price: 2 },
            popular: { coins: 3, price: 5 },
            premium: { coins: 7, price: 10 },
            mega: { coins: 15, price: 20 },
            ultimate: { coins: 50, price: 50 }
          };

          const packageInfo = packages[packageId];
          if (!packageInfo) {
            console.error(`❌ [Webhook] Unknown package ID: ${packageId}`);
            return res.status(400).json({ message: 'Unknown package ID' });
          }

          // Use the earn_piccoins RPC function for atomic transaction
          const { error: earnError } = await supabaseAdmin.rpc('earn_piccoins', {
            p_user_id: userId,
            p_amount: packageInfo.coins,
            p_description: `Compra de pacote ${packageId.toUpperCase()} - ${packageInfo.coins} PicCoins`,
            p_transaction_id: session.id
          });

          if (earnError) {
            console.error(`❌ [Webhook] Failed to add PicCoins for user ${userId}: ${earnError.message}`);
            return res.status(500).json({ message: 'Failed to add PicCoins', error: earnError.message });
          }

          console.log(`✅ [Webhook] Successfully added ${packageInfo.coins} PicCoins to user ${userId}`);
          return res.status(200).json({ received: true, message: 'PicCoins added successfully.' });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error during PicCoin purchase';
          console.error(`❌ [Webhook] Error during PicCoin purchase for user ${userId}: ${errorMessage}`);
          return res.status(500).json({ message: 'Server error during PicCoin purchase', error: errorMessage });
        }

      } else {
        console.warn(`[Webhook] PicCoin purchase payment not completed for user: ${userId}, session: ${session.id}, status: ${session.payment_status}`);
        return res.status(200).json({ received: true, message: `Payment status was ${session.payment_status}` });
      }

    } else {
      console.error(`❌ [Webhook] No valid metadata found in session: ${session.id}. Expected jobId or (packageId + userId)`);
      return res.status(200).json({ received: true, message: "Invalid or missing metadata" });
    }

  } else {
     console.log(`[Webhook] Received event type: ${event.type} (Acknowledged)`);
     return res.status(200).json({ received: true, message: `Acknowledged ${event.type}` });
  }
}
