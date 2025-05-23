import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion'; // Importa framer-motion
import { Button } from "@/components/ui/button";
import { Menu, X} from "lucide-react";
import UserMenu from "./UserMenu";
import { PicCoinBalance } from './PicCoinBalance'; // Import PicCoin balance
import { cn } from '@/lib/utils'; // Importa cn
import { useRouter } from 'next/router';

// Interface para os links de navegação
interface NavLink {
  href: string;
  label: string;
  id: string; // ID da secção alvo
}

const navLinks: NavLink[] = [
  { href: "#galeria", label: "Galeria", id: "galeria" },
  { href: "#como-funciona", label: "Como Funciona", id: "como-funciona" },
  { href: "#faq", label: "FAQ", id: "faq" },
  { href: "/pricing", label: "Preço", id: "pricing" },
];

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null); // Estado para scrollspy
  const mobileMenuRef = useRef<HTMLDivElement>(null); // Ref para o menu mobile
  const headerRef = useRef<HTMLElement>(null); // Ref para o header
  const router = useRouter();

  // Função para lidar com o clique no logo
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Se já estiver na página inicial, apenas faz um scroll para o topo
    if (router.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Removido router.reload() para evitar refresh desnecessário que poderia causar loops
    } else {
      // Se estiver em outra página, navega para a página inicial
      router.push('/');
    }
  };

  // Fecha menu mobile
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // --- Efeito para fechar menu (clique fora, Escape) ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Fecha se clicar fora do menu E fora do botão de abrir/fechar (para evitar fechar ao abrir)
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && headerRef.current && !headerRef.current.contains(event.target as Node)) {
        closeMobileMenu();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu();
      }
    };

    // Adiciona listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    // Limpa listeners ao desmontar ou quando o menu fecha
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [mobileMenuOpen, closeMobileMenu]); // Depende do estado do menu

  // --- Efeito para Scrollspy ---
  useEffect(() => {
    const handleScroll = () => {
      let currentSection: string | null = null;
      const headerHeight = headerRef.current?.offsetHeight || 60; // Altura do header para offset
      const scrollPosition = window.scrollY + headerHeight + 50; // Posição com offset

      navLinks.forEach(link => {
        const element = document.getElementById(link.id);
        if (element && element.offsetTop <= scrollPosition && element.offsetTop + element.offsetHeight > scrollPosition) {
          currentSection = link.id;
        }
      });

      // Se nenhuma secção estiver ativa, mas estivermos perto do topo, desativa
      if (!currentSection && window.scrollY < 200) {
          setActiveSection(null);
      } else if (currentSection) {
          setActiveSection(currentSection);
      }
      // Se estivermos no fim da página, ativa a última secção (opcional)
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
          const lastSection = document.getElementById(navLinks[navLinks.length - 1].id);
          if(lastSection) setActiveSection(navLinks[navLinks.length - 1].id);
      }
    };

    // Adiciona listener de scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Verifica a posição inicial

    // Limpa listener
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Executa apenas uma vez na montagem

  // Variantes para animação do menu mobile
  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.15, ease: "easeIn" } }
  };

  return (
    // Header fixo no topo
    <header ref={headerRef} className="sticky top-0 z-50 w-full pt-4">
      <div className="container mx-auto flex items-center justify-between rounded-2xl border border-ghibli-sand/30 bg-ghibli-paper/80 backdrop-blur-md px-3 py-2 shadow-lg md:px-8"> {/* MODIFICADO: px-4 para mobile (ajusta se necessário, ex: px-2 ou px-3) */}
        {/* Logo com Link */}
        <div className="flex items-center">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center group transition-all duration-300 ease-in-out hover:sepia"
            aria-label="Página Inicial"
          >
            <div className="relative h-12 w-36"> {/* Mantido o tamanho do logo que definimos */}
              <Image
                src="/pictuzlogooficial.png"
                alt="PicTuz Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </Link>
        </div>
  
        {/* Navegação Desktop (visível em md e acima) */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8"> {/* Ajustado space-x para desktop, podes usar valores diferentes para lg se quiseres mais espaço */}
          {navLinks.map((link) => {
            // Check if it's an external route (starts with /)
            const isExternalRoute = link.href.startsWith('/');
            
            if (isExternalRoute) {
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className="text-ghibli-wood hover:text-ghibli-moss transition-colors"
                >
                  {link.label}
                </Link>
              );
            }
            
            return (
              <a
                key={link.id}
                href={link.href}
                className={cn(
                  "text-ghibli-wood hover:text-ghibli-moss transition-colors relative pb-1",
                  activeSection === link.id
                    ? "font-medium after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-ghibli-moss"
                    : ""
                )}
                aria-current={activeSection === link.id ? "page" : undefined}
              >
                {link.label}
              </a>
            );
          })}
          {/* PicCoinBalance and UserMenu para Desktop */}
          <div className="flex items-center gap-3 ml-2 lg:ml-4">
            <PicCoinBalance />
            <UserMenu />
          </div>
        </nav>
  
        {/* Botões para Mobile (Login + Menu Hambúrguer - visível abaixo de md) */}
        <div className="md:hidden flex items-center space-x-2"> {/* Container para agrupar UserMenu e Botão Hambúrguer em mobile */}
          <PicCoinBalance />
          <UserMenu /> {/* UserMenu (Botão Login) visível na barra do header em mobile */}
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
            className="md:hidden absolute top-full left-0 right-0 bg-ghibli-paper/95 backdrop-blur-md p-4 border-b border-ghibli-sand/30 z-40 shadow-lg"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <nav className="flex flex-col space-y-4 py-2">
              {navLinks.map((link) => {
                // Check if it's an external route (starts with /)
                const isExternalRoute = link.href.startsWith('/');
                
                if (isExternalRoute) {
                  return (
                    <Link
                      key={link.id}
                      href={link.href}
                      className="text-ghibli-wood hover:text-ghibli-moss transition-colors px-4 py-2 rounded hover:bg-ghibli-cream/50 block"
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </Link>
                  );
                }
                
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    className="text-ghibli-wood hover:text-ghibli-moss transition-colors px-4 py-2 rounded hover:bg-ghibli-cream/50 block"
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </a>
                );
              })}
              {/* UserMenu FOI REMOVIDO daqui, pois agora está na barra principal do header em mobile */}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;