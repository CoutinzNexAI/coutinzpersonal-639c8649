import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt">
      <Head>
        {/* A SUA META TAG DE VERIFICAÇÃO VAI AQUI */}
        <meta name="facebook-domain-verification" content="nf4c033pu96apciopz3otyc5a9evl1" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}