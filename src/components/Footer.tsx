
import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="py-12 border-t border-ghibli-sand/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <div className="mb-8">
            <span className="text-2xl font-ghibli font-bold text-ghibli-wood">Estúdio Criativo AI</span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8">
            <a href="#" className="text-ghibli-earth hover:text-ghibli-moss transition-colors">Termos de Serviço</a>
            <a href="#" className="text-ghibli-earth hover:text-ghibli-moss transition-colors">Política de Privacidade</a>
            <a href="#" className="text-ghibli-earth hover:text-ghibli-moss transition-colors">Sobre</a>
            <a href="#" className="text-ghibli-earth hover:text-ghibli-moss transition-colors">Contato</a>
          </div>

          <div className="text-sm text-ghibli-earth flex items-center">
            <span>&copy; {year} Estúdio Criativo AI. Todos os direitos reservados.</span>
            <span className="ml-2 text-lg">🍃</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
