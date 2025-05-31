import Stripe from 'stripe';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { NextApiRequest, NextApiResponse } from 'next';
import { applyRateLimit, purchaseApiRateLimiter } from '@/lib/rate-limit'; // Importa o rate limiter

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
  apiVersion: '2025-04-30.basil', // Use your desired Stripe API version
});

// Helper function to manually parse a specific cookie
function getManuallyParsedCookie(cookieString: string, cookieName: string): string | undefined {
  if (!cookieString) return undefined;
  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name === cookieName) {
      return parts.slice(1).join('='); // Handle cookie values that might contain '='
    }
  }
  return undefined;
}

// Define your PicCoin packages
// Ensure prices are in the smallest currency unit (e.g., cents for EUR)
const PICCOIN_PACKAGES = {
  starter: { coins: 1, price: 200, name: 'STARTER' }, // 2 EUR = 200 cents
  popular: { coins: 3, price: 500, name: 'POPULAR' }, // 5 EUR = 500 cents
  premium: { coins: 7, price: 1000, name: 'PREMIUM' }, // 10 EUR = 1000 cents
  mega: { coins: 15, price: 2000, name: 'MEGA' },     // 20 EUR = 2000 cents
  ultimate: { coins: 50, price: 5000, name: 'ULTIMATE' } // 50 EUR = 5000 cents
};

type PackageId = keyof typeof PICCOIN_PACKAGES;

// Função para verificar se é um pacote promocional de primeira compra
const isFirstPurchasePromo = (packageId: string): boolean => {
  return packageId.endsWith('_first_purchase_promo');
};

// Função para obter o pacote base de um ID promocional
const getBasePackageId = (promoPackageId: string): string => {
  return promoPackageId.replace('_first_purchase_promo', '') as keyof typeof PICCOIN_PACKAGES;
};

