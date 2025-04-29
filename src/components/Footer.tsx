
import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="py-12 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <div className="mb-8">
            <span className="text-2xl font-bold text-gradient">Estúdio Criativo AI</span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Termos de Serviço</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Sobre</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contato</a>
          </div>

          <div className="text-sm text-muted-foreground">
            &copy; {year} Estúdio Criativo AI. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
