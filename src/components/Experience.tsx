
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
  type: 'work' | 'education';
};

const experiences: ExperienceItem[] = [
  {
    id: 1,
    title: "Senior Developer",
    organization: "Tech Company Inc.",
    duration: "2021 - Present",
    description: "Led development of innovative products and mentored junior developers. Implemented new technologies and improved existing systems.",
    type: "work"
  },
  {
    id: 2,
    title: "Master's Degree in Computer Science",
    organization: "University of Technology",
    duration: "2019 - 2021",
    description: "Specialized in artificial intelligence and machine learning. Completed thesis on image transformation algorithms.",
    type: "education"
  },
  {
    id: 3,
    title: "Frontend Developer",
    organization: "Digital Studio",
    duration: "2018 - 2021",
    description: "Developed responsive web applications and implemented modern UI/UX practices. Collaborated with designers to create seamless user experiences.",
    type: "work"
  },
  {
    id: 4,
    title: "Bachelor's Degree in Software Engineering",
    organization: "State University",
    duration: "2014 - 2018",
    description: "Studied software development, data structures, and algorithms. Participated in multiple hackathons and coding competitions.",
    type: "education"
  },
  {
    id: 5,
    title: "Junior Developer Intern",
    organization: "Startup Hub",
    duration: "2017 - 2018",
    description: "Assisted in developing features for web applications. Gained hands-on experience with agile methodologies.",
    type: "work"
  }
];

const Experience = () => {
  return (
    <section id="experience" className="section-padding bg-cosmic-black/50">
      <div className="container mx-auto px-4 overflow-x-hidden">
        <h2 className="section-title text-center">Experience & Education</h2>
        
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-cosmic-purple via-cosmic-blue to-cosmic-pink"></div>
            
            <div className="space-y-12">
              {experiences.map((exp, index) => (
                <div 
                  key={exp.id}
                  className={cn(
                    "relative flex md:flex-row flex-col md:items-center",
                    index % 2 === 0 ? "md:flex-row-reverse" : ""
                  )}
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
                    "glass-panel p-6 md:w-5/12 ml-12 md:ml-0 animate-fade-in flex flex-col justify-between",
                    index % 2 === 0 ? "md:mr-8" : "md:ml-8"
                  )}>
                    <div>
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
                      <p className="text-gray-400">{exp.organization}</p>
                      <p className="text-sm text-gray-500 mb-3">{exp.duration}</p>
                      <p className="text-gray-300">{exp.description}</p>
                    </div>
                    <div className="mt-4">
                      <ProjectModal />
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
