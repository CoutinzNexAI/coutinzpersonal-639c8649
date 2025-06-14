
import { Code, Terminal, Github, Zap, Cpu } from 'lucide-react';

const FloatingIcons = () => {
  return (
    <>
      {/* Floating tech icons - Hidden on mobile for performance */}
      <div className="hidden md:block absolute top-1/4 left-1/4 animate-float-slow opacity-30 hover:opacity-60 transition-opacity duration-300">
        <div className="relative">
          <Code size={40} className="text-cosmic-purple drop-shadow-lg" />
          <div className="absolute inset-0 bg-cosmic-purple/20 rounded-full blur-xl animate-pulse"></div>
        </div>
      </div>
      <div className="hidden md:block absolute bottom-1/3 right-1/4 animate-float-slow opacity-30 hover:opacity-60 transition-opacity duration-300" style={{animationDelay: '1.5s'}}>
        <div className="relative">
          <Terminal size={48} className="text-cosmic-blue drop-shadow-lg" />
          <div className="absolute inset-0 bg-cosmic-blue/20 rounded-full blur-xl animate-pulse"></div>
        </div>
      </div>
      <div className="hidden md:block absolute top-2/3 right-1/3 animate-float-slow opacity-30 hover:opacity-60 transition-opacity duration-300" style={{animationDelay: '2.2s'}}>
        <div className="relative">
          <Github size={36} className="text-cosmic-pink drop-shadow-lg" />
          <div className="absolute inset-0 bg-cosmic-pink/20 rounded-full blur-xl animate-pulse"></div>
        </div>
      </div>
      <div className="hidden md:block absolute top-1/2 left-1/6 animate-float-slow opacity-30 hover:opacity-60 transition-opacity duration-300" style={{animationDelay: '3s'}}>
        <div className="relative">
          <Zap size={42} className="text-yellow-400 drop-shadow-lg" />
          <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
        </div>
      </div>
      <div className="hidden md:block absolute bottom-1/4 right-1/6 animate-float-slow opacity-30 hover:opacity-60 transition-opacity duration-300" style={{animationDelay: '4s'}}>
        <div className="relative">
          <Cpu size={38} className="text-green-400 drop-shadow-lg" />
          <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
        </div>
      </div>
    </>
  );
};

export default FloatingIcons;
