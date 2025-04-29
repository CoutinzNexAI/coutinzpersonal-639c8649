import React, { useEffect, useRef, useState } from 'react';
import GlowingButton from './GlowingButton';
import { ArrowDown, Code, Terminal, Github } from 'lucide-react';

const Hero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [typedText, setTypedText] = useState('');
  const fullText = "Developer • Designer • Creative Thinker";
  
  // Efeito de digitação
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
  
  // Animação de entrada principal
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
    
    // Melhorando a configuração das partículas
    const particleCount = Math.min(150, Math.floor(width * height / 10000));
    
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      originalSize: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.originalSize = Math.random() * 4 + 0.5;
        this.size = 0; // Começa invisível para animação
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.alpha = 0; // Começa transparente
        
        const colors = ['#8B5CF6', '#0EA5E9', '#D946EF', '#4F46E5', '#06B6D4'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      update() {
        // Animação de entrada - aparecer gradualmente
        if (this.size < this.originalSize) {
          this.size += 0.05;
        }
        
        if (this.alpha < 1) {
          this.alpha += 0.01;
        }
        
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Limites da tela
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
          
          if (distance < 150) {
            const opacity = 0.6 - distance/150;
            
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
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
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-40"
      />
      
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Ícones Flutuantes */}
      <div className="absolute top-1/4 left-1/4 animate-float-slow opacity-20">
        <Code size={40} className="text-cosmic-purple" />
      </div>
      <div className="absolute bottom-1/3 right-1/4 animate-float-slow opacity-20" style={{animationDelay: '1.5s'}}>
        <Terminal size={48} className="text-cosmic-blue" />
      </div>
      <div className="absolute top-2/3 right-1/3 animate-float-slow opacity-20" style={{animationDelay: '2.2s'}}>
        <Github size={36} className="text-cosmic-pink" />
      </div>
      
      <div className="container mx-auto px-6 z-10">
        <div className="flex flex-col items-center justify-center text-center">
          <div 
            className={`glass-panel p-8 md:p-12 max-w-3xl mx-auto transition-all duration-1000 backdrop-blur-md ${
              isLoaded 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-24"
            }`}
          >
            <div className="relative mb-6 inline-block">
              <h1 className="text-4xl md:text-6xl font-bold relative z-10">
                <span className="cosmic-gradient-text">Hi, I'm Diogo Coutinho !</span>
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-cosmic-purple via-cosmic-blue to-cosmic-pink opacity-50 blur rounded-lg -z-10"></div>
            </div>
            
            <div className="h-[32px] mb-8 flex items-center justify-center">
              <p className="text-xl md:text-2xl text-gray-300 border-r-2 border-cosmic-blue animate-blink-caret overflow-hidden whitespace-nowrap">
                {typedText}
              </p>
            </div>
            
            <p 
              className={`text-lg text-gray-400 mb-10 transition-all duration-1000 ${
                isLoaded && typedText === fullText 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-8"
              }`}
            >
              I create innovative digital experiences and transform ideas into reality
            </p>
            
            <div 
              className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 ${
                isLoaded && typedText === fullText 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-12"
              }`}
            >
              <GlowingButton href="#projects">View My Work</GlowingButton>
              <GlowingButton href="#experience" variant="outline">My Experience</GlowingButton>
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
        <ArrowDown className="h-8 w-8 text-cosmic-blue animate-bounce" />
      </div>
      
      {/* Scanner line effect */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-transparent via-cosmic-blue/10 to-transparent w-full h-20 z-20 transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0" 
        }`}
        style={{
          animation: 'scan-line 4s linear infinite',
          animationDelay: '2s'
        }}
      ></div>
    </section>
  );
};

export default Hero;
