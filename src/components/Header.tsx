
import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu, Brush } from "lucide-react";
import UserMenu from "./UserMenu";

const Header = () => {
  return (
    <header className="w-full py-4 border-b border-ghibli-sand/30 bg-ghibli-paper/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <a href="/" className="flex items-center group">
            <Brush className="h-6 w-6 mr-2 text-ghibli-moss" />
            <span className="text-2xl font-ghibli font-bold text-ghibli-wood group-hover:text-ghibli-moss transition-colors">Estúdio Criativo AI</span>
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" className="text-ghibli-wood hover:text-ghibli-moss hover:bg-ghibli-cream">
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#galeria" className="text-ghibli-wood hover:text-ghibli-moss transition-colors">Galeria</a>
          <a href="#como-funciona" className="text-ghibli-wood hover:text-ghibli-moss transition-colors">Como Funciona</a>
          <a href="#sobre" className="text-ghibli-wood hover:text-ghibli-moss transition-colors">Sobre</a>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
};

export default Header;
