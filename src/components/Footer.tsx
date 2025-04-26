
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-10 text-center border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h3 className="text-xl font-bold cosmic-gradient-text">Let's Connect</h3>
          <p className="text-gray-400 mt-2">Open to new opportunities and collaborations</p>
          
          {/* Social Links */}
          <div className="flex justify-center space-x-6 mt-4">
            {['GitHub', 'LinkedIn', 'Twitter', 'Email'].map(platform => (
              <a 
                key={platform}
                href="#"
                className="text-gray-400 hover:text-cosmic-blue transition-colors duration-300 transform hover:scale-110"
              >
                {platform}
              </a>
            ))}
          </div>
        </div>
        
        <p className="text-sm text-gray-500">
          © {currentYear} Diogo Coutinho — All Rights Reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;
