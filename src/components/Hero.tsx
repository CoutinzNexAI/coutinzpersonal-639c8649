
import React, { useEffect, useRef } from 'react';
import GlowingButton from './GlowingButton';
import { ArrowDown } from 'lucide-react';

const Hero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
    
    // Particle properties
    const particleCount = 100;
    
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 3 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        
        const colors = ['#8B5CF6', '#0EA5E9', '#D946EF'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x > width) this.x = 0;
        else if (this.x < 0) this.x = width;
        
        if (this.y > height) this.y = 0;
        else if (this.y < 0) this.y = height;
      }
      
      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
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
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.6 - distance/150})`;
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
    <section id="hero" className="relative min-h-screen flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-30"
      />
      
      <div className="container mx-auto px-6 z-10">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="glass-panel p-8 md:p-12 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              <span className="cosmic-gradient-text">Hi, I'm Your Name</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-gray-300 animate-fade-in" style={{animationDelay: '0.2s'}}>
              Developer • Designer • Creative Thinker
            </p>
            
            <p className="text-lg text-gray-400 mb-10 animate-fade-in" style={{animationDelay: '0.3s'}}>
              I create innovative digital experiences and transform ideas into reality
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: '0.4s'}}>
              <GlowingButton href="#projects">View My Work</GlowingButton>
              <GlowingButton href="#experience" variant="outline">My Experience</GlowingButton>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-float">
        <ArrowDown className="h-8 w-8 text-cosmic-blue animate-bounce" />
      </div>
    </section>
  );
};

export default Hero;
