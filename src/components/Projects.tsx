
import React, { useState } from 'react';
import { FileImage, Link, ExternalLink } from 'lucide-react';
import GlowingButton from './GlowingButton';

type Project = {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  link: string;
};

const projects: Project[] = [
  {
    id: 1,
    title: "Ghibli Style Image Transformer",
    description: "An AI-powered tool that transforms ordinary photos into Studio Ghibli-inspired artwork. Built with TensorFlow and React.",
    image: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=1000",
    tags: ["AI", "React", "TensorFlow", "Image Processing"],
    link: "#"
  },
  {
    id: 2,
    title: "Portfolio Website",
    description: "A futuristic personal website showcasing my skills, experience and projects with interactive elements and beautiful animations.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1000",
    tags: ["React", "TypeScript", "Tailwind CSS"],
    link: "#"
  },
  {
    id: 3,
    title: "Smart Home Dashboard",
    description: "A responsive dashboard for controlling and monitoring smart home devices with real-time updates and energy statistics.",
    image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?q=80&w=1000",
    tags: ["React", "IoT", "WebSockets", "Chart.js"],
    link: "#"
  },
];

const Projects = () => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <section id="projects" className="section-padding bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl shadow-slate-900/50 border border-slate-700/50">
                <FileImage className="w-8 h-8 text-slate-300" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-slate-600/20 blur-md scale-110 animate-pulse"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
              Projects
            </h2>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Innovative solutions and creative implementations that showcase modern development
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map(project => (
            <div 
              key={project.id}
              className="group relative perspective-1000"
              onMouseEnter={() => setHoveredId(project.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* 3D Project Card */}
              <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-800/70 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/40 transition-all duration-700 transform group-hover:scale-105 group-hover:rotate-y-5 group-hover:shadow-xl group-hover:shadow-slate-900/60">
                
                {/* Enhanced image container */}
                <div className="relative h-56 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                    style={{ 
                      backgroundImage: `url(${project.image})`,
                      transform: hoveredId === project.id ? 'scale(1.1) rotate(2deg)' : 'scale(1)'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                  
                  {/* Floating elements */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110">
                    <div className="p-2 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700/50">
                      <ExternalLink className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                  
                  {/* Animated overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                
                {/* Content section */}
                <div className="relative p-6 z-10">
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-slate-100 transition-colors duration-300">
                    {project.title}
                  </h3>
                  <p className="text-slate-400 mb-6 line-clamp-3 group-hover:text-slate-300 transition-colors">
                    {project.description}
                  </p>
                  
                  {/* Enhanced tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="text-xs bg-slate-700/50 text-slate-300 px-3 py-1.5 rounded-full border border-slate-600/50 transition-all duration-300 hover:bg-slate-600/50 hover:scale-105"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Enhanced CTA button */}
                  <div className="transform transition-all duration-300 group-hover:translate-y-0 translate-y-2">
                    <GlowingButton 
                      href={project.link} 
                      className="w-full flex items-center justify-center gap-2 hover:scale-105 transition-transform duration-300"
                    >
                      <Link size={16} />
                      <span>View Project</span>
                    </GlowingButton>
                  </div>
                </div>
                
                {/* 3D depth effects */}
                <div className="absolute inset-0 rounded-3xl shadow-inner shadow-slate-700/20 pointer-events-none"></div>
                
                {/* Animated border effect */}
                <div className="absolute inset-0 rounded-3xl border border-slate-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              
              {/* Floating decorative elements */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-slate-600/50 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-slate-500/50 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
