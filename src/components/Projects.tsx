
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { 
  Star, 
  Rocket, 
  Brain, 
  PlayCircle, 
  ExternalLink, 
  Code, 
  Cpu, 
  Palette, 
  Instagram,
  ChevronDown,
  Zap,
  Users,
  TrendingUp,
  Award,
  Globe,
  Database,
  Smartphone,
  ShoppingCart,
  BarChart3,
  Target,
  CheckCircle,
  ArrowRight,
  Play,
  Pause,
  X,
  Sparkles,
  Activity,
  Layers
} from 'lucide-react';
import { Button } from './ui/button';

type ProjectStory = {
  id: string;
  title: string;
  subtitle: string;
  problem: {
    title: string;
    description: string;
    painPoints: string[];
    image?: string;
  };
  solution: {
    title: string;
    description: string;
    features: string[];
    approach: string;
  };
  demo: {
    type: 'video' | 'interactive' | 'gallery';
    content: string;
    highlights: string[];
  };
  techStack: {
    title: string;
    technologies: { name: string; category: string; icon: string }[];
  };
  results: {
    metrics: { label: string; value: string; icon: any }[];
    impact: string;
    status: 'live' | 'in-progress' | 'completed';
  };
  gradient: string;
  accentColor: string;
};

const projectStories: ProjectStory[] = [
  {
    id: 'pictuz',
    title: 'PicTuz',
    subtitle: 'AI-Powered Art Creation Platform',
    problem: {
      title: 'The Problem',
      description: 'People want to create stunning art from their photos, but traditional photo editing is complex and AI art tools are disconnected from e-commerce.',
      painPoints: [
        'Complex photo editing software requires expertise',
        'AI art tools produce art but no way to monetize',
        'No seamless integration between creation and commerce',
        'Limited artistic styles and customization options'
      ],
      image: '/maiaantes.jpg'
    },
    solution: {
      title: 'The Solution',
      description: 'A revolutionary platform that transforms ordinary photos into artistic masterpieces with AI, then lets users buy physical products instantly.',
      features: [
        '20+ AI art styles (Studio Ghibli, LEGO, Greek God, etc.)',
        'Real-time neural network inference (<30s processing)',
        'Integrated e-commerce with Printify API',
        'User dashboard for managing creations and orders'
      ],
      approach: 'Built from scratch using cutting-edge ML models with custom training pipelines and intuitive UX design.'
    },
    demo: {
      type: 'video',
      content: '/videopictuz.mp4',
      highlights: [
        'Upload any photo instantly',
        'AI transforms to stunning art',
        'Order on mugs, canvas, posters',
        'Track orders in real-time'
      ]
    },
    techStack: {
      title: 'Technology Stack',
      technologies: [
        { name: 'OpenAI DALL-E', category: 'AI/ML', icon: '🧠' },
        { name: 'Next.js 15', category: 'Frontend', icon: '⚛️' },
        { name: 'Supabase', category: 'Database', icon: '💾' },
        { name: 'Stripe', category: 'Payments', icon: '💳' },
        { name: 'Printify API', category: 'E-commerce', icon: '🛍️' },
        { name: 'PostHog', category: 'Analytics', icon: '📊' }
      ]
    },
    results: {
      metrics: [
        { label: 'Active Users', value: '100+', icon: Users },
        { label: 'Processing Time', value: '<30s', icon: Zap },
        { label: 'Art Styles', value: '20+', icon: Palette },
        { label: 'Status', value: 'LIVE', icon: Globe }
      ],
      impact: 'Successfully democratized AI art creation with seamless e-commerce integration. Users can now transform their memories into physical art products in under a minute.',
      status: 'live'
    },
    gradient: 'from-purple-600 via-pink-600 to-red-600',
    accentColor: 'purple'
  },
  {
    id: 'ecotrack',
    title: 'EcoTrack',
    subtitle: 'Environmental Impact Analytics',
    problem: {
      title: 'The Problem',
      description: 'Companies struggle to measure and reduce their environmental footprint due to complex data collection and lack of actionable insights.',
      painPoints: [
        'Manual carbon footprint calculations are time-consuming',
        'No real-time tracking of environmental metrics',
        'Difficult to identify improvement opportunities',
        'Compliance reporting is complex and error-prone'
      ]
    },
    solution: {
      title: 'The Solution',
      description: 'An intelligent platform that automatically tracks, analyzes, and optimizes environmental impact with AI-powered recommendations.',
      features: [
        'Automated data collection from IoT sensors',
        'Real-time carbon footprint calculations',
        'AI-powered optimization recommendations',
        'Automated compliance reporting and certifications'
      ],
      approach: 'Leveraged IoT integration, machine learning algorithms, and regulatory compliance frameworks to create a comprehensive solution.'
    },
    demo: {
      type: 'interactive',
      content: 'dashboard-preview',
      highlights: [
        'Real-time environmental metrics',
        'Predictive impact modeling',
        'Automated report generation',
        'Cost-saving recommendations'
      ]
    },
    techStack: {
      title: 'Technology Stack',
      technologies: [
        { name: 'Python/FastAPI', category: 'Backend', icon: '🐍' },
        { name: 'React/TypeScript', category: 'Frontend', icon: '⚛️' },
        { name: 'PostgreSQL', category: 'Database', icon: '🐘' },
        { name: 'TensorFlow', category: 'AI/ML', icon: '🤖' },
        { name: 'IoT Sensors', category: 'Hardware', icon: '📡' },
        { name: 'AWS', category: 'Cloud', icon: '☁️' }
      ]
    },
    results: {
      metrics: [
        { label: 'CO2 Reduced', value: '25%', icon: TrendingUp },
        { label: 'Cost Savings', value: '€50k', icon: Target },
        { label: 'Compliance', value: '100%', icon: CheckCircle },
        { label: 'Status', value: 'BETA', icon: Rocket }
      ],
      impact: 'Helped companies reduce carbon emissions by 25% on average while saving €50k annually through optimized resource usage and automated compliance.',
      status: 'in-progress'
    },
    gradient: 'from-green-600 via-emerald-600 to-teal-600',
    accentColor: 'green'
  },
  {
    id: 'smartlearn',
    title: 'SmartLearn',
    subtitle: 'Adaptive Learning Platform',
    problem: {
      title: 'The Problem',
      description: 'Traditional education platforms use one-size-fits-all approaches, leading to poor learning outcomes and high dropout rates.',
      painPoints: [
        'Students learn at different paces and styles',
        'No personalized learning paths',
        'Difficult to track progress and identify gaps',
        'Limited engagement and motivation tools'
      ]
    },
    solution: {
      title: 'The Solution',
      description: 'An AI-driven adaptive learning platform that personalizes education content and pace based on individual learning patterns.',
      features: [
        'AI-powered personalized learning paths',
        'Real-time difficulty adjustment',
        'Gamification and progress tracking',
        'Multi-modal content (video, text, interactive)'
      ],
      approach: 'Used machine learning to analyze learning patterns, combined with gamification psychology and adaptive content delivery systems.'
    },
    demo: {
      type: 'gallery',
      content: 'learning-interface',
      highlights: [
        'Personalized study plans',
        'Interactive learning modules',
        'Progress analytics dashboard',
        'Achievement and reward system'
      ]
    },
    techStack: {
      title: 'Technology Stack',
      technologies: [
        { name: 'Node.js', category: 'Backend', icon: '🟢' },
        { name: 'Vue.js', category: 'Frontend', icon: '💚' },
        { name: 'MongoDB', category: 'Database', icon: '🍃' },
        { name: 'Python/ML', category: 'AI/ML', icon: '🐍' },
        { name: 'WebRTC', category: 'Real-time', icon: '📹' },
        { name: 'Docker', category: 'DevOps', icon: '🐳' }
      ]
    },
    results: {
      metrics: [
        { label: 'Completion Rate', value: '85%', icon: Award },
        { label: 'Learning Speed', value: '+40%', icon: Zap },
        { label: 'User Satisfaction', value: '4.8/5', icon: Star },
        { label: 'Status', value: 'PILOT', icon: Brain }
      ],
      impact: 'Increased course completion rates by 85% and learning speed by 40% through personalized AI-driven education paths.',
      status: 'completed'
    },
    gradient: 'from-blue-600 via-indigo-600 to-purple-600',
    accentColor: 'blue'
  }
];

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const chapters = ['problem', 'solution', 'demo', 'tech', 'results'];
  const selectedStory = projectStories.find(p => p.id === selectedProject);

  // Auto-advance chapters quando projeto está aberto
  useEffect(() => {
    if (!isAutoPlay || !selectedProject) return;
    
    const timer = setInterval(() => {
      setCurrentChapter(prev => {
        if (prev < chapters.length - 1) {
          return prev + 1;
        } else {
          setIsAutoPlay(false);
          return prev;
        }
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlay, selectedProject, chapters.length]);

  const openProject = (projectId: string) => {
    setSelectedProject(projectId);
    setCurrentChapter(0);
    setIsAutoPlay(true);
  };

  const closeProject = () => {
    setSelectedProject(null);
    setCurrentChapter(0);
    setIsAutoPlay(false);
  };

  const renderChapter = () => {
    if (!selectedStory) return null;
    const chapter = chapters[currentChapter];
    
    switch (chapter) {
      case 'problem':
        return (
          <motion.div
            key="problem"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full flex flex-col items-center justify-center px-6 md:px-12"
          >
            {/* Glitch effect title */}
            <motion.div 
              className="mb-12 relative"
              initial={{ y: -50 }}
              animate={{ y: 0 }}
            >
              <h3 className="text-5xl md:text-7xl font-black text-red-500 mb-4 relative">
                <span className="absolute inset-0 text-red-400 blur-sm opacity-50">
                  {selectedStory.problem.title}
                </span>
                <span className="relative z-10">{selectedStory.problem.title}</span>
              </h3>
              <motion.div 
                className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3 }}
              />
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl md:text-3xl text-gray-200 leading-relaxed mb-12 max-w-4xl text-center font-light"
            >
              {selectedStory.problem.description}
            </motion.p>
            
            {/* Pain points com design futurista */}
            <div className="grid md:grid-cols-2 gap-4 w-full max-w-5xl">
              {selectedStory.problem.painPoints.map((point, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -100 : 100, rotateY: 90 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ delay: 0.6 + idx * 0.15, type: "spring" }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative bg-black/40 border border-red-500/30 rounded-xl p-6 backdrop-blur-sm hover:border-red-500/60 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-gray-200 text-lg leading-relaxed">{point}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
        
      case 'solution':
        return (
          <motion.div
            key="solution"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full flex flex-col items-center justify-center px-6 md:px-12"
          >
            <motion.div 
              className="mb-12 relative"
              initial={{ y: -50 }}
              animate={{ y: 0 }}
            >
              <h3 className="text-5xl md:text-7xl font-black text-green-400 mb-4 relative">
                <span className="absolute inset-0 text-green-500 blur-sm opacity-50">
                  {selectedStory.solution.title}
                </span>
                <span className="relative z-10">{selectedStory.solution.title}</span>
              </h3>
              <motion.div 
                className="h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3 }}
              />
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl md:text-3xl text-gray-200 leading-relaxed mb-6 max-w-4xl text-center font-light"
            >
              {selectedStory.solution.description}
            </motion.p>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-gray-400 italic mb-12 max-w-3xl text-center"
            >
              {selectedStory.solution.approach}
            </motion.p>
            
            <div className="grid md:grid-cols-2 gap-6 w-full max-w-5xl">
              {selectedStory.solution.features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.6 + idx * 0.15, type: "spring", stiffness: 100 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative bg-black/40 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/60 transition-all h-full">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                      <p className="text-gray-200 text-lg leading-relaxed">{feature}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
        
      case 'demo':
        return (
          <motion.div
            key="demo"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full flex flex-col items-center justify-center px-6 md:px-12"
          >
            <motion.h3 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl md:text-7xl font-black text-blue-400 mb-12 relative"
            >
              <span className="absolute inset-0 text-blue-500 blur-sm opacity-50">Live Demo</span>
              <span className="relative z-10">Live Demo</span>
            </motion.h3>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative mb-8 w-full max-w-4xl group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-2xl group-hover:blur-3xl transition-all" />
              {selectedStory.demo.type === 'video' && selectedStory.id === 'pictuz' ? (
                <div className="relative bg-black/60 rounded-2xl overflow-hidden shadow-2xl border border-blue-500/30 backdrop-blur-sm">
                  <video 
                    className="w-full h-64 md:h-96 object-cover"
                    controls
                    poster="/maiatransformada.png"
                  >
                    <source src={selectedStory.demo.content} type="video/mp4" />
                  </video>
                </div>
              ) : (
                <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-8 h-64 md:h-96 flex items-center justify-center border border-blue-500/30 backdrop-blur-sm">
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <PlayCircle className="text-blue-400 mx-auto mb-4" size={64} />
                    </motion.div>
                    <p className="text-xl text-gray-300">Interactive Demo</p>
                    <p className="text-gray-400">Coming Soon</p>
                  </div>
                </div>
              )}
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
              {selectedStory.demo.highlights.map((highlight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50, rotateX: -90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1, type: "spring" }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-lg group-hover:blur-xl transition-all" />
                  <div className="relative bg-black/40 border border-blue-500/30 rounded-lg p-4 backdrop-blur-sm hover:border-blue-500/60 transition-all">
                    <ArrowRight className="text-blue-400 mb-2" size={20} />
                    <p className="text-gray-200">{highlight}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
        
      case 'tech':
        return (
          <motion.div
            key="tech"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full flex flex-col items-center justify-center px-6 md:px-12"
          >
            <motion.h3 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl md:text-7xl font-black text-purple-400 mb-12 relative"
            >
              <span className="absolute inset-0 text-purple-500 blur-sm opacity-50">{selectedStory.techStack.title}</span>
              <span className="relative z-10">{selectedStory.techStack.title}</span>
            </motion.h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
              {selectedStory.techStack.technologies.map((tech, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1, type: "spring", stiffness: 150 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative bg-black/40 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm hover:border-purple-500/60 transition-all text-center h-full flex flex-col justify-center">
                    <div className="text-4xl mb-3">{tech.icon}</div>
                    <h4 className="text-white font-bold text-lg mb-2">{tech.name}</h4>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">{tech.category}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
        
      case 'results':
        return (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full flex flex-col items-center justify-center px-6 md:px-12"
          >
            <motion.h3 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl md:text-7xl font-black text-yellow-400 mb-12 relative"
            >
              <span className="absolute inset-0 text-yellow-500 blur-sm opacity-50">Results & Impact</span>
              <span className="relative z-10">Results & Impact</span>
            </motion.h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 w-full max-w-6xl">
              {selectedStory.results.metrics.map((metric, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0, y: 100 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.15, type: "spring", stiffness: 100 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative bg-black/40 border border-yellow-500/30 rounded-xl p-8 backdrop-blur-sm hover:border-yellow-500/60 transition-all text-center h-full flex flex-col justify-center">
                    <metric.icon className="text-yellow-400 mx-auto mb-4" size={40} />
                    <div className="text-4xl font-black text-white mb-2">{metric.value}</div>
                    <div className="text-gray-300 uppercase tracking-wider text-sm">{metric.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="relative group max-w-4xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 blur-2xl group-hover:blur-3xl transition-all" />
              <div className="relative bg-black/40 border border-yellow-500/30 rounded-2xl p-8 backdrop-blur-sm">
                <p className="text-xl md:text-2xl text-gray-200 leading-relaxed text-center">
                  {selectedStory.results.impact}
                </p>
              </div>
            </motion.div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  return (
    <section id="projects" className="min-h-screen relative overflow-hidden py-20" ref={containerRef}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-cosmic-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-cosmic-darkblue/20 via-cosmic-black to-cosmic-black" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
            animate={{
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-6xl md:text-8xl font-black mb-6 relative inline-block">
            <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 blur-2xl opacity-50" />
            <span className="relative cosmic-gradient-text">My Projects</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400">Click to explore the journey</p>
        </motion.div>

        {/* 3 PORTAIS FUTURISTAS */}
        <AnimatePresence mode="wait">
          {!selectedProject ? (
            <motion.div
              key="portals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
              {projectStories.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 100, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.2, type: "spring", stiffness: 100 }}
                  className="group relative cursor-pointer"
                  onClick={() => openProject(project.id)}
                >
                  {/* Glow Effect */}
                  <motion.div 
                    className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-0 group-hover:opacity-40 blur-3xl transition-all duration-500 -z-10`}
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: idx * 0.5,
                    }}
                  />
                  
                  {/* Portal Card */}
                  <div className="relative h-[500px] rounded-3xl overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-all duration-500 bg-black/40 backdrop-blur-sm">
                    {/* Animated Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-10 group-hover:opacity-20 transition-all duration-500`} />
                    
                    {/* Scan Lines Effect */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: 'linear-gradient(transparent 50%, rgba(255,255,255,0.02) 50%)',
                        backgroundSize: '100% 4px',
                      }}
                      animate={{ y: [0, -4] }}
                      transition={{ duration: 0.1, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Content */}
                    <div className="relative h-full flex flex-col p-8">
                      {/* Icon with Floating Animation */}
                      <motion.div
                        className={`mb-6 relative`}
                        animate={{ 
                          y: [0, -10, 0],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          delay: idx * 0.3
                        }}
                      >
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${project.gradient} p-4 relative`}>
                          <div className="absolute inset-0 bg-black/20 rounded-2xl" />
                          {idx === 0 && <Sparkles className="w-full h-full text-white relative z-10" />}
                          {idx === 1 && <Activity className="w-full h-full text-white relative z-10" />}
                          {idx === 2 && <Brain className="w-full h-full text-white relative z-10" />}
                        </div>
                        
                        {/* Status Badge */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + idx * 0.2 }}
                          className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            project.results.status === 'live' ? 'bg-green-500' :
                            project.results.status === 'in-progress' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          } text-white shadow-lg`}
                        >
                          {project.results.status === 'live' ? '🚀 Live' :
                           project.results.status === 'in-progress' ? '⚡ Beta' :
                           '✓ Done'}
                        </motion.div>
                      </motion.div>

                      {/* Title & Subtitle */}
                      <h3 className="text-3xl md:text-4xl font-black text-white mb-3 group-hover:scale-105 transition-transform">
                        {project.title}
                      </h3>
                      <p className="text-gray-400 text-lg mb-6">
                        {project.subtitle}
                      </p>

                      {/* Teaser */}
                      <div className="flex-1">
                        <p className="text-gray-300 leading-relaxed line-clamp-3">
                          {project.problem.description}
                        </p>
                      </div>

                      {/* Call to Action */}
                      <motion.div
                        className={`mt-6 flex items-center justify-between p-4 rounded-xl border border-white/10 bg-gradient-to-r ${project.gradient} bg-opacity-10 group-hover:border-white/30 transition-all`}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="text-white font-semibold">Explore Project</span>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="text-white" size={24} />
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // FULLSCREEN STORY MODE
            <motion.div
              key="story"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="fixed inset-0 z-50 bg-cosmic-black flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={closeProject}
                className="fixed top-8 right-8 z-50 w-12 h-12 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all group"
              >
                <X className="text-white group-hover:rotate-90 transition-transform" size={24} />
              </button>

              {/* Story Content */}
              <div className={`flex-1 relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${selectedStory?.gradient} opacity-5`} />
                <AnimatePresence mode="wait">
                  {renderChapter()}
                </AnimatePresence>
              </div>

              {/* Progress Bar & Controls */}
              <div className="relative bg-black/60 border-t border-white/10 backdrop-blur-md py-6 px-8">
                <div className="max-w-6xl mx-auto">
                  {/* Project Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedStory?.title}</h2>
                      <p className="text-gray-400">{selectedStory?.subtitle}</p>
                    </div>
                    <button
                      onClick={() => setIsAutoPlay(!isAutoPlay)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-all"
                    >
                      {isAutoPlay ? <Pause size={16} /> : <Play size={16} />}
                      <span className="text-sm text-white">{isAutoPlay ? 'Pause' : 'Play'}</span>
                    </button>
                  </div>

                  {/* Chapter Progress */}
                  <div className="flex items-center gap-3">
                    {chapters.map((chapter, idx) => (
                      <button
                        key={chapter}
                        onClick={() => setCurrentChapter(idx)}
                        className="flex-1 group relative"
                      >
                        <div className={`h-2 rounded-full transition-all ${
                          currentChapter === idx
                            ? `bg-${selectedStory?.accentColor}-400`
                            : currentChapter > idx
                            ? 'bg-white/40'
                            : 'bg-white/20'
                        } group-hover:bg-white/60`} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity capitalize whitespace-nowrap">
                          {chapter}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Projects;
