// src/components/Footer.tsx
import React from 'react';
import { Github, Twitter, Instagram } from 'lucide-react'; // Importa ícones
import { motion } from 'framer-motion'; // Para animações subtis
import Link from 'next/link'; // Importa o componente Link do Next.js
import Image from 'next/image'; // Importa o componente Image do Next.js

const Footer = () => {
  const year = new Date().getFullYear();

  // Itens de navegação do rodapé - hrefs ATUALIZADOS
  const footerLinks = [
    { name: "Termos de Serviço", href: "/termos-servicos" },
    { name: "Política de Privacidade", href: "/politica-privacidade" }, // <-- HREF ATUALIZADO
    { name: "Sobre", href: "#" }, // Mantém # ou define o link correto (ex: /sobre)
    { name: "Contato", href: "#" }, // Mantém # ou define o link correto (ex: /contato)
  ];

  // Ícones de redes sociais (placeholder) - Adiciona os teus links reais
  const socialLinks = [
    { name: "GitHub", href: "#", icon: Github },
    { name: "Twitter", href: "#", icon: Twitter },
    { name: "Instagram", href: "#", icon: Instagram },
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

          {/* Links de Navegação */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-8" aria-label="Footer navigation">
            {footerLinks.map((link) => (
              // Envolve cada link com o componente Link do Next.js
              <Link key={link.name} href={link.href} legacyBehavior passHref>
                <motion.a
                  // href é herdado de passHref
                  className="text-sm text-ghibli-earth hover:text-ghibli-moss transition-colors"
                  whileHover={{ scale: 1.05 }} // Efeito de escala no hover
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  {link.name}
                </motion.a>
              </Link>
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