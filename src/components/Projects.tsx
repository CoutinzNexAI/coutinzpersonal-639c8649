
import React from 'react';
import { Star, Rocket, Brain, PlayCircle, ExternalLink, Code, Cpu, Palette } from 'lucide-react';
import { Button } from './ui/button';

type Project = {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  link: string;
  gradient: string;
  status?: 'live' | 'in-progress';
  featured?: boolean;
  stats?: {
    users?: string;
    performance?: string;
  };
  techStack?: string[];
};

const projects: Project[] = [
  {
    id: 1,
    title: "PicTuz",
    description: "🚀 My breakthrough AI project! A revolutionary platform that transforms ordinary photos into stunning artistic masterpieces. Built from scratch with cutting-edge ML models, featuring real-time neural network inference, custom training pipelines, and an intuitive user experience that democratizes AI art creation. Integrated with Pritify API that allow users to buy mugs, cnava, posters etc all from our website! ",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000",
    tags: ["Stable Diffusion", "Neural Networks", "Computer Vision", "FastAPI", "React"],
    link: "https://pictuz.com",
    gradient: "from-purple-500/30 to-pink-500/30",
    status: 'live',
    featured: true,
    stats: {
      users: "100+",
      performance: "< 30s"
    },
    techStack: ["Python", "PyTorch", "OpenAI", "Printify", "React", "Cursor", "Supabase"]
  },
];

const Projects = () => {
  const featuredProject = projects.find(p => p.featured);

  return (
    <section id="projects" className="section-padding relative overflow-hidden">
      {/* Enhanced background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cosmic-black via-cosmic-darkblue/50 to-cosmic-black"></div>
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Hero Project Section - PICTUZ.COM */}
        {featuredProject && (
          <div className="mb-16">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Star className="text-yellow-400 animate-pulse" size={24} />
                <h2 className="text-3xl md:text-5xl font-bold cosmic-gradient-text">
                  Featured Project
                </h2>
                <Rocket className="text-cosmic-purple animate-bounce" size={24} />
              </div>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                My flagship AI creation that's transforming digital art
              </p>
            </div>

            {/* Compact Project Showcase */}
            <div className="relative max-w-5xl mx-auto">
              <div 
                className="project-showcase relative overflow-hidden rounded-2xl glass-panel border border-white/20 shadow-xl hover:shadow-purple-500/20 transition-all duration-500 transform hover:scale-[1.01]"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(217, 70, 239, 0.08))',
                }}
              >
                {/* Compact Hero Image */}
                <div className="relative h-64 md:h-80 overflow-hidden">
                  <img 
                    src={featuredProject.image}
                    alt={featuredProject.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cosmic-black/80 via-transparent to-transparent" />
                  
                  {/* Compact Live Badge */}
                  <div className="absolute top-4 right-4 bg-green-500/90 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    🚀 LIVE
                  </div>

                  {/* Compact Stats */}
                  <div className="absolute top-4 left-4 space-y-2">
                    <div className="stats-animate bg-black/60 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/20" style={{ animationDelay: '0.2s' }}>
                      <div className="text-cosmic-blue text-xs font-medium">Users</div>
                      <div className="text-white text-lg font-bold">{featuredProject.stats?.users}</div>
                    </div>
                    <div className="stats-animate bg-black/60 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/20" style={{ animationDelay: '0.4s' }}>
                      <div className="text-cosmic-purple text-xs font-medium">Performance</div>
                      <div className="text-white text-lg font-bold">{featuredProject.stats?.performance}</div>
                    </div>
                  </div>

                  {/* Center Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>

                {/* Compact Details */}
                <div className="p-6 md:p-8">
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left - Main Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold mb-2 cosmic-gradient-text">
                          {featuredProject.title}
                        </h3>
                        <div className="mb-3 flex items-center gap-2">
                          <div className="h-0.5 w-8 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-full"></div>
                          <span className="text-sm font-medium text-cosmic-blue">AI Art Revolution</span>
                          <div className="h-0.5 w-8 bg-gradient-to-r from-cosmic-pink to-cosmic-purple rounded-full"></div>
                        </div>
                        <p className="text-gray-300 leading-relaxed text-sm">
                          Revolutionary AI platform using Stable Diffusion to transform photos into artistic masterpieces. Built with custom neural networks and real-time inference.
                        </p>
                      </div>

                      {/* Compact Features */}
                      <div className="space-y-3">
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Brain className="text-cosmic-purple" size={16} />
                          Key Features
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2 text-gray-300">
                            <div className="w-1.5 h-1.5 bg-cosmic-blue rounded-full"></div>
                            <span>Sub-3s inference</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <div className="w-1.5 h-1.5 bg-cosmic-purple rounded-full"></div>
                            <span>94% accuracy</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <div className="w-1.5 h-1.5 bg-cosmic-pink rounded-full"></div>
                            <span>10K+ users</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                            <span>Cloud scalable</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button 
                          asChild
                          className="bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:from-cosmic-pink hover:to-cosmic-purple transition-all duration-300 text-white font-semibold px-6 py-2.5"
                        >
                          <a href={featuredProject.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            <ExternalLink size={16} />
                            Visit Pictuz.com
                          </a>
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10 px-6 py-2.5"
                        >
                          <Code size={16} className="mr-2" />
                          Tech Details
                        </Button>
                      </div>
                    </div>

                    {/* Right - Tech Stack */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                          <Cpu className="text-cosmic-blue" size={16} />
                          Tech Stack
                        </h4>
                        
                        {/* Compact Tech Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          {featuredProject.techStack?.slice(0, 6).map((tech, index) => (
                            <div 
                              key={index}
                              className="tech-badge bg-gradient-to-r from-white/10 to-white/5 rounded-lg p-2 border border-white/20 text-center hover:scale-105 transition-transform duration-300"
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <span className="text-white text-xs font-medium">{tech}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Compact Tags */}
                      <div>
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                          <Palette className="text-cosmic-pink" size={16} />
                          AI Tech
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {featuredProject.tags.slice(0, 4).map((tag, index) => (
                            <span 
                              key={index}
                              className="bg-gradient-to-r from-cosmic-purple/30 to-cosmic-pink/30 text-pink-200 border border-pink-400/50 px-2 py-1 rounded-md text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Achievement Badge */}
                      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="text-yellow-400" size={16} />
                          <span className="text-yellow-300 font-semibold text-sm">First Major Deploy</span>
                        </div>
                        <p className="text-gray-300 text-xs">
                          🏆 Successfully deployed AI platform with real users
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Future Projects Coming Soon */}
        <div className="text-center mt-12">
          <div className="max-w-2xl mx-auto">
            <h4 className="text-2xl font-bold text-white mb-4">More AI Projects Coming Soon</h4>
            <p className="text-gray-300 mb-8 text-lg">I'm constantly working on new AI innovations. Stay tuned for more exciting projects!</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
