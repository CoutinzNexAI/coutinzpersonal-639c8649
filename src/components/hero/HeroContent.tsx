
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
    <div className="flex-1 max-w-3xl text-center lg:text-left">
      <div 
        className={`glass-panel p-8 md:p-10 lg:p-16 transition-all duration-700 backdrop-blur-xl border-2 border-white/20 shadow-2xl ${
          isLoaded 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-24 scale-95"
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          boxShadow: '0 25px 45px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
        }}
      >
        <div className="relative mb-8 md:mb-10 inline-block">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold relative z-10 tracking-tight">
            <span className="cosmic-gradient-text drop-shadow-lg">Building the Future with</span>
            <br />
            <span className="cosmic-gradient-text drop-shadow-lg">Artificial Intelligence</span>
            <Sparkles className="inline-block ml-2 text-yellow-400 animate-pulse" size={24} />
          </h1>
          <div className="absolute -inset-2 bg-gradient-to-r from-cosmic-purple via-cosmic-blue to-cosmic-pink opacity-60 blur-2xl rounded-xl -z-10 animate-pulse"></div>
        </div>
        
        <TypewriterText 
          text={fullText}
          isLoaded={isLoaded}
        />
        
        <p 
          className={`text-lg md:text-xl lg:text-2xl text-gray-300 mb-10 md:mb-14 leading-relaxed transition-all duration-500 px-2 ${
            isLoaded && typedText === fullText 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-8"
          }`}
        >
          Passionate about Machine Learning, Deep Learning, and transforming data into intelligent solutions. I build AI systems that solve real-world problems.
        </p>
        
        <div 
          className={`flex flex-col sm:flex-row gap-6 md:gap-8 justify-center lg:justify-start transition-all duration-500 ${
            isLoaded && typedText === fullText 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-12"
          }`}
        >
          <GlowingButton href="#projects" className="transform hover:scale-110 transition-all duration-300 text-base md:text-lg px-8 py-4">
            <Sparkles className="mr-2" size={20} />
            View AI Projects
          </GlowingButton>
          <GlowingButton href="#experience" variant="outline" className="transform hover:scale-110 transition-all duration-300 text-base md:text-lg px-8 py-4">
            <Zap className="mr-2" size={20} />
            My Experience
          </GlowingButton>
        </div>
      </div>
    </div>
  );
};

export default HeroContent;
