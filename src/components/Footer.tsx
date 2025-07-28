
import React from 'react';
import { Mail, MessageCircle, Linkedin, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="relative bg-gradient-to-br from-cosmic-black via-cosmic-darkblue/50 to-cosmic-black border-t border-white/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Contact Section */}
          <div className="mb-12">
            <h3 className="text-4xl md:text-5xl font-bold cosmic-gradient-text mb-6">
              Let's Connect
            </h3>
            <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto mb-8">
              Ready to build the next generation of AI solutions? Let's discuss your project and bring innovative ideas to life.
            </p>
            
            {/* Location */}
            <div className="flex items-center justify-center gap-2 text-gray-400 mb-8">
              <MapPin className="w-5 h-5 text-cosmic-purple" />
              <span>Portugal</span>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* WhatsApp */}
            <a 
              href="https://wa.me/351965449996"
              target="_blank"
              rel="noopener noreferrer"
              className="group glass-panel p-8 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20"
            >
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-8 h-8 text-green-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">WhatsApp</h4>
                <p className="text-gray-300 mb-4">Quick chat about your project</p>
                <div className="text-green-400 font-semibold">Send Message</div>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </a>

            {/* Email */}
            <a 
              href="mailto:diogolemecoutinho@gmail.com"
              className="group glass-panel p-8 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20"
            >
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cosmic-blue/20 to-cosmic-purple/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-8 h-8 text-cosmic-blue" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Email</h4>
                <p className="text-gray-300 mb-4">Detailed project discussions</p>
                <div className="text-cosmic-blue font-semibold">Send Email</div>
                <div className="absolute inset-0 bg-gradient-to-r from-cosmic-blue/10 to-cosmic-purple/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </a>

            {/* LinkedIn */}
            <a 
              href="https://www.linkedin.com/in/d--coutinho/"
              target="_blank"
              rel="noopener noreferrer"
              className="group glass-panel p-8 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/20"
            >
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Linkedin className="w-8 h-8 text-blue-500" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">LinkedIn</h4>
                <p className="text-gray-300 mb-4">Professional networking</p>
                <div className="text-blue-500 font-semibold">Connect</div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-blue-700/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </a>
          </div>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-gray-400 text-lg mb-4">
              Available for freelance projects and full-time AI opportunities
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">Available for new projects</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="border-t border-white/10 py-6 text-center bg-cosmic-black/50">
        <p className="text-sm text-gray-400">
          © {currentYear} Diogo Coutinho — AI Developer & Machine Learning Engineer
        </p>
      </div>
    </footer>
  );
};

export default Footer;
