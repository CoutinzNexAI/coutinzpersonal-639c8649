import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion'; // Importa framer-motion
import { Button } from "@/components/ui/button";
import { Menu, X} from "lucide-react";
import UserMenu from "./UserMenu";
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
  // { href: "#sobre", label: "Sobre", id: "sobre" }, // Descomentar se a secção existir
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
    <header ref={headerRef} className="sticky top-0 z-50 w-full py-4 border-b border-ghibli-sand/30 bg-ghibli-paper/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
        {/* Logo com Link - Atualizado para usar onClick com o componente Link */}
        <div className="flex items-center">
          <Link 
            href="/" 
            onClick={handleLogoClick}
            className="flex items-center group"
            aria-label="Página Inicial"
          >
            <div className="relative h-14 w-40">
              <Image 
                src="/PicTuzSemBack.png" 
                alt="PicTuz Logo" 
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </Link>
        </div>

        {/* Botão do Menu Mobile */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="text-ghibli-wood hover:text-ghibli-moss hover:bg-ghibli-cream"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen} // Indica se o menu está expandido
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Navegação Desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className={cn(
                "text-ghibli-wood hover:text-ghibli-moss transition-colors relative pb-1", // Adiciona pb-1 para espaço do sublinhado
                // Estilo do link ativo (sublinhado)
                activeSection === link.id
                  ? "font-medium after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-ghibli-moss"
                  : ""
              )}
              aria-current={activeSection === link.id ? "page" : undefined} // Acessibilidade
            >
              {link.label}
            </a>
          ))}
          <UserMenu />
        </nav>
      </div>

      {/* Menu Mobile (Dropdown Animado) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef} // Atribui a ref ao elemento animado
            className="md:hidden absolute top-full left-0 right-0 bg-ghibli-paper/95 backdrop-blur-md p-4 border-b border-ghibli-sand/30 z-40 shadow-lg"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // TODO: Implementar focus trapping aqui se necessário
          >
            <nav className="flex flex-col space-y-4 py-2">
              {navLinks.map((link) => (
                 <a
                  key={link.id}
                  href={link.href}
                  className="text-ghibli-wood hover:text-ghibli-moss transition-colors px-4 py-2 rounded hover:bg-ghibli-cream/50 block" // Usa block para ocupar largura
                  onClick={closeMobileMenu} // Fecha menu ao clicar
                 >
                  {link.label}
                 </a>
              ))}
              {/* UserMenu dentro do menu mobile */}
              <div className="px-4 py-2 border-t border-ghibli-sand/20 mt-2 pt-4">
                <UserMenu />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;