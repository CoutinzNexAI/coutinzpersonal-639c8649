
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; 
import { Code, Layout, Terminal, Database, PenTool, Lightbulb, Zap } from 'lucide-react';

type Skill = {
  name: string;
  level: number;
  category: 'frontend' | 'backend' | 'design' | 'other';
  icon: React.ElementType;
};

const skills: Skill[] = [
  { name: 'React', level: 95, category: 'frontend', icon: Code },
  { name: 'TypeScript', level: 90, category: 'frontend', icon: Code },
  { name: 'CSS/Tailwind', level: 85, category: 'frontend', icon: Layout },
  { name: 'Node.js', level: 80, category: 'backend', icon: Terminal },
  { name: 'PostgreSQL', level: 75, category: 'backend', icon: Database },
  { name: 'UI/UX Design', level: 85, category: 'design', icon: PenTool },
  { name: 'Problem Solving', level: 95, category: 'other', icon: Lightbulb },
];

const categoryColors = {
  frontend: 'bg-slate-700/30 text-slate-300 border-slate-600',
  backend: 'bg-slate-600/30 text-slate-200 border-slate-500',
  design: 'bg-slate-800/30 text-slate-300 border-slate-700',
  other: 'bg-slate-500/30 text-slate-200 border-slate-400',
};

const Skills = () => {
  return (
    <section id="skills" className="section-padding bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl shadow-slate-900/50 border border-slate-700/50">
                <Zap className="w-8 h-8 text-slate-300" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-slate-600/20 blur-md scale-110 animate-pulse"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
              My Skills
            </h2>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Crafting digital experiences with modern technologies and creative solutions
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {skills.map((skill, index) => (
              <div 
                key={skill.name}
                className="group relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* 3D Card Effect */}
                <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-slate-900/30 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-slate-900/40 hover:border-slate-600/70 transform perspective-1000">
                  
                  {/* Floating icon with 3D effect */}
                  <div className="relative mb-6">
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <skill.icon className="h-6 w-6 text-slate-300 group-hover:text-white transition-colors" />
                        </div>
                        <div className="absolute inset-0 bg-slate-600/20 rounded-xl blur-md scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      <Badge 
                        className={`${categoryColors[skill.category]} border transition-all duration-300 group-hover:scale-105`}
                      >
                        {skill.category}
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mt-4 group-hover:text-slate-100 transition-colors">
                      {skill.name}
                    </h3>
                  </div>
                  
                  {/* Enhanced progress section */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Proficiency</span>
                      <span className="text-slate-300 font-semibold">{skill.level}%</span>
                    </div>
                    
                    {/* Custom animated progress bar */}
                    <div className="relative h-3 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400 rounded-full transition-all duration-1000 ease-out shadow-lg"
                        style={{ 
                          width: `${skill.level}%`,
                          animation: 'slideIn 1.5s ease-out',
                          animationDelay: `${index * 0.2}s`,
                          animationFillMode: 'both'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* 3D depth effect */}
                  <div className="absolute inset-0 rounded-2xl shadow-inner shadow-slate-700/20 pointer-events-none"></div>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-slate-600/0 via-slate-500/5 to-slate-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
