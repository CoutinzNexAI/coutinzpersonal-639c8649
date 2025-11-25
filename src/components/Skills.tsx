
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
        <div className="text-center">
          <h2 className="section-title flex items-center justify-center gap-3">
            <Brain className="text-cosmic-purple animate-pulse" size={48} />
            Skills Section Removed
            <Sparkles className="text-cosmic-pink animate-pulse" size={32} />
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Content has been removed as requested
          </p>
        </div>
      </div>
    </section>
  );
};

export default Skills;
