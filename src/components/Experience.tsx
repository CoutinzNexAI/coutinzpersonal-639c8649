
import React from 'react';
import { Briefcase, GraduationCap } from 'lucide-react';
import { cn } from "@/lib/utils";
import ProjectModal from './ProjectModal';

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
    title: "Intership: Mathematical Model Implementation & Operational Performance Analysis",
    organization: "INESC TEC",
    duration: "Feb 2025 – Present",
    description: "•Implementing mathematical planning models • Analyzing operational performance of workshops • Supporting the team in process optimization.",
    type: "work",
    location: "Porto, Portugal"
  },
  {
    id: 2,
    title: "Erasmus Student Exchange",
    organization: "UPC - EEBE (Polytechnic University of Catalonia)",
    duration: "Sep 2024 – Feb 2025",
    description: "International study experience as part of the Industrial Engineering and Management degree.",
    type: "education",
    location: "Barcelona, Spain",
    projects: [
      { title: "Data Analytics Project", pdfUrl: "/Laboratory_task_code.pdf" } // Using the correct web path
    ]
  },
  {
    id: 3,
    title: "Bachelor's Degree in Industrial Engineering and Management",
    organization: "Instituto Superior de Engenharia do Porto (ISEP)",
    duration: "Sep 2022 – Sep 2025",
    description: "• Building a solid foundation in mathematics, physics, and management principles • Proactive, collaborative, strong problem-solving abilities.",
    type: "education",
    location: "Porto, Portugal"
  },
  {
    id: 4,
    title: "Internship: Production Control",
    organization: "Confeitarias Arca e Arcádia SA",
    duration: "Aug 2023",
    description: "• Monitored production and logistics processes in the factories • Collaborated in preparing performance reports and metrics.",
    type: "work",
    location: "Grijó, Portugal"
  },
];

const Experience = () => {
  return (
    <section id="experience" className="section-padding bg-cosmic-black/50">
      <div className="container mx-auto px-4 overflow-x-hidden">
        <h2 className="section-title text-center animate-fade-in">Experience & Education</h2>
        
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-cosmic-purple via-cosmic-blue to-cosmic-pink"></div>
            
            <div className="space-y-12">
              {experiences.map((exp, index) => (
                <div 
                  key={exp.id}
                  className={cn(
                    "relative flex md:flex-row flex-col md:items-center animate-fade-in",
                    index % 2 === 0 ? "md:flex-row-reverse" : ""
                  )}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 flex items-center justify-center z-10">
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
                  
                  <div className={cn(
                    "glass-panel p-6 md:w-5/12 ml-12 md:ml-0 relative group hover:scale-105 transition-transform duration-300",
                    index % 2 === 0 ? "md:mr-8" : "md:ml-8"
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
                    <h3 className="text-xl font-bold">{exp.title}</h3>
                    <p className="text-gray-300 text-sm mb-1">{exp.organization}{exp.location ? ` - ${exp.location}` : ''}</p>
                    <p className="text-sm text-gray-500 mb-3">{exp.duration}</p>
                    <p className="text-gray-300 mb-4">{exp.description}</p>
                    <div className="flex justify-end">
                      <ProjectModal projects={exp.projects || []}/>
                    </div>
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
