
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; 
import { Code, Layout, Terminal, Database, PenTool, Lightbulb, Sparkles, Zap } from 'lucide-react';

type Skill = {
  name: string;
  level: number;
  category: 'frontend' | 'backend' | 'design' | 'other';
  icon: React.ElementType;
  description: string;
};

const skills: Skill[] = [
  { name: 'React', level: 95, category: 'frontend', icon: Code, description: 'Building dynamic UIs' },
  { name: 'TypeScript', level: 90, category: 'frontend', icon: Code, description: 'Type-safe development' },
  { name: 'CSS/Tailwind', level: 85, category: 'frontend', icon: Layout, description: 'Modern styling' },
  { name: 'Node.js', level: 80, category: 'backend', icon: Terminal, description: 'Server-side magic' },
  { name: 'PostgreSQL', level: 75, category: 'backend', icon: Database, description: 'Data management' },
  { name: 'UI/UX Design', level: 85, category: 'design', icon: PenTool, description: 'User experience' },
  { name: 'Problem Solving', level: 95, category: 'other', icon: Lightbulb, description: 'Creative solutions' },
];

const categoryColors = {
  frontend: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30',
  backend: 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-violet-300 border-violet-500/30',
  design: 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-rose-300 border-rose-500/30',
  other: 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

const Skills = () => {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  return (
    <section id="skills" className="section-padding relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cosmic-black via-cosmic-black/95 to-cosmic-black"></div>
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-title flex items-center justify-center gap-3">
            <Zap className="text-cosmic-blue animate-pulse" size={48} />
            My Skills
            <Sparkles className="text-cosmic-pink animate-pulse" size={32} />
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Crafting digital experiences with cutting-edge technologies
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {skills.map((skill, index) => (
              <div 
                key={skill.name}
                className={`group relative glass-panel p-6 transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer ${
                  hoveredSkill === skill.name ? 'shadow-2xl shadow-cosmic-blue/30' : ''
                }`}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onMouseEnter={() => setHoveredSkill(skill.name)}
                onMouseLeave={() => setHoveredSkill(null)}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-cosmic-blue/20 to-cosmic-purple/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="relative p-3 rounded-xl bg-gradient-to-br from-cosmic-blue/20 to-cosmic-purple/20 mr-4 group-hover:scale-110 transition-transform duration-300">
                      <skill.icon className="h-6 w-6 text-cosmic-blue group-hover:text-white transition-colors duration-300" />
                      <div className="absolute inset-0 bg-cosmic-blue/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold group-hover:text-white transition-colors duration-300">{skill.name}</h3>
                      <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{skill.description}</p>
                    </div>
                  </div>
                  
                  <Badge 
                    className={`mb-4 border ${categoryColors[skill.category]} group-hover:scale-105 transition-transform duration-300`}
                  >
                    {skill.category}
                  </Badge>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="group-hover:text-white transition-colors duration-300">Proficiency</span>
                      <span className="font-bold text-cosmic-blue group-hover:text-cosmic-pink transition-colors duration-300">{skill.level}%</span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={skill.level} 
                        className="h-3 bg-gray-700/50 group-hover:bg-gray-600/50 transition-colors duration-300" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-cosmic-blue to-cosmic-purple rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
