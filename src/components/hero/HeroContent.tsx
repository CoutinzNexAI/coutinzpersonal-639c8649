
import GlowingButton from '../GlowingButton';
import { Sparkles, Zap } from 'lucide-react';
import TypewriterText from './TypewriterText';

interface HeroContentProps {
  isLoaded: boolean;
  typedText: string;
  fullText: string;
}

const HeroContent = ({ isLoaded, typedText, fullText }: HeroContentProps) => {
  return (
    <div className="flex-1 max-w-2xl text-center lg:text-left">
      <div 
        className={`glass-panel p-6 md:p-8 lg:p-12 transition-all duration-1000 backdrop-blur-xl border-2 border-white/20 shadow-2xl ${
          isLoaded 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-24 scale-95"
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          boxShadow: '0 25px 45px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
        }}
      >
        <div className="relative mb-6 md:mb-8 inline-block">
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold relative z-10 tracking-tight">
            <span className="cosmic-gradient-text drop-shadow-lg">Hi, I'm Diogo Coutinho!</span>
            <Sparkles className="inline-block ml-2 text-yellow-400 animate-pulse" size={20} />
          </h1>
          <div className="absolute -inset-2 bg-gradient-to-r from-cosmic-purple via-cosmic-blue to-cosmic-pink opacity-60 blur-2xl rounded-xl -z-10 animate-pulse"></div>
        </div>
        
        <TypewriterText 
          text={fullText}
          isLoaded={isLoaded}
        />
        
        <p 
          className={`text-base md:text-lg lg:text-xl text-gray-300 mb-8 md:mb-12 leading-relaxed transition-all duration-1000 px-2 ${
            isLoaded && typedText === fullText 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-8"
          }`}
        >
          I create innovative digital experiences and transform ideas into reality through cutting-edge technology and design
        </p>
        
        <div 
          className={`flex flex-col sm:flex-row gap-4 md:gap-6 justify-center lg:justify-start transition-all duration-700 ${
            isLoaded && typedText === fullText 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-12"
          }`}
        >
          <GlowingButton href="#projects" className="transform hover:scale-110 transition-all duration-300 text-sm md:text-base">
            <Sparkles className="mr-2" size={16} />
            View My Work
          </GlowingButton>
          <GlowingButton href="#experience" variant="outline" className="transform hover:scale-110 transition-all duration-300 text-sm md:text-base">
            <Zap className="mr-2" size={16} />
            My Experience
          </GlowingButton>
        </div>
      </div>
    </div>
  );
};

export default HeroContent;
