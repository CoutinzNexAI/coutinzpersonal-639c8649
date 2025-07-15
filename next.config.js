/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Se o Stripe usar imagens de um domínio específico que não seja coberto por 'https:',
      // poderíamos adicioná-lo aqui, mas para CSP, img-src é mais direto.
      // Exemplo:
      // {
      //   protocol: 'https',
      //   hostname: '*.stripe.com', // Se necessário para next/image
      // },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Melhora a qualidade das imagens
    dangerouslyAllowSVG: true,
    minimumCacheTTL: 60,
    unoptimized: false,
  },
  compress: false, // Desabilita compressão para melhor qualidade
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block' // Header legado, mas não prejudica
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains' // Garante HTTPS
          },
          {
            key: 'Content-Security-Policy',
            value: `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://_next-live/feedback/feedback.js https://www.googletagmanager.com https://*.google-analytics.com https://js.stripe.com https://m.stripe.network https://eu-assets.i.posthog.com https://*.posthog.com https://connect.facebook.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob: https://*.stripe.com;
    connect-src 'self' https://*.supabase.co https://api.stripe.com https://m.stripe.network https://vercel.live wss://vercel.live https://region1.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://*.posthog.com https://connect.facebook.net;
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://m.stripe.network https://vercel.live;
    object-src 'none';
    base-uri 'self';
`.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      },
      {
        source: '/api/(.*)', // Para todas as tuas rotas de API
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow' // Impede indexação das APIs
          }
        ]
      }
    ];
  }
};

export default nextConfig;