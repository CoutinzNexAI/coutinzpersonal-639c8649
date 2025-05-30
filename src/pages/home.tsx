import React from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import GhibliHero from '@/components/GhibliHero'; // Componente principal com texto e área interativa
import InteractiveGallery from '@/components/InteractiveGallery'; // Secção da galeria de exemplos
import HowItWorks from '@/components/HowItWorks'; // Secção "Como Funciona"
import Footer from '@/components/Footer'; // Rodapé
import { FAQSection } from '@/components/FAQSection'; // Ajusta o caminho se necessário


// Componente funcional para a página inicial (rota '/')
const Index = () => {

  return (
    <>
      {/* SEO Meta Tags para Portugal/Brasil */}
      <Head>
        <title>Transformar Fotos com AI - Editor Inteligência Artificial | Pictuz</title>
        <meta name="description" content="Transforme suas fotografias em arte incrível com inteligência artificial. Editor de fotos AI gratuito, fácil de usar. Mais de 20 estilos artísticos disponíveis!" />
        <meta name="keywords" content="transformar fotos AI, fotografias inteligência artificial, editor fotos AI grátis, arte AI Portugal, converter foto pintura, gerador arte artificial" />
        
        {/* Open Graph para redes sociais */}
        <meta property="og:title" content="Pictuz - Transformar Fotos com Inteligência Artificial" />
        <meta property="og:description" content="Crie arte incrível a partir das suas fotografias usando AI. Grátis para começar!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pictuz.com" />
        <meta property="og:image" content="https://pictuz.com/og-image.jpg" />
        <meta property="og:locale" content="pt_PT" />
        <meta property="og:site_name" content="Pictuz" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pictuz - Transformar Fotos com AI" />
        <meta name="twitter:description" content="Transforme fotografias em arte com inteligência artificial" />
        <meta name="twitter:image" content="https://pictuz.com/twitter-image.jpg" />
        
        {/* SEO Técnico */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="pt-PT" />
        <meta name="geo.region" content="PT" />
        <meta name="geo.country" content="Portugal" />
        <link rel="canonical" href="https://pictuz.com" />
        
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Pictuz",
              "description": "Transforme fotografias em arte com inteligência artificial",
              "url": "https://pictuz.com",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Web Browser",
              "inLanguage": ["pt-PT", "pt-BR"],
              "creator": {
                "@type": "Organization",
                "name": "Pictuz",
                "url": "https://pictuz.com"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR",
                "description": "Créditos gratuitos disponíveis para começar",
                "availability": "https://schema.org/InStock"
              },
              "featureList": [
                "Transformação de fotos com AI",
                "Mais de 20 estilos artísticos",
                "Upload fácil e rápido",
                "Galeria da comunidade",
                "Créditos gratuitos"
              ],
              "applicationSubCategory": "Photo Editing Software",
              "audience": {
                "@type": "Audience",
                "geographicArea": ["Portugal", "Brasil"]
              }
            })
          }}
        />
      </Head>

      {/* Container principal da página com layout flexível vertical e cor de fundo */}
    <div className="min-h-screen bg-ghibli-cream flex flex-col">
      {/* Renderiza o cabeçalho */}
      <Header />

      {/* Conteúdo principal da página */}
      {/* flex-grow garante que ocupa o espaço disponível, empurrando o footer para baixo */}
      {/* pt-* adiciona padding no topo para compensar a altura do header fixo */}
      <main className="flex-grow pt-16 md:pt-20">

        {/* Renderiza a secção principal (Hero + Estúdio Interativo) */}
        {/* Toda a lógica de passos (upload, estilo, pagamento, etc.) está encapsulada aqui */}
        <GhibliHero />

        {/* Renderiza as secções inferiores da página */}

        {/* Separador visual customizado (assume que a classe ghibli-divider está definida no CSS global) */}
        <div className="ghibli-divider my-12 md:my-16 lg:my-20" />

        {/* Renderiza a secção da galeria interativa */}
        <InteractiveGallery />

        {/* Outro separador visual */}
        <div className="ghibli-divider my-12 md:my-16 lg:my-20" />

        {/* Renderiza a secção "Como Funciona" */}
        <HowItWorks />

        {/* Renderiza a secção de Perguntas Frequentes */}
        <FAQSection />

      </main> {/* Fim do conteúdo principal */}

      {/* Renderiza o rodpé */}
      <Footer />
    </div> // Fim do container principal
    </>
  );
};

// Exporta o componente como default para ser usado pelo Next.js
export default Index;
