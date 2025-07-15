import Script from 'next/script';
import Head from 'next/head';

const TestePixelPage = () => {
  const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  return (
    <>
      <Head>
        <title>Teste de Pixel</title>
      </Head>
      {PIXEL_ID && (
        <Script
          id="meta-pixel-test"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${PIXEL_ID}');
              fbq('track', 'PageView');
              console.log('Píxel na página de teste foi inicializado e o track PageView foi chamado.');
            `,
          }}
        />
      )}
      <div style={{ padding: '40px', fontFamily: 'sans-serif', fontSize: '24px' }}>
        <h1>Página de Teste do Píxel</h1>
        <p>Esta página contém APENAS o script do Píxel da Meta.</p>
        <p>Verifique a extensão Meta Pixel Helper e a consola do navegador.</p>
      </div>
    </>
  );
};

export default TestePixelPage;