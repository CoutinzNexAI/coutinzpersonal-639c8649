// src/components/Footer.tsx
import React from 'react';
import { Instagram } from 'lucide-react'; // Importa ícones
import { motion } from 'framer-motion'; // Para animações subtis
import Link from 'next/link'; // Importa o componente Link do Next.js
import Image from 'next/image'; // Importa o componente Image do Next.js

// Componente personalizado para ícone do TikTok
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.04-.1z"/>
  </svg>
);

// Componente personalizado para ícone do Facebook
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const Footer = () => {
  const year = new Date().getFullYear();

  // Itens de navegação do rodapé - REMOVIDO "Sobre", mantendo só 3 na mesma linha
  const footerLinks = [
    { name: 'Transformações AI', href: '/transformacoes' },
    { name: 'Loja', href: '/shop' },
    { name: 'Comunidade', href: '/community' },
    { name: 'Política de Privacidade', href: '/politica-privacidade' },
    { name: 'Termos de Serviço', href: '/termos-servicos' },
    { name: 'Suporte', href: 'mailto:pictuzinfo@gmail.com' }
  ];

  // Ícones de redes sociais - ATUALIZADOS Facebook e TikTok
  const socialLinks = [
    { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61576738782189", icon: FacebookIcon },
    { name: "TikTok", href: "https://www.tiktok.com/@pictuz__", icon: TikTokIcon },
    { name: "Instagram", href: "https://www.instagram.com/pictuz_", icon: Instagram },
  ];

  return (
    <footer className="py-12 border-t border-ghibli-sand/30 bg-ghibli-paper/50"> {/* Fundo subtil */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">

          {/* Nome/Logo */}
          <div className="mb-6">
             {/* Link na Logo para a página inicial */}
             <Link href="/" legacyBehavior>
              <a className="inline-block hover:opacity-80 transition-opacity"> {/* Ajuste o estilo do link conforme necessário */}
                <Image
                  src="/pictuzlogooficial.png" // Caminho a partir da pasta 'public'
                  alt="PicTuz Logo"
                  width={100}  // Defina a largura desejada para o seu logo
                  height={30} // Defina a altura desejada para o seu logo
                  style={{ objectFit: "contain" }}
                />
              </a>
            </Link>
          </div>

          {/* Links do rodapé - atualizados */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-8" aria-label="Footer navigation">
            {footerLinks.map((link) => (
              // Verifica se é um link de email para abrir adequadamente
              link.href.startsWith('mailto:') ? (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className="text-sm text-ghibli-earth hover:text-ghibli-moss transition-colors"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  {link.name}
                </motion.a>
              ) : (
                // Para links internos usa o componente Link do Next.js
                <Link key={link.name} href={link.href} legacyBehavior passHref>
                  <motion.a
                    className={`text-sm transition-colors ${
                      link.name === 'Transformações AI' 
                        ? 'text-ghibli-moss hover:text-ghibli-wood font-semibold' // Destaque para Transformações AI
                        : link.name === 'Política de Privacidade' 
                        ? 'text-ghibli-moss hover:text-ghibli-wood font-medium' // Destaque para Google OAuth
                        : 'text-ghibli-earth hover:text-ghibli-moss'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    {link.name}
                  </motion.a>
                </Link>
              )
            ))}
          </nav>

          {/* Ícones Sociais */}
          <div className="flex justify-center gap-6 mb-8">
            {socialLinks.map((social) => (
              <motion.a
                key={social.name}
                href={social.href}
                target="_blank" // Abrir links sociais em nova aba
                rel="noopener noreferrer" // Boas práticas de segurança
                aria-label={social.name}
                className="text-ghibli-earth hover:text-ghibli-moss transition-colors"
                whileHover={{ scale: 1.1, rotate: 5 }} // Efeito de escala e rotação
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <social.icon className="h-5 w-5" />
              </motion.a>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-xs text-ghibli-earth">
            &copy; {year} PicTuz. Todos os direitos reservados. {/* Nome Atualizado */}
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;