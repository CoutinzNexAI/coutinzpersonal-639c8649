
import React, { useState } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Layers, FileImage, Database, Server, Cloud, Timer } from 'lucide-react';

type Skill = {
  name: string;
  level: number; // 1-5
  category: 'frontend' | 'backend' | 'design' | 'devops';
  description: string;
};

const skills: Skill[] = [
  { name: 'React', level: 5, category: 'frontend', description: 'Building complex, interactive UIs with React and its ecosystem.' },
  { name: 'TypeScript', level: 4, category: 'frontend', description: 'Type-safe JavaScript development with advanced TypeScript features.' },
  { name: 'CSS/Tailwind', level: 5, category: 'frontend', description: 'Creating responsive, accessible, and beautiful designs.' },
  { name: 'Node.js', level: 4, category: 'backend', description: 'Server-side JavaScript programming with Express and other frameworks.' },
  { name: 'Python', level: 3, category: 'backend', description: 'Data processing, automation, and backend development.' },
  { name: 'SQL', level: 4, category: 'backend', description: 'Database design, optimization, and complex queries.' },
  { name: 'UI/UX Design', level: 4, category: 'design', description: 'Figma prototyping and user-centered design principles.' },
  { name: 'Graphic Design', level: 3, category: 'design', description: 'Creating visual assets for web and print.' },
  { name: 'Docker', level: 3, category: 'devops', description: 'Containerization and deployment of applications.' },
  { name: 'CI/CD', level: 3, category: 'devops', description: 'Automated testing and deployment workflows.' },
];

const SkillLevel = ({ level }: { level: number }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className={`w-2 h-6 rounded ${i <= level ? 'bg-cosmic-blue' : 'bg-gray-700'}`}
        />
      ))}
    </div>
  );
};

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'frontend':
      return <Code className="text-cosmic-blue" />;
    case 'backend':
      return <Database className="text-cosmic-purple" />;
    case 'design':
      return <FileImage className="text-cosmic-pink" />;
    case 'devops':
      return <Server className="text-cosmic-orange" />;
    default:
      return <Layers />;
  }
};

const SkillsShowcase = () => {
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  return (
    <section id="skills" className="section-padding bg-cosmic-black/40">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Skills & Expertise</h2>
        
        <Tabs defaultValue="frontend" className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-cosmic-black/50">
              <TabsTrigger value="frontend" className="flex items-center gap-2">
                <Code size={16} />
                <span>Frontend</span>
              </TabsTrigger>
              <TabsTrigger value="backend" className="flex items-center gap-2">
                <Database size={16} />
                <span>Backend</span>
              </TabsTrigger>
              <TabsTrigger value="design" className="flex items-center gap-2">
                <FileImage size={16} />
                <span>Design</span>
              </TabsTrigger>
              <TabsTrigger value="devops" className="flex items-center gap-2">
                <Server size={16} />
                <span>DevOps</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {['frontend', 'backend', 'design', 'devops'].map((category) => (
            <TabsContent 
              key={category} 
              value={category}
              className="animate-fade-in"
            >
              <div className="grid gap-4">
                {skills
                  .filter((skill) => skill.category === category)
                  .map((skill) => (
                    <Collapsible 
                      key={skill.name}
                      open={expandedSkill === skill.name}
                      onOpenChange={() => setExpandedSkill(expandedSkill === skill.name ? null : skill.name)}
                      className="glass-panel p-4 transition-all duration-300 hover:shadow-md hover:shadow-cosmic-blue/20"
                    >
                      <CollapsibleTrigger className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={skill.category} />
                          <h3 className="text-lg font-medium">{skill.name}</h3>
                        </div>
                        <SkillLevel level={skill.level} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4 text-gray-400 pl-9">
                        {skill.description}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-12 glass-panel p-6 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Timer className="text-cosmic-purple" />
            <span>Learning Timeline</span>
          </h3>
          
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cosmic-purple to-cosmic-blue"></div>
            
            <div className="space-y-8 pl-6">
              {[
                { year: '2023', event: 'Mastered Advanced TypeScript & Cloud Architecture' },
                { year: '2022', event: 'Developed Expertise in React Ecosystem & DevOps' },
                { year: '2020', event: 'Focused on Backend Technologies & Databases' },
                { year: '2018', event: 'Started Learning Web Development Fundamentals' },
              ].map((item, index) => (
                <div key={index} className="relative animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                  <div className="absolute -left-[26px] w-6 h-6 rounded-full border-2 border-cosmic-blue bg-cosmic-black flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-cosmic-blue"></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-cosmic-blue">{item.year}</h4>
                    <p className="text-gray-400">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsShowcase;
