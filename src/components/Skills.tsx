
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; 
import { Code, Brain, Database, Cloud, Package, Eye, Sparkles, Zap, Users, Calendar } from 'lucide-react';

type SkillCategory = 'ai-ml' | 'programming' | 'data' | 'tools' | 'planning';

interface Skill {
  name: string;
  description: string;
  category: SkillCategory;
  icon?: string;
}

const skills: Skill[] = [
  // AI/ML Core
  {
    name: 'Python',
    description: 'AI/ML Development',
    category: 'ai-ml',
  },
  {
    name: 'TensorFlow',
    description: 'Deep Learning',
    category: 'ai-ml',
  },
  {
    name: 'PyTorch',
    description: 'Neural Networks',
    category: 'ai-ml',
  },
  {
    name: 'OpenAI API',
    description: 'LLM Integration',
    category: 'ai-ml',
  },
  
  // Data & Analysis
  {
    name: 'Pandas',
    description: 'Data Analysis',
    category: 'data',
  },
  {
    name: 'NumPy',
    description: 'Scientific Computing',
    category: 'data',
  },
  {
    name: 'Jupyter',
    description: 'Data Science',
    category: 'data',
  },
  
  // Programming & Frontend
  {
    name: 'React',
    description: 'Frontend Development',
    category: 'programming',
  },
  {
    name: 'FastAPI',
    description: 'API Development',
    category: 'programming',
  },
  {
    name: 'TypeScript',
    description: 'Type-Safe Code',
    category: 'programming',
  },
  
  // Tools & Infrastructure
  {
    name: 'Supabase',
    description: 'Backend Platform',
    category: 'tools',
  },
  {
    name: 'PostHog',
    description: 'Product Analytics',
    category: 'tools',
  },
  {
    name: 'Docker',
    description: 'Containerization',
    category: 'tools',
  },
  {
    name: 'Git',
    description: 'Version Control',
    category: 'tools',
  },
  
  // Planning & Management
  {
    name: 'Project Planning',
    description: '100% Efficient',
    category: 'planning',
  },
  {
    name: 'Agile',
    description: 'Methodology',
    category: 'planning',
  },
];

const categoryColors: Record<SkillCategory, string> = {
  'ai-ml': 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
  'programming': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
  'data': 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
  'tools': 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-400',
  'planning': 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400',
};

const categoryTitles: Record<SkillCategory, string> = {
  'ai-ml': 'AI & ML',
  'programming': 'Programming',
  'data': 'Data Science',
  'tools': 'Tools & Infrastructure',
  'planning': 'Planning & Management',
};

const Skills = () => {

  return (
    <section id="skills" className="section-padding relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cosmic-black via-cosmic-black/95 to-cosmic-black"></div>
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-title flex items-center justify-center gap-3">
            <Brain className="text-cosmic-purple animate-pulse" size={48} />
            AI & Tech Stack
            <Sparkles className="text-cosmic-pink animate-pulse" size={32} />
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Cutting-edge technologies for building intelligent systems
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {skills.map((skill, index) => (
            <div
              key={skill.name}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-cosmic-black/50 to-cosmic-darkblue/30 backdrop-blur-sm border border-white/10 p-6 hover:border-cosmic-blue/50 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="relative p-3 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 mr-4 group-hover:scale-110 transition-transform duration-300">
                      <Code className="h-6 w-6 text-blue-300 group-hover:text-white transition-colors duration-300" />
                      <div className="absolute inset-0 bg-blue-500/40 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cosmic-blue group-hover:to-cosmic-purple transition-all duration-300">
                        {skill.name}
                      </h3>
                      <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Badge 
                  variant="outline" 
                  className={`mb-4 border bg-gradient-to-r ${categoryColors[skill.category]} group-hover:scale-105 transition-transform duration-300`}
                >
                  {categoryTitles[skill.category].toUpperCase()}
                </Badge>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="group-hover:text-white transition-colors duration-300">Proficiency</span>
                    <span className="font-bold text-blue-300 group-hover:text-pink-300 transition-colors duration-300">Expert</span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={100} 
                      className="h-3 bg-gray-700/50 group-hover:bg-gray-600/50 transition-colors duration-300" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-cosmic-blue/50 to-cosmic-purple/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Hover background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cosmic-blue/5 to-cosmic-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 border border-cosmic-blue/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>
        
        {/* AI Expertise Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold cosmic-gradient-text mb-4">
              AI Expertise Areas
            </h3>
            <p className="text-lg text-gray-300">
              Specialized domains where I build intelligent solutions
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass-panel p-8 text-center group hover:scale-105 transition-all duration-300">
              <div className="relative p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 w-20 h-20 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-12 h-12 text-cosmic-purple mx-auto" />
                <div className="absolute inset-0 bg-purple-500/40 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">Machine Learning</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Supervised & unsupervised learning, ensemble methods, model optimization and hyperparameter tuning
              </p>
            </div>
            
            <div className="glass-panel p-8 text-center group hover:scale-105 transition-all duration-300">
              <div className="relative p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 w-20 h-20 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-12 h-12 text-cosmic-blue mx-auto" />
                <div className="absolute inset-0 bg-blue-500/40 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">Deep Learning</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                CNNs, RNNs, Transformers, GANs for computer vision, NLP and generative AI applications
              </p>
            </div>
            
            <div className="glass-panel p-8 text-center group hover:scale-105 transition-all duration-300">
              <div className="relative p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 w-20 h-20 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Database className="w-12 h-12 text-cosmic-pink mx-auto" />
                <div className="absolute inset-0 bg-pink-500/40 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">Data Science</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Feature engineering, statistical analysis, data visualization and predictive analytics
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