// Função para calcular preço promocional (50% de desconto)
const getPromoPrice = (basePrice: number): number => {
  return Math.ceil(basePrice * 0.5);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const endpointName = '[API /api/piccoins/purchase]';

  if (req.method !== 'POST') {
    console.warn(`${endpointName} Method not allowed: ${req.method}`);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. Validate authentication using Supabase SSR client with robust cookie parsing
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookieStrToParse = req.headers.cookie ?? '';
            const parsedCookiesObjectOriginal = parseCookieHeader(cookieStrToParse);
            const originalValue = parsedCookiesObjectOriginal[name];
            
            if (name.startsWith('sb-') && name.includes('-auth-token') && originalValue === undefined) {
              return getManuallyParsedCookie(cookieStrToParse, name);
            }
            return originalValue;
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
          // remove is not typically needed for this flow but included for completeness
          remove: (name: string, options) => {
            const cookie = serializeCookieHeader(name, '', { ...options, maxAge: 0 });
            let setCookieHeader = res.getHeader('Set-Cookie') ?? [];
            if (typeof setCookieHeader === 'string') setCookieHeader = [setCookieHeader];
            else if (typeof setCookieHeader === 'number') setCookieHeader = [String(setCookieHeader)];
            res.setHeader('Set-Cookie', [...setCookieHeader, cookie]);
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized', detail: authError?.message || 'User not authenticated.' });
    }
    // Se chegou aqui, o user está autenticado. AGORA aplicamos o rate limit.
    const permitted = await applyRateLimit(req, res, purchaseApiRateLimiter, user.id);
    if (!permitted) {
      console.warn(`${endpointName} Rate limit exceeded for user: ${user.id}`);
      return; 
    }

    // 2. Get packageId from request body
    const { packageId } = req.body;

    if (!packageId || typeof packageId !== 'string') {
      console.warn(`${endpointName} Invalid packageId received: ${packageId}`);
      return res.status(400).json({ message: 'Invalid package ID provided.' });
    }

    // Verificar se é um pacote promocional ou normal
    const isPromo = isFirstPurchasePromo(packageId);
    const basePackageId = isPromo ? getBasePackageId(packageId) : packageId;
    
    if (!PICCOIN_PACKAGES[basePackageId as PackageId]) {
      console.warn(`${endpointName} Invalid base packageId: ${basePackageId}`);
      return res.status(400).json({ message: 'Invalid package ID provided.' });
    }

    const selectedPackage = PICCOIN_PACKAGES[basePackageId as PackageId];
    const finalPrice = isPromo ? getPromoPrice(selectedPackage.price) : selectedPackage.price;
    const packageDisplayName = isPromo ? `${selectedPackage.name} (PRIMEIRA COMPRA -50%)` : selectedPackage.name;

    // 3. Get the application URL from environment variables
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return res.status(500).json({ message: 'Server configuration error: Application URL is not set.' });
    }


    // 4. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `PicCoins ${packageDisplayName}`,
              description: `${selectedPackage.coins} PicCoins para transformações de imagem no PicTuz`,
              // You can add images here if you have URLs for them
              // images: ['https://example.com/your-product-image.png'],
            },
            unit_amount: finalPrice, // Price in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}&package_id=${packageId}`,
      cancel_url: `${appUrl}/pricing?canceled=true&package_id=${packageId}`,
      allow_promotion_codes: true,
      customer_email: user.email, // Pre-fill customer email if available
      metadata: {
        userId: user.id, // Comes from authenticated user session
        packageId: basePackageId, // Use o ID base para processamento
        originalPackageId: packageId, // Manter o ID original para logging
        piccoinsAmount: selectedPackage.coins.toString(), // Store amount of PicCoins
        packageName: selectedPackage.name,
        purchaseType: 'piccoin_package', // General type for this transaction
        isFirstPurchasePromo: isPromo.toString(), // Flag para identificar se é promoção
        originalPrice: selectedPackage.price.toString(), // Preço original
        finalPrice: finalPrice.toString(), // Preço final pago
        discountPercent: isPromo ? '50' : '0' // Percentagem de desconto
      },
      // To collect billing addresses if needed for tax or other reasons
      // billing_address_collection: 'required', 
      // shipping_address_collection: {
      //   allowed_countries: ['PT', 'ES', 'FR', 'DE', 'IT', 'GB', 'US'], // Example countries
      // },
    });

    return res.status(200).json({ sessionId: session.id });

  } catch (error: unknown) { // <<< Alterado de 'any' para 'unknown'
    let errorMessage = 'An unknown error occurred.';
    let errorDetail: string | undefined = undefined;
    let statusCode = 500;
    let type: string | undefined;
    let code: string | undefined;
    let param: string | undefined;

    if (error instanceof Stripe.errors.StripeError) {
      // Se for um erro específico do Stripe SDK
      statusCode = error.statusCode || 500;
      errorMessage = error.message || 'An error occurred with the payment provider.';
      type = error.type;
      code = error.code;
      param = error.param;
      return res.status(statusCode).json({ 
        message: errorMessage,
        type,
        code,
        param 
      });
    } else if (typeof error === 'object' && error !== null) {
      // Tentativa de lidar com outros objetos de erro que possam ter propriedades do Stripe
      const potentialStripeError = error as { type?: unknown, statusCode?: unknown, message?: unknown, code?: unknown, param?: unknown };
      if (typeof potentialStripeError.type === 'string' && potentialStripeError.type.startsWith('Stripe')) {
        statusCode = typeof potentialStripeError.statusCode === 'number' ? potentialStripeError.statusCode : 500;
        errorMessage = typeof potentialStripeError.message === 'string' ? potentialStripeError.message : 'An error occurred with the payment provider.';
        type = potentialStripeError.type;
        code = typeof potentialStripeError.code === 'string' ? potentialStripeError.code : undefined;
        param = typeof potentialStripeError.param === 'string' ? potentialStripeError.param : undefined;
        return res.status(statusCode).json({ 
          message: errorMessage,
          type,
          code,
          param 
        });
      }
      // Se for um objeto de erro genérico com uma propriedade 'message'
      if (typeof potentialStripeError.message === 'string') {
        errorDetail = potentialStripeError.message;
      }
    } else if (error instanceof Error) {
      // Se for uma instância de Error padrão do JavaScript
      errorDetail = error.message;
    } else {
      // Se for outra coisa (ex: uma string foi lançada)
      errorDetail = String(error);
    }
    
    // Fallback para erros não Stripe ou outros erros
    return res.status(statusCode).json({ message: 'Internal Server Error', detail: errorDetail || errorMessage });
  } 
}