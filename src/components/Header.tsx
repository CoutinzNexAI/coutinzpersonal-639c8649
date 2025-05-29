import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import UserMenu from "./UserMenu";
import { PicCoinBalance } from './PicCoinBalance';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';

// Interface para os links de navegação
interface NavLink {
  href: string;
  label: string;
  id: string;
}

// Simplified navigation - community and pricing links
const navLinks: NavLink[] = [
  { href: "/community", label: "Comunidade", id: "community" },
  { href: "/pricing", label: "Preço", id: "pricing" },
];

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const router = useRouter();

  // Handle logo click
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (router.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/');
    }
  };

  // Close mobile menu
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on click outside or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && headerRef.current && !headerRef.current.contains(event.target as Node)) {
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

  // Mobile menu animation variants
  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0.0, 0.2, 1],
        staggerChildren: 0.1
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: { 
        duration: 0.2, 
        ease: [0.4, 0.0, 1, 1] 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.header 
      ref={headerRef} 
      className="fixed top-0 z-50 w-full"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
    >
      {/* Floating header container */}
      <div className="container mx-auto px-6 py-4 md:px-8">
        <motion.div 
          className={cn(
            "relative flex items-center justify-between rounded-2xl border transition-all duration-500",
            "bg-ghibli-paper/80 backdrop-blur-xl shadow-2xl",
            scrolled 
              ? "border-ghibli-sand/40 bg-ghibli-paper/90 shadow-ghibli-wood/10" 
              : "border-ghibli-sand/30 bg-ghibli-paper/80 shadow-ghibli-wood/5",
            // Floating 3D effect with ghibli colors
            "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-ghibli-moss/5 before:via-ghibli-sand/5 before:to-ghibli-cream/5 before:-z-10",
            "after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-b after:from-ghibli-cream/20 after:to-transparent after:-z-10"
          )}
          whileHover={{ 
            y: -2,
            transition: { duration: 0.2 }
          }}
          style={{
            background: "linear-gradient(135deg, rgba(250, 248, 240, 0.9) 0%, rgba(250, 248, 240, 0.8) 100%)",
            boxShadow: scrolled 
              ? "0 20px 40px -12px rgba(139, 116, 88, 0.15), 0 0 0 1px rgba(212, 190, 152, 0.3), inset 0 1px 0 rgba(250, 248, 240, 0.4)"
              : "0 8px 32px -8px rgba(139, 116, 88, 0.1), 0 0 0 1px rgba(212, 190, 152, 0.2), inset 0 1px 0 rgba(250, 248, 240, 0.3)"
          }}
        >
          {/* Logo section */}
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
          <Link
            href="/"
            onClick={handleLogoClick}
              className="flex items-center group transition-all duration-300"
            aria-label="Página Inicial"
          >
              <div className="relative h-12 w-36">
              <Image
                src="/pictuzlogooficial.png"
                alt="PicTuz Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
                  className="transition-all duration-300 group-hover:brightness-110"
              />
            </div>
          </Link>
          </motion.div>
  
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link, index) => (
              <motion.div
              key={link.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
              >
                <Link
              href={link.href}
              className={cn(
                    "relative px-4 py-2 text-sm font-medium transition-all duration-300",
                    "text-ghibli-wood hover:text-ghibli-moss",
                    "before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-ghibli-moss/10 before:to-ghibli-cream/10 before:opacity-0 before:transition-opacity before:duration-300",
                    "hover:before:opacity-100",
                    "after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-ghibli-moss after:to-ghibli-wood after:transition-all after:duration-300 after:-translate-x-1/2",
                    "hover:after:w-full"
                  )}
            >
                  <span className="relative z-10">{link.label}</span>
                </Link>
              </motion.div>
          ))}
            
            {/* Desktop user controls */}
            <motion.div 
              className="flex items-center gap-4 ml-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <PicCoinBalance />
              <UserMenu />
            </motion.div>
          </nav>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center space-x-3">
            <PicCoinBalance />
            <UserMenu />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
          <Button
            variant="ghost"
            size="icon"
                className={cn(
                  "relative h-10 w-10 rounded-xl transition-all duration-300",
                  "bg-ghibli-cream/20 hover:bg-ghibli-cream/40 border border-ghibli-sand/30 hover:border-ghibli-sand/50",
                  "text-ghibli-wood hover:text-ghibli-moss",
                  "backdrop-blur-sm shadow-sm hover:shadow-md"
                )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
          >
                <motion.div
                  animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.div>
          </Button>
            </motion.div>
        </div>
        </motion.div>
      </div>
  
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            className="md:hidden absolute top-full left-0 right-0 z-40"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="container mx-auto px-6">
              <motion.div 
                className={cn(
                  "mt-2 rounded-2xl border border-ghibli-sand/30 p-6",
                  "bg-ghibli-paper/90 backdrop-blur-xl shadow-2xl"
                )}
                style={{
                  background: "linear-gradient(135deg, rgba(250, 248, 240, 0.95) 0%, rgba(250, 248, 240, 0.9) 100%)",
                  boxShadow: "0 20px 40px -12px rgba(139, 116, 88, 0.2), 0 0 0 1px rgba(212, 190, 152, 0.3), inset 0 1px 0 rgba(250, 248, 240, 0.5)"
                }}
              >
                <nav className="flex flex-col space-y-3">
                  {navLinks.map((link, index) => (
                    <motion.div
                  key={link.id}
                      variants={itemVariants}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                  href={link.href}
                        className={cn(
                          "block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                          "text-ghibli-wood hover:text-ghibli-moss",
                          "bg-ghibli-cream/20 hover:bg-ghibli-cream/40 border border-transparent hover:border-ghibli-sand/30"
                        )}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                      </Link>
                    </motion.div>
              ))}
            </nav>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;