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
  },
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
            value: 
              "default-src 'self';" + // Padrão: só permite da mesma origem
              // Scripts permitidos:
              " script-src 'self' 'unsafe-inline' 'unsafe-eval'" + // 'self' e inline/eval (tenta remover unsafe-* se possível no futuro)
              " https://vercel.live https://_next-live/feedback/feedback.js" + // Vercel Live feedback
              " https://www.googletagmanager.com https://*.google-analytics.com" + // Google Analytics e Tag Manager
              " https://js.stripe.com https://m.stripe.network;" + // Stripe JS e Metering
              // Estilos permitidos:
              " style-src 'self' 'unsafe-inline'" + // 'self' e inline styles
              " https://fonts.googleapis.com;" + // Google Fonts
              // Fontes permitidas:
              " font-src 'self' https://fonts.gstatic.com;" + // 'self' e Google Fonts
              // Imagens permitidas:
              " img-src 'self' data: https: blob:" + // 'self', data URIs, qualquer HTTPS, blobs
              " https://*.stripe.com;" + // Imagens do Stripe
              // Conexões permitidas (API calls, WebSockets):
              " connect-src 'self'" + // 'self'
              " https://*.supabase.co" + // Supabase
              " https://api.stripe.com https://m.stripe.network" + // Stripe API e Metering
              " https://vercel.live wss://vercel.live" + // Vercel Live websockets
              " https://region1.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com;" + // Google Analytics
              // Iframes permitidos:
              " frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://m.stripe.network;" + // Stripe Elements/iframes
              // Outras diretivas de segurança:
              " object-src 'none';" + // Não permite <object>, <embed>, <applet>
              " base-uri 'self';" // Restringe o <base> tag
              // " form-action 'self';" // Opcional: restringe para onde os formulários podem submeter
              // " frame-ancestors 'none';" // Similar ao X-Frame-Options: DENY
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