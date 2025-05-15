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
  console.log('[Webhook] Required environment variables verified.');

  // --- Step 4: Construct Stripe Event ---
  let event: Stripe.Event;
  try {
    console.log('[Webhook] Initializing Stripe client...');
    const stripe = new Stripe(stripeSecretKey, {
      typescript: true,
      apiVersion: '2025-04-30.basil', // Or your preferred version
    });

    console.log('[Webhook] Attempting to construct Stripe event...');
    event = stripe.webhooks.constructEvent(
      rawBody.toString(),
      signature,
      webhookSecret
    );
    console.log(`[Webhook] Successfully constructed event. ID: ${event.id}, Type: ${event.type}`);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ [Webhook] Error constructing Stripe event (Webhook signature verification failed?): ${errorMessage}`);
    return res.status(400).json({ message: `Webhook Error: ${errorMessage}`, error: errorMessage });
  }

  // --- Step 5: Process the event ---
  if (event.type === 'checkout.session.completed') {
    console.log(`[Webhook] Processing checkout.session.completed event: ${event.id}`);
    const session = event.data.object as Stripe.Checkout.Session;

    const jobId = session.metadata?.jobId;
    if (!jobId) {
      console.error(`❌ [Webhook] No jobId found in session metadata for session: ${session.id}`);
      return res.status(200).json({ received: true, message: "Missing jobId in metadata" }); // Acknowledge, but don't proceed
    }
    console.log(`[Webhook] Found jobId: ${jobId} in metadata for session: ${session.id}`);

    if (session.payment_status === 'paid') {
      console.log(`✅ [Webhook] Payment successful for job: ${jobId}, session: ${session.id}, payment_intent: ${session.payment_intent}`);

      try {
        // --- Step 5a: Update Supabase ---
        console.log(`[Webhook] Attempting to update job status to 'paid' for job: ${jobId}`);
        // CORRECTION: Removed 'updated_at' field as it doesn't exist in the schema
        const { error: updateError } = await supabaseAdmin
          .from('transformations')
          .update({
            status: 'paid',
            stripe_charge_id: session.payment_intent as string
            // updated_at: new Date().toISOString() // REMOVED THIS LINE
          })
          .eq('id', jobId);

        if (updateError) {
          console.error(`❌ [Webhook] Failed to update job status to 'paid' for job ${jobId}: ${updateError.message}`);
          // Return 500 to potentially make Stripe retry if DB update fails
          return res.status(500).json({ message: 'Failed to update job status', error: updateError.message });
        }
        console.log(`✅ [Webhook] Successfully updated job status to 'paid' for job: ${jobId}`);

        // --- Step 5b: Trigger Image Processing ---
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.origin || 'https://www.pictuz.com/';
        const processImageUrl = `${baseUrl}/api/process-image`;

        console.log(`[Webhook] Attempting to trigger image processing for job ${jobId} via POST to: ${processImageUrl}`);
        // Intentionally NOT awaiting fetch - run in background
        fetch(processImageUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': internalSecret // Already verified it exists
          },
          body: JSON.stringify({ jobId })
        })
        .then(async (response) => {
            const responseBody = await response.text(); // Read body safely
            if (!response.ok) {
                console.error(`❌ [Webhook] Failed fetch to trigger image processing for job ${jobId}. Status: ${response.status}. Response: ${responseBody}`);
                // Consider updating job status to indicate trigger failure
                // await updateJobStatus(jobId, 'payment_ok_trigger_failed', `Webhook failed to trigger processing: ${response.status} - ${responseBody}`);
            } else {
                console.log(`✅ [Webhook] Successfully triggered image processing for job ${jobId}. Response Status: ${response.status}. Response: ${responseBody}`);
            }
        })
        .catch(error => {
          const fetchErrorMessage = error instanceof Error ? error.message : 'Unknown fetch error';
          console.error(`❌ [Webhook] Network error during fetch to trigger image processing for job ${jobId}: ${fetchErrorMessage}`);
          // Consider updating job status to indicate trigger failure
          // await updateJobStatus(jobId, 'payment_ok_trigger_failed', `Webhook network error triggering processing: ${fetchErrorMessage}`);
        });

        console.log(`[Webhook] Fetch call initiated for job: ${jobId}. Webhook handler responding 200 OK.`);
        // Respond 200 OK immediately to Stripe, even if fetch fails later
        return res.status(200).json({ received: true, message: 'Payment confirmed, processing triggered.' });

      } catch (dbError) { // Catch errors specifically during the DB update
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error during DB update';
        console.error(`❌ [Webhook] Error during Supabase update for job ${jobId}: ${errorMessage}`);
        // Return 500 because the critical DB step failed
        return res.status(500).json({ message: 'Server error during database update', error: errorMessage });
      }

    } else {
      console.warn(`[Webhook] Payment not completed for job: ${jobId}, session: ${session.id}, status: ${session.payment_status}`);
      // Optionally update status to failed_payment here if needed
      return res.status(200).json({ received: true, message: `Payment status was ${session.payment_status}` });
    }

  } else {
     console.log(`[Webhook] Received event type: ${event.type} (Acknowledged)`);
     return res.status(200).json({ received: true, message: `Acknowledged ${event.type}` });
  }
}
