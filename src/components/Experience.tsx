
import React from 'react';
import { Briefcase, GraduationCap } from 'lucide-react';
import { cn } from "@/lib/utils";
import ProjectModal from './ProjectModal';
import { useIsMobile } from '@/hooks/use-mobile';

type ExperienceItem = {
  id: number;
  title: string;
  organization: string;
  duration: string;
  description: string;
  highlights?: string[];
  type: 'work' | 'education' | 'course';
  location?: string;
  projects?: { title: string; pdfUrl: string; }[];
};

const experiences: ExperienceItem[] = [
  {
    id: 1,
    title: "Master's in Data Science and Advanced Analytics",
    organization: "Nova Information Management School (Nova IMS)",
    duration: "Sep 2025 – Present",
    description: "Advanced master's program at one of Europe's most prestigious institutions for data science and analytics.",
    highlights: [
      "Cutting-edge AI techniques & machine learning algorithms",
      "Advanced statistical modeling & deep learning frameworks",
      "Big data technologies & predictive analytics",
      "Access to world-class faculty & industry partnerships",
      "Revolutionary AI research projects"
    ],
    type: "education",
    location: "Portugal"
  },
  {
    id: 2,
    title: "Decision Support System for Scheduling Optimization",
    organization: "INESC TEC",
    duration: "Feb 2025 – Aug 2025",
    description: "Developed a decision support system to improve activity planning in automotive maintenance workshops, creating an effective and accessible solution for SMEs combining mathematical modeling with optimization algorithms.",
    highlights: [
      "In-depth study of the Flexible Job Shop Scheduling Problem (FJSSP)",
      "Built a Mixed Integer Linear Programming (MILP) model using Python + PuLP",
      "Benchmarked optimization solvers (Gurobi, HiGHS, CBC) for performance",
      "Created an interactive UI with Streamlit for real-world application",
      "Delivered a functional prototype with clear visual scheduling output"
    ],
    type: "work",
    location: "Portugal",
    projects: [
      { title: "Sistema de Apoio à Decisão numa Fábrica", pdfUrl: "/RelatorioEstagio.pdf" },
    ]
  },
  {
    id: 3,
    title: "Erasmus Student Exchange - AI & Data Analytics Focus",
    organization: "UPC - EEBE (Polytechnic University of Catalonia)",
    duration: "Sep 2024 – Feb 2025",
    description: "International study experience specializing in Industrial Engineering with focus on AI applications and data analytics.",
    highlights: [
      "AI applications for industrial optimization",
      "Advanced data analytics techniques",
      "Numerical simulation & modeling",
      "Cross-cultural academic collaboration"
    ],
    type: "education",
    location: "Barcelona, Spain",
    projects: [
      { title: "Data Analytics Project", pdfUrl: "/Laboratory_task_code.pdf" },
      { title: "Environmental Impact Analysis with ML", pdfUrl: "/Comparison of the environmental impact of disposable diapers vs cloth diapers FINAL.pdf" },
      { title: "Numerical Simulation & Optimization", pdfUrl: "/NSAE.pdf" }
    ]
  },
  {
    id: 4,
    title: "Production Control & Data Analysis Intern",
    organization: "Confeitarias Arca e Arcádia SA",
    duration: "Aug 2023",
    description: "Internship focused on production monitoring and data-driven optimization in manufacturing environment.",
    highlights: [
      "Production KPIs monitoring & analysis",
      "Process optimization techniques",
      "Performance tracking systems",
      "Automated reports & predictive dashboards"
    ],
    type: "work",
    location: "Portugal"
  },
  {
    id: 5,
    title: " Bachelor’s Degree in Industrial Engineering and Management",
    organization: "ISEP - Instituto Superior de Engenharia do Porto",
    duration: "Sep 2022 – Sep 2025",
    description: "A hands-on and multidisciplinary engineering degree combining technical knowledge with business and operational strategy. The program gave me a solid foundation in process optimization, production planning, data analysis and systems thinking",
    highlights: [
      "Production planning and operations management",
      "Industrial process and logistics optimization",
      "Statistical quality control and data analysis",
      "Systems modeling and simulation",
      "Tools used: Advanced Excel, Python (for analysis), Arena Simulation, Power BI, MS Project, SQL",
      "Quality control and process improvement",
      "Supply chain optimization",
    ],
    type: "education",
    location: "Portugal",
    projects: [
      { title: "AI-Driven Industrial Project (Second Year)", pdfUrl: "/ReCupBox_Relatorio.pdf" },
    ]
  },
];

const Experience = () => {
  const isMobile = useIsMobile();
  
  return (
    <section id="experience" className="section-padding bg-cosmic-black/50">
      <div className="container mx-auto px-4 overflow-x-hidden">
        <h2 className="section-title text-center animate-fade-in">Experience & Education</h2>
        
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className={cn(
              "absolute h-full w-0.5 bg-gradient-to-b from-cosmic-purple via-cosmic-blue to-cosmic-pink",
              isMobile ? "left-4" : "left-1/2 transform -translate-x-1/2"
            )}></div>
            
            <div className="space-y-8 md:space-y-12">
              {experiences.map((exp, index) => (
                <div 
                  key={exp.id}
                  className={cn(
                    "relative flex items-start animate-fade-in",
                    isMobile 
                      ? "flex-col ml-12" 
                      : cn("md:items-center", index % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row")
                  )}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute flex items-center justify-center z-10",
                    isMobile ? "left-4 top-0" : "left-1/2 transform -translate-x-1/2"
                  )}>
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      exp.type === 'work' ? 'bg-cosmic-purple' : 'bg-cosmic-blue'
                    )}>
                      {exp.type === 'work' ? (
                        <Briefcase size={16} />
                      ) : (
                        <GraduationCap size={16} />
                      )}
                    </div>
                  </div>
                  
                  {/* Content panel */}
                  <div className={cn(
                    "glass-panel p-5 md:p-6 relative group hover:scale-105 transition-transform duration-300 w-full",
                    isMobile 
                      ? "mt-2" 
                      : cn("md:w-5/12", index % 2 === 0 ? "md:mr-8" : "md:ml-8")
                  )}>
                    <div className="mb-2">
                      <span className={cn(
                        "text-xs font-semibold px-3 py-1 rounded-full",
                        exp.type === 'work' 
                          ? 'bg-cosmic-purple/20 text-cosmic-purple' 
                          : 'bg-cosmic-blue/20 text-cosmic-blue'
                      )}>
                        {exp.type === 'work' ? 'Work' : 'Education'}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold line-clamp-2 mb-2">{exp.title}</h3>
                    <p className="text-gray-300 text-sm mb-1">{exp.organization}{exp.location ? ` - ${exp.location}` : ''}</p>
                    <p className="text-sm text-gray-500 mb-3">{exp.duration}</p>
                    <p className="text-gray-300 text-sm md:text-base mb-3">{exp.description}</p>
                    
                    {exp.highlights && exp.highlights.length > 0 && (
                      <div className="mb-4">
                        <div className="grid gap-2">
                          {exp.highlights.map((highlight, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                                exp.type === 'work' ? 'bg-cosmic-purple' : 'bg-cosmic-blue'
                              )}></div>
                              <p className="text-gray-300 text-sm leading-relaxed">{highlight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(exp.projects && exp.projects.length > 0) && (
                      <div className="flex justify-end">
                        <ProjectModal projects={exp.projects}/>
                      </div>
                    )}
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

export default Experience;
