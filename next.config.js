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
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' blob: data: https: http:",
              "media-src 'self' blob: data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://m.stripe.network https://vercel.live",
              "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com https://analytics.google.com"
            ].join('; ')
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