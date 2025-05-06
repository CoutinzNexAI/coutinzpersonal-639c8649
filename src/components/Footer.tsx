import React from 'react';
import { Github, Twitter, Instagram, Leaf } from 'lucide-react'; // Importa ícones
import { motion } from 'framer-motion'; // Para animações subtis

const Footer = () => {
  const year = new Date().getFullYear();

  // Itens de navegação do rodapé
  const footerLinks = [
    { name: "Termos de Serviço", href: "#" },
    { name: "Política de Privacidade", href: "#" },
    { name: "Sobre", href: "#" },
    { name: "Contato", href: "#" },
  ];

  // Ícones de redes sociais (placeholder)
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
            <span className="text-2xl font-ghibli font-bold text-ghibli-wood flex items-center gap-2">
              <Leaf className="h-6 w-6 text-ghibli-moss inline-block" /> {/* Ícone de folha */}
              Estúdio Criativo AI
            </span>
          </div>

          {/* Links de Navegação */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-8" aria-label="Footer navigation">
            {footerLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.href}
                className="text-sm text-ghibli-earth hover:text-ghibli-moss transition-colors"
                whileHover={{ scale: 1.05 }} // Efeito de escala no hover
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                {link.name}
              </motion.a>
            ))}
          </nav>

          {/* Ícones Sociais */}
          <div className="flex justify-center gap-6 mb-8">
            {socialLinks.map((social) => (
              <motion.a
                key={social.name}
                href={social.href}
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
            &copy; {year} Estúdio Criativo AI. Todos os direitos reservados.
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;