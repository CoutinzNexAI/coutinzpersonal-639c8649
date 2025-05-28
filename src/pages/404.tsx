import React from 'react';
import { Button } from '@/components/ui/button'; // Usa o Button para consistência
import { Home } from 'lucide-react'; // Ícone opcional

// Componente para a página 404 personalizada do Next.js
// O Next.js usa automaticamente este ficheiro quando uma rota não é encontrada.
const NotFoundPage = () => {

  // Função para navegação direta - evita o router do Next.js
  const navigateToHome = () => {
        // Navegação direta sem usar o router
    window.location.href = "/";
  };

  return (
    // Container principal para centralizar o conteúdo
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ghibli-cream to-ghibli-sky/30 p-4">
      <div className="text-center bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-xl shadow-lg max-w-md w-full">
        {/* Título 404 */}
        <h1 className="text-6xl md:text-8xl font-bold text-ghibli-wood mb-4 animate-pulse">404</h1>
        {/* Mensagem */}
        <p className="text-xl md:text-2xl text-ghibli-earth mb-8">
          Oops! Página não encontrada.
        </p>
        {/* Botão com navegação direta, evitando o router */}
        <Button className="ghibli-button" onClick={navigateToHome}>
          <Home className="mr-2 h-4 w-4" />
          Voltar para o Início
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage