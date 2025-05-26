// src/components/Header.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import UserMenu from "./UserMenu"; // Assume que UserMenu.tsx existe
import { PicCoinBalance } from './PicCoinBalance'; // Assume que PicCoinBalance.tsx existe
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';

// Interface para os links de navegação (simplificada)
interface NavLink {
  href: string;
  label: string;
  id: string; // Mantido para key prop, mas não usado para scrollspy
}

// Links de navegação simplificados
const navLinks: NavLink[] = [
  { href: "/pricing", label: "Preço", id: "pricing" },
];

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // Estado para scroll do header
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const router = useRouter();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (router.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/');
    }
  };

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Efeito para fechar menu mobile com clique fora ou Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && 
          mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target as Node) &&
          headerRef.current && 
          !headerRef.current.contains(event.target as Node) // Garante que o clique não foi no próprio botão do header
         ) {
        closeMobileMenu();
      }
    };
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  // Efeito para mudança de estilo do header com scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30); // Ativa mudança após 30px de scroll
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Verifica no load inicial
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.15, ease: "easeIn" } }
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full pt-4"> {/* Adicionado pt-4 para dar espaço acima do header "flutuante" */}
      <div 
        className={cn(
          "container mx-auto flex items-center justify-between rounded-2xl border border-ghibli-sand/30 backdrop-blur-md shadow-lg transition-all duration-300 ease-in-out",
          "px-4 md:px-8", // Padding lateral: px-4 para mobile, md:px-8 para desktop
          isScrolled 
            ? "bg-ghibli-paper/95 py-1 shadow-xl backdrop-blur-lg" // Estilo quando scrolled
            : "bg-ghibli-paper/80 py-2" // Estilo quando no topo
        )}
      >
        {/* Logo com Link */}
        <div className="flex items-center">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center group transition-all duration-300 ease-in-out hover:sepia" // Efeito sepia no hover do logo
            aria-label="Página Inicial"
          >
            <div className={cn(
                "relative h-10 w-32 transition-all duration-300 ease-in-out", // Tamanho base do logo
                isScrolled ? "h-8 w-28" : "h-10 w-32 md:h-12 md:w-36" // Logo menor quando scrolled
            )}>
              <Image
                src="/pictuzlogooficial.png" // Confirma o caminho do teu logo
                alt="PicTuz Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </Link>
        </div>
  
        {/* Navegação Desktop (visível em md e acima) */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={cn(
                "text-ghibli-wood hover:text-ghibli-moss transition-colors pb-1",
                // Lógica para link ativo se router.pathname corresponder (para rotas, não hashes)
                router.pathname === link.href 
                  ? "font-semibold text-ghibli-moss after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-ghibli-moss" 
                  : ""
              )}
              aria-current={router.pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          {/* PicCoinBalance and UserMenu para Desktop */}
          <div className="flex items-center gap-3 ml-2 lg:ml-4">
            {/* Wrapper para PicCoinBalance com min-width */}
            {/* TODO: Implementar animação de "flash" no PicCoinBalance quando o saldo mudar (dentro do componente PicCoinBalance.tsx) */}
            <div className="min-w-[65px] text-center"> {/* Ajusta min-width conforme necessário para 2-3 dígitos */}
              <PicCoinBalance />
            </div>
            {/* TODO: Adicionar animações de abertura/fecho ao UserMenu (dentro do componente UserMenu.tsx) */}
            <UserMenu />
          </div>
        </nav>
  
        {/* Botões para Mobile (Login + Menu Hambúrguer - visível abaixo de md) */}
        <div className="md:hidden flex items-center space-x-2">
          {/* Wrapper para PicCoinBalance com min-width */}
           {/* TODO: Implementar animação de "flash" no PicCoinBalance quando o saldo mudar (dentro do componente PicCoinBalance.tsx) */}
          <div className="min-w-[60px] text-center"> {/* Ajusta min-width */}
            <PicCoinBalance />
          </div>
          {/* TODO: Adicionar animações de abertura/fecho ao UserMenu (dentro do componente UserMenu.tsx) */}
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            className="text-ghibli-wood hover:text-ghibli-moss hover:bg-ghibli-cream"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
  
      {/* Menu Mobile (Dropdown Animado) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            className="md:hidden absolute top-full left-0 right-0 bg-ghibli-paper/95 backdrop-blur-md p-4 border-b border-t border-ghibli-sand/30 z-40 shadow-xl" // Adicionado shadow-xl e border-t
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <nav className="flex flex-col space-y-3 py-2"> {/* Ajustado space-y e py */}
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className={cn(
                    "text-ghibli-wood hover:text-ghibli-moss transition-colors px-4 py-2.5 rounded-md hover:bg-ghibli-cream/50 block text-base", // Aumentado py e text-base
                     router.pathname === link.href ? "bg-ghibli-cream text-ghibli-moss font-semibold" : ""
                  )}
                  onClick={closeMobileMenu}
                  aria-current={router.pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;