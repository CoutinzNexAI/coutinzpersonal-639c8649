
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
    description: "• Starting an incredible advanced master's program at Nova IMS, one of Europe's most prestigious and renowned institutions for data science and analytics • Diving deep into cutting-edge AI techniques, machine learning algorithms, and predictive analytics • Mastering advanced statistical modeling, deep learning frameworks, and big data technologies • This program will provide access to world-class faculty, industry partnerships, and revolutionary AI research projects",
    type: "education",
    location: "Portugal"
  },
  {
    id: 2,
    title: "AI Research Intern: Mathematical Model Implementation & Operational Performance Analysis",
    organization: "INESC TEC",
    duration: "Feb 2025 – Aug 2025",
    description: "• Implementing advanced machine learning models for predictive maintenance and production optimization • Developing time-series forecasting algorithms using LSTM and ensemble methods • Creating automated data pipelines for real-time analytics • Collaborating with PhD researchers on AI-driven optimization algorithms",
    type: "work",
    location: "Portugal"
  },
  {
    id: 3,
    title: "Erasmus Student Exchange - AI & Data Analytics Focus",
    organization: "UPC - EEBE (Polytechnic University of Catalonia)",
    duration: "Sep 2024 – Feb 2025",
    description: "International study experience specializing in Industrial Engineering with strong focus on AI applications, data analytics, and numerical simulation for industrial optimization.",
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
    description: "• Monitored and analyzed production KPIs using data-driven approaches • Implemented process optimization techniques and performance tracking systems • Collaborated in preparing automated reports and predictive analytics dashboards",
    type: "work",
    location: "Portugal"
  },
  {
    id: 5,
    title: "Bachelor's Degree in Industrial Engineering and Management - AI Specialization",
    organization: "ISEP - Instituto Superior de Engenharia do Porto",
    duration: "Sep 2022 – Sep 2025",
    description: "• Building expertise in AI applications for industrial optimization and management • Strong foundation in mathematics, statistics, and machine learning principles • Focus on data-driven decision making and intelligent systems development",
    type: "education",
    location: "Portugal",
    projects: [
      { title: "AI-Driven Industrial Project (Second Year)", pdfUrl: "/ReCupBox_Relatório.pdf" },
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
                    <h3 className="text-lg md:text-xl font-bold line-clamp-2">{exp.title}</h3>
                    <p className="text-gray-300 text-sm mb-1">{exp.organization}{exp.location ? ` - ${exp.location}` : ''}</p>
                    <p className="text-sm text-gray-500 mb-3">{exp.duration}</p>
                    <p className="text-gray-300 text-sm md:text-base mb-4">{exp.description}</p>
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
