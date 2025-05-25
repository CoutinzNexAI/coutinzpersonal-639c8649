
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; 
import { Code, Layout, Terminal, Database, PenTool, Lightbulb } from 'lucide-react';

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
  frontend: 'bg-cosmic-blue/20 text-cosmic-blue',
  backend: 'bg-cosmic-purple/20 text-cosmic-purple',
  design: 'bg-cosmic-pink/20 text-cosmic-pink',
  other: 'bg-cosmic-orange/20 text-cosmic-orange',
};

const Skills = () => {
  return (
    <section id="skills" className="section-padding">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">My Skills</h2>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill, index) => (
              <div 
                key={skill.name}
                className="glass-panel p-6 hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-cosmic-blue/10 mr-4">
                    <skill.icon className="h-5 w-5 text-cosmic-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{skill.name}</h3>
                    <Badge 
                      className={`mt-1 ${categoryColors[skill.category]}`}
                    >
                      {skill.category}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Proficiency</span>
                    <span>{skill.level}%</span>
                  </div>
                  <Progress value={skill.level} className="h-2" />
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
