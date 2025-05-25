
import React, { useEffect, useRef, useState } from 'react';
import GlowingButton from './GlowingButton';
import { ArrowDown, Code, Terminal, Github, Sparkles } from 'lucide-react';

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
    
    const particleCount = Math.min(120, Math.floor(width * height / 12000));
    
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      originalSize: number;
      pulseSpeed: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.originalSize = Math.random() * 3 + 0.5;
        this.size = 0;
        this.speedX = Math.random() * 0.8 - 0.4;
        this.speedY = Math.random() * 0.8 - 0.4;
        this.alpha = 0;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
        
        const colors = ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      update() {
        if (this.size < this.originalSize) {
          this.size += 0.03;
        }
        
        if (this.alpha < 0.8) {
          this.alpha += 0.008;
        }
        
        // Subtle pulsing effect
        this.size = this.originalSize + Math.sin(Date.now() * this.pulseSpeed) * 0.5;
        
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x > width) this.x = 0;
        else if (this.x < 0) this.x = width;
        
        if (this.y > height) this.y = 0;
        else if (this.y < 0) this.y = height;
      }
      
      draw() {
        if (!ctx) return;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
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
            const opacity = 0.15 - distance/120;
            
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 116, 139, ${opacity})`;
            ctx.lineWidth = 0.5;
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
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-60"
      />
      
      {/* Enhanced 3D floating elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-slate-800/20 to-slate-700/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-slate-600/15 to-slate-500/15 rounded-full blur-3xl animate-bounce-slow"></div>
        
        {/* Morphic shapes */}
        <div className="absolute top-1/3 right-1/3 w-32 h-32 bg-slate-700/10 rounded-3xl rotate-45 blur-xl animate-float"></div>
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-slate-600/15 rounded-full blur-lg animate-pulse"></div>
      </div>
      
      {/* Clean floating icons */}
      <div className="absolute top-1/4 left-1/4 animate-float-slow opacity-40">
        <div className="relative group">
          <Code size={36} className="text-slate-400 group-hover:text-slate-300 transition-colors" />
          <div className="absolute inset-0 bg-slate-400/20 rounded-full blur-md scale-150 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
      <div className="absolute bottom-1/3 right-1/4 animate-float-slow opacity-40" style={{animationDelay: '1.5s'}}>
        <div className="relative group">
          <Terminal size={40} className="text-slate-400 group-hover:text-slate-300 transition-colors" />
          <div className="absolute inset-0 bg-slate-400/20 rounded-full blur-md scale-150 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
      <div className="absolute top-2/3 right-1/3 animate-float-slow opacity-40" style={{animationDelay: '2.2s'}}>
        <div className="relative group">
          <Github size={32} className="text-slate-400 group-hover:text-slate-300 transition-colors" />
          <div className="absolute inset-0 bg-slate-400/20 rounded-full blur-md scale-150 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 z-10">
        <div className="flex flex-col items-center justify-center text-center">
          <div 
            className={`relative p-8 md:p-12 max-w-4xl mx-auto transition-all duration-1000 ${
              isLoaded 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-24"
            }`}
          >
            {/* 3D Card with morphic design */}
            <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-slate-900/50 overflow-hidden">
              {/* Subtle animated border */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-1000 animate-pulse"></div>
              
              {/* Content */}
              <div className="relative z-10 p-8 md:p-12">
                <div className="relative mb-8 inline-block">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold relative z-10 bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                    Hi, I'm Diogo Coutinho
                  </h1>
                  <div className="absolute top-2 right-2">
                    <Sparkles className="w-6 h-6 text-slate-400 animate-pulse" />
                  </div>
                </div>
                
                <div className="h-[40px] mb-10 flex items-center justify-center">
                  <p className="text-xl md:text-2xl lg:text-3xl text-slate-300 border-r-2 border-slate-400 animate-blink-caret overflow-hidden whitespace-nowrap font-light">
                    {typedText}
                  </p>
                </div>
                
                <p 
                  className={`text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 ${
                    isLoaded && typedText === fullText 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-8"
                  }`}
                >
                  I create innovative digital experiences and transform ideas into reality through clean, modern design
                </p>
                
                <div 
                  className={`flex flex-col sm:flex-row gap-6 justify-center transition-all duration-700 ${
                    isLoaded && typedText === fullText 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-12"
                  }`}
                >
                  <GlowingButton href="#projects" className="transform hover:scale-105 transition-transform">
                    View My Work
                  </GlowingButton>
                  <GlowingButton href="#experience" variant="outline" className="transform hover:scale-105 transition-transform">
                    My Experience
                  </GlowingButton>
                </div>
              </div>
              
              {/* 3D depth illusion */}
              <div className="absolute inset-0 rounded-3xl shadow-inner shadow-slate-700/30 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className={`absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ${
          isLoaded && typedText === fullText 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="relative">
          <ArrowDown className="h-8 w-8 text-slate-400 animate-bounce" />
          <div className="absolute inset-0 bg-slate-400/20 rounded-full blur-md scale-150 animate-pulse"></div>
        </div>
      </div>
      
      {/* Subtle scan line effect */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-transparent via-slate-500/5 to-transparent w-full h-32 z-20 transition-opacity duration-700 ${
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
