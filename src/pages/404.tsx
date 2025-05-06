import React from 'react';
import Link from 'next/link'; // Importa o Link do Next.js
import { Button } from '@/components/ui/button'; // Usa o Button para consistência
import { Home } from 'lucide-react'; // Ícone opcional

// Componente para a página 404 personalizada do Next.js
// O Next.js usa automaticamente este ficheiro quando uma rota não é encontrada.
const NotFoundPage = () => {

  // Não precisamos de useLocation ou useEffect aqui,
  // o Next.js já sabe que esta é a página 404.

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
        {/* Link para voltar à página inicial usando o componente Link do Next.js */}
        <Link href="/" passHref legacyBehavior>
           <Button asChild className="ghibli-button">
             <a> {/* Tag 'a' necessária dentro do Button com asChild */}
               <Home className="mr-2 h-4 w-4" />
               Voltar para o Início
             </a>
           </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage