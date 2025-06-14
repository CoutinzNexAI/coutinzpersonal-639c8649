
import React, { useState } from 'react';
import { FileImage, Link, Sparkles, Zap, Eye } from 'lucide-react';
import { Button } from './ui/button';

type Project = {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  link: string;
  gradient: string;
};

const projects: Project[] = [
  {
    id: 1,
    title: "Ghibli Style Image Transformer",
    description: "An AI-powered tool that transforms ordinary photos into Studio Ghibli-inspired artwork. Built with TensorFlow and React for seamless user experience.",
    image: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=1000",
    tags: ["AI", "React", "TensorFlow", "Image Processing"],
    link: "#",
    gradient: "from-blue-500/20 to-purple-500/20"
  },
  {
    id: 2,
    title: "Portfolio Website",
    description: "A futuristic personal website showcasing skills, experience and projects with interactive elements, beautiful animations, and cutting-edge design.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1000",
    tags: ["React", "TypeScript", "Tailwind CSS", "3D"],
    link: "#",
    gradient: "from-cyan-500/20 to-blue-500/20"
  },
  {
    id: 3,
    title: "Smart Home Dashboard",
    description: "A responsive dashboard for controlling and monitoring smart home devices with real-time updates, energy statistics, and beautiful data visualization.",
    image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?q=80&w=1000",
    tags: ["React", "IoT", "WebSockets", "Chart.js"],
    link: "#",
    gradient: "from-green-500/20 to-teal-500/20"
  },
];

const Projects = () => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <section id="projects" className="section-padding relative overflow-hidden">
      {/* Enhanced background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cosmic-black via-cosmic-darkblue/50 to-cosmic-black"></div>
      <div className="absolute top-16 md:top-32 left-8 md:left-32 w-40 md:w-80 h-40 md:h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-16 md:bottom-32 right-8 md:right-32 w-36 md:w-72 h-36 md:h-72 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-8 md:mb-16 cosmic-gradient-text animate-neon-glow flex items-center justify-center gap-2 md:gap-3 flex-wrap">
            <Sparkles className="text-cosmic-purple animate-pulse" size={32} />
            <span className="text-center">Featured Projects</span>
            <Zap className="text-cosmic-blue animate-pulse" size={24} />
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
            Discover my latest creations and digital innovations
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto px-2 md:px-0">
          {projects.map((project, index) => (
            <div 
              key={project.id}
              className="group relative overflow-hidden rounded-xl md:rounded-2xl transition-all duration-500 transform hover:-translate-y-2 md:hover:-translate-y-4 hover:scale-102 md:hover:scale-105"
              style={{ animationDelay: `${index * 0.2}s` }}
              onMouseEnter={() => setHoveredId(project.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Enhanced glass panel */}
              <div 
                className="relative h-full p-0.5 md:p-1 rounded-xl md:rounded-2xl"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: hoveredId === project.id 
                    ? '0 15px 30px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(255,255,255,0.2)' 
                    : '0 8px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)'
                }}
              >
                <div className="relative h-full bg-cosmic-black/40 backdrop-blur-xl rounded-lg md:rounded-xl overflow-hidden">
                  {/* Project image with enhanced effects */}
                  <div className="relative h-48 md:h-56 overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110"
                      style={{ 
                        backgroundImage: `url(${project.image})`,
                        filter: hoveredId === project.id ? 'brightness(1.1) saturate(1.2)' : 'brightness(0.8)'
                      }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${project.gradient} to-transparent opacity-60`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-cosmic-black via-transparent to-transparent" />
                    
                    {/* Hover overlay */}
                    <div className={`absolute inset-0 bg-cosmic-blue/20 transition-opacity duration-300 ${
                      hoveredId === project.id ? 'opacity-100' : 'opacity-0'
                    } flex items-center justify-center`}>
                      <Eye className="text-white text-2xl md:text-4xl animate-pulse" />
                    </div>
                  </div>
                  
                  {/* Project content */}
                  <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                    <h3 className="text-lg md:text-xl font-bold transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cosmic-blue group-hover:to-cosmic-purple line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-gray-300 text-sm md:text-sm leading-relaxed group-hover:text-gray-200 transition-colors duration-300 line-clamp-3">
                      {project.description}
                    </p>
                    
                    {/* Enhanced tags */}
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {project.tags.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="text-xs bg-gradient-to-r from-cosmic-blue/20 to-cosmic-purple/20 text-cosmic-blue px-2 md:px-3 py-1 rounded-full border border-cosmic-blue/30 group-hover:scale-105 transition-transform duration-300 backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Simplified project button */}
                    <Button 
                      asChild
                      className="w-full bg-cosmic-purple hover:bg-cosmic-blue transition-colors duration-300"
                      size="sm"
                    >
                      <a href={project.link} className="flex items-center justify-center gap-2">
                        <Link size={14} />
                        <span>View Project</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Animated border effect */}
              <div className={`absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-cosmic-blue via-cosmic-purple to-cosmic-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-md ${
                hoveredId === project.id ? 'animate-pulse' : ''
              }`}></div>
            </div>
          ))}
        </div>
        
        {/* Fixed call to action */}
        <div className="text-center mt-12 md:mt-16 px-4">
          <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-base">Want to see more of my work?</p>
          <Button 
            asChild
            size="lg"
            className="bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:from-cosmic-pink hover:to-cosmic-purple transition-colors duration-300"
          >
            <a href="#contact" className="flex items-center gap-2">
              <Sparkles size={18} />
              Let's Collaborate
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Projects;
