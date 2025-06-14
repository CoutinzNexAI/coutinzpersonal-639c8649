import React, { useEffect, useRef, useState } from 'react';
import GlowingButton from './GlowingButton';
import { ArrowDown, Code, Terminal, Github, Sparkles, Zap, Cpu } from 'lucide-react';

const Hero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [typedText, setTypedText] = useState('');
  const fullText = "Developer • Designer • Creative Thinker";
  
  // Typing effect
  useEffect(() => {
    if (!isLoaded) return;
    
    let index = 0;
    const timer = setInterval(() => {
      setTypedText(fullText.substring(0, index));
      index++;
      
      if (index > fullText.length) {
        clearInterval(timer);
      }
    }, 80);
    
    return () => clearInterval(timer);
  }, [isLoaded]);
  
  // Main entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Enhanced particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      particles = createParticles();
    };
    
    window.addEventListener('resize', handleResize);
    canvas.width = width;
    canvas.height = height;
    
    const particleCount = Math.min(200, Math.floor(width * height / 8000));
    
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      originalSize: number;
      pulse: number;
      pulsDirection: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.originalSize = Math.random() * 3 + 1;
        this.size = 0;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.alpha = 0;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulsDirection = Math.random() * 0.02 + 0.01;
        
        const colors = ['#8B5CF6', '#0EA5E9', '#D946EF', '#4F46E5', '#06B6D4', '#F59E0B', '#10B981'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      update() {
        if (this.size < this.originalSize) {
          this.size += 0.05;
        }
        
        if (this.alpha < 0.8) {
          this.alpha += 0.01;
        }
        
        this.pulse += this.pulsDirection;
        const pulseFactor = Math.sin(this.pulse) * 0.5 + 0.5;
        
        this.x += this.speedX * (1 + pulseFactor * 0.5);
        this.y += this.speedY * (1 + pulseFactor * 0.5);
        
        if (this.x > width) this.x = 0;
        else if (this.x < 0) this.x = width;
        
        if (this.y > height) this.y = 0;
        else if (this.y < 0) this.y = height;
      }
      
      draw() {
        if (!ctx) return;
        const pulseFactor = Math.sin(this.pulse) * 0.3 + 0.7;
        const currentSize = this.size * pulseFactor;
        
        // Glow effect
        ctx.globalAlpha = this.alpha * 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Main particle
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
      }
    }
    
    let particles = createParticles();
    
    function createParticles() {
      const arr = [];
      for (let i = 0; i < particleCount; i++) {
        arr.push(new Particle());
      }
      return arr;
    }
    
    function connectParticles() {
      if (!ctx) return;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            const opacity = 0.4 - distance/120;
            
            // Create gradient line
            const gradient = ctx.createLinearGradient(
              particles[i].x, particles[i].y,
              particles[j].x, particles[j].y
            );
            gradient.addColorStop(0, `rgba(139, 92, 246, ${opacity})`);
            gradient.addColorStop(1, `rgba(14, 165, 233, ${opacity})`);
            
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }
    
    function animate() {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      
      connectParticles();
      requestAnimationFrame(animate);
    }
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-60"
      />
      
      {/* Enhanced background effects - Mobile responsive */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
        <div className="absolute top-5 md:top-10 left-5 md:left-10 w-32 md:w-60 h-32 md:h-60 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 md:bottom-20 right-10 md:right-20 w-40 md:w-80 h-40 md:h-80 bg-gradient-to-br from-blue-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-24 md:w-48 h-24 md:h-48 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/3 left-1/4 w-28 md:w-52 h-28 md:h-52 bg-gradient-to-br from-cyan-500/20 to-green-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      
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
      
      <div className="container mx-auto px-4 md:px-6 z-10">
        <div className="flex flex-col items-center justify-center text-center">
          <div 
            className={`glass-panel p-6 md:p-8 lg:p-12 max-w-4xl mx-auto transition-all duration-1000 backdrop-blur-xl border-2 border-white/20 shadow-2xl ${
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
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold relative z-10 tracking-tight">
                <span className="cosmic-gradient-text drop-shadow-lg">Hi, I'm Diogo Coutinho!</span>
                <Sparkles className="inline-block ml-2 text-yellow-400 animate-pulse" size={20} />
              </h1>
              <div className="absolute -inset-2 bg-gradient-to-r from-cosmic-purple via-cosmic-blue to-cosmic-pink opacity-60 blur-2xl rounded-xl -z-10 animate-pulse"></div>
            </div>
            
            <div className="h-[30px] md:h-[40px] mb-8 md:mb-10 flex items-center justify-center">
              <p className="text-base md:text-xl lg:text-3xl text-gray-200 border-r-2 border-cosmic-blue animate-blink-caret overflow-hidden whitespace-nowrap font-medium tracking-wide text-center">
                {typedText}
              </p>
            </div>
            
            <p 
              className={`text-base md:text-lg lg:text-xl text-gray-300 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 px-2 ${
                isLoaded && typedText === fullText 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-8"
              }`}
            >
              I create innovative digital experiences and transform ideas into reality through cutting-edge technology and design
            </p>
            
            <div 
              className={`flex flex-col sm:flex-row gap-4 md:gap-6 justify-center transition-all duration-700 ${
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
      </div>
      
      <div 
        className={`absolute bottom-5 md:bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ${
          isLoaded && typedText === fullText 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="relative">
          <ArrowDown className="h-8 md:h-10 w-8 md:w-10 text-cosmic-blue animate-bounce drop-shadow-lg" />
          <div className="absolute inset-0 bg-cosmic-blue/30 rounded-full blur-lg animate-pulse"></div>
        </div>
        <span className="text-xs md:text-sm text-gray-400 mt-2 animate-pulse">Scroll to explore</span>
      </div>
      
      {/* Enhanced scanner line effect */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-transparent via-cosmic-blue/20 to-transparent w-full h-32 z-20 transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0" 
        }`}
        style={{
          animation: 'scan-line 6s linear infinite',
          animationDelay: '2s'
        }}
      ></div>
    </section>
  );
};

export default Hero;
