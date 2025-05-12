import React from 'react';
// Importa os componentes principais que formam a página
import Header from '@/components/Header';
import GhibliHero from '@/components/GhibliHero'; // Componente principal com texto e área interativa
import InteractiveGallery from '@/components/InteractiveGallery'; // Secção da galeria de exemplos
import HowItWorks from '@/components/HowItWorks'; // Secção "Como Funciona"
import Footer from '@/components/Footer'; // Rodapé
import { FAQSection } from '@/components/FAQSection'; // Ajusta o caminho se necessário


// Componente funcional para a página inicial (rota '/')
const Index = () => {

  return (
    // Container principal da página com layout flexível vertical e cor de fundo
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

      {/* Renderiza o rodapé */}
      <Footer />
    </div> // Fim do container principal
  );
};

// Exporta o componente como default para ser usado pelo Next.js
export default Index;
