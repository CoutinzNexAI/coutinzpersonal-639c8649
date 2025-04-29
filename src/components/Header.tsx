
import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu, User } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed w-full top-0 z-50 backdrop-blur-md bg-white/70 border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <span className="text-2xl font-bold text-gradient">Estúdio Criativo AI</span>
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#studio" className="text-foreground hover:text-primary transition-colors">Estúdio</a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">Galeria</a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">Sobre</a>
          <Button variant="ghost" size="icon" className="ml-2">
            <User className="h-5 w-5" />
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
