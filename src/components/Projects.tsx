
import React, { useState } from 'react';
import { FileImage, Link } from 'lucide-react';
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
    <section id="projects" className="section-padding">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Projects</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map(project => (
            <div 
              key={project.id}
              className="glass-panel overflow-hidden rounded-xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg hover:shadow-cosmic-blue/20"
              onMouseEnter={() => setHoveredId(project.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Project image */}
              <div className="relative h-48 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
                  style={{ 
                    backgroundImage: `url(${project.image})`,
                    transform: hoveredId === project.id ? 'scale(1.05)' : 'scale(1)'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cosmic-black to-transparent" />
              </div>
              
              {/* Project info */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 transition-colors duration-300 hover:text-cosmic-blue">
                  {project.title}
                </h3>
                <p className="text-gray-400 mb-4">{project.description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-cosmic-blue/20 text-cosmic-blue px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Project link */}
                <GlowingButton 
                  href={project.link} 
                  className="w-full flex items-center justify-center gap-2 hover:scale-105 transition-transform duration-300"
                >
                  <Link size={16} />
                  <span>View Project</span>
                </GlowingButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
