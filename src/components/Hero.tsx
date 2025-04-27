
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
      initialDelay: number;
      active: boolean;
      
      constructor(index: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 3 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        
        const colors = ['#8B5CF6', '#0EA5E9', '#D946EF'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // Add initial entrance delay based on particle index
        this.initialDelay = index * 20;
        this.active = false;
      }
      
      update() {
        // Don't move until delay is over
        if (this.initialDelay > 0) {
          this.initialDelay--;
          return;
        }
        
        this.active = true;
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x > width) this.x = 0;
        else if (this.x < 0) this.x = width;
        
        if (this.y > height) this.y = 0;
        else if (this.y < 0) this.y = height;
      }
      
      draw() {
        if (!ctx || !this.active) return;
        
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
        arr.push(new Particle(i));
      }
      return arr;
    }
    
    function connectParticles() {
      if (!ctx) return;
      
      for (let i = 0; i < particles.length; i++) {
        if (!particles[i].active) continue;
        
        for (let j = i; j < particles.length; j++) {
          if (!particles[j].active) continue;
          
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
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-30 animate-fade-in"
        style={{ animationDelay: '0.5s' }}
      />
      
      <div className="container mx-auto px-6 z-10">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Hero content with staggered entrance animation */}
          <div 
            className="glass-panel p-8 md:p-12 max-w-3xl mx-auto opacity-0" 
            style={{ animation: 'fade-in 0.8s ease-out 0.2s forwards, slide-up 1s ease-out 0.2s forwards' }}
          >
            <div className="overflow-hidden mb-6">
              <h1 
                className="text-4xl md:text-6xl font-bold transform translate-y-full"
                style={{ animation: 'slide-up 1.2s ease-out 0.5s forwards' }}
              >
                <span className="cosmic-gradient-text inline-block">Hi, I'm Your Name</span>
              </h1>
            </div>
            
            <div className="overflow-hidden">
              <p 
                className="text-xl md:text-2xl mb-8 text-gray-300 transform translate-y-full"
                style={{ animation: 'slide-up 1.2s ease-out 0.8s forwards' }}
              >
                Developer • Designer • Creative Thinker
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p 
                className="text-lg text-gray-400 mb-10 transform translate-y-full"
                style={{ animation: 'slide-up 1.2s ease-out 1.1s forwards' }}
              >
                I create innovative digital experiences and transform ideas into reality
              </p>
            </div>
            
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center opacity-0"
              style={{ animation: 'fade-in 1.2s ease-out 1.4s forwards' }}
            >
              <GlowingButton href="#projects">View My Work</GlowingButton>
              <GlowingButton href="#experience" variant="outline">My Experience</GlowingButton>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center opacity-0"
        style={{ animation: 'fade-in 1s ease-out 2s forwards, float 3s ease-in-out 3s infinite' }}
      >
        <ArrowDown className="h-8 w-8 text-cosmic-blue animate-bounce" />
      </div>
      
      {/* Decorative elements with entrance animations */}
      <div 
        className="absolute top-20 left-20 w-24 h-24 rounded-full bg-cosmic-purple/10 blur-xl -z-10 opacity-0"
        style={{ animation: 'fade-in 2s ease-out 0.5s forwards' }}
      />
      <div 
        className="absolute bottom-40 right-20 w-32 h-32 rounded-full bg-cosmic-blue/10 blur-xl -z-10 opacity-0"
        style={{ animation: 'fade-in 2s ease-out 0.8s forwards' }}
      />
      <div 
        className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-cosmic-pink/5 blur-lg -z-10 opacity-0"
        style={{ animation: 'fade-in 2s ease-out 1.2s forwards' }}
      />
    </section>
  );
};

export default Hero;
