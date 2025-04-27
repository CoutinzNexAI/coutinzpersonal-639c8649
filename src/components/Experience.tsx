
import React from 'react';
import { Briefcase, GraduationCap, ExternalLink } from 'lucide-react';
import { cn } from "@/lib/utils";
import ProjectModal from './ProjectModal';
import { 
  Dialog, 
  DialogTrigger,
  DialogContent
} from "@/components/ui/dialog";

type ExperienceItem = {
  id: number;
  title: string;
  organization: string;
  duration: string;
  description: string;
  type: 'work' | 'education';
  projects?: {
    title: string;
    description: string;
    image?: string;
    technologies: string[];
  }[];
};

const experiences: ExperienceItem[] = [
  {
    id: 1,
    title: "Senior Developer",
    organization: "Tech Company Inc.",
    duration: "2021 - Present",
    description: "Led development of innovative products and mentored junior developers. Implemented new technologies and improved existing systems.",
    type: "work",
    projects: [
      {
        title: "Enterprise CRM Dashboard",
        description: "Led the development of a feature-rich CRM dashboard with analytics, user management, and real-time data visualization.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000",
        technologies: ["React", "TypeScript", "Node.js", "MongoDB", "Docker"]
      },
      {
        title: "E-commerce Platform Redesign",
        description: "Completely redesigned the user experience for an e-commerce platform, increasing conversions by 35%.",
        image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=1000",
        technologies: ["Next.js", "Tailwind CSS", "GraphQL", "PostgreSQL"]
      }
    ]
  },
  {
    id: 2,
    title: "Master's Degree in Computer Science",
    organization: "University of Technology",
    duration: "2019 - 2021",
    description: "Specialized in artificial intelligence and machine learning. Completed thesis on image transformation algorithms.",
    type: "education",
    projects: [
      {
        title: "Neural Style Transfer Research",
        description: "Developed and published a paper on improved neural style transfer techniques for artistic image generation.",
        image: "https://images.unsplash.com/photo-1561736778-92e52a7769ef?q=80&w=1000",
        technologies: ["Python", "TensorFlow", "PyTorch", "Computer Vision"]
      }
    ]
  },
  {
    id: 3,
    title: "Frontend Developer",
    organization: "Digital Studio",
    duration: "2018 - 2021",
    description: "Developed responsive web applications and implemented modern UI/UX practices. Collaborated with designers to create seamless user experiences.",
    type: "work",
    projects: [
      {
        title: "Travel Booking Application",
        description: "Built an interactive travel booking platform with real-time availability and dynamic pricing.",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000",
        technologies: ["React", "Redux", "SCSS", "Firebase", "Google Maps API"]
      },
      {
        title: "Social Media Dashboard",
        description: "Created an analytics dashboard for tracking social media performance across multiple platforms.",
        image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=1000",
        technologies: ["Vue.js", "D3.js", "Express", "OAuth"]
      }
    ]
  },
  {
    id: 4,
    title: "Bachelor's Degree in Software Engineering",
    organization: "State University",
    duration: "2014 - 2018",
    description: "Studied software development, data structures, and algorithms. Participated in multiple hackathons and coding competitions.",
    type: "education",
    projects: [
      {
        title: "Inventory Management System",
        description: "Capstone project - developed a full-stack inventory system for small businesses.",
        image: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?q=80&w=1000",
        technologies: ["Java", "Spring Boot", "MySQL", "Thymeleaf"]
      }
    ]
  },
  {
    id: 5,
    title: "Junior Developer Intern",
    organization: "Startup Hub",
    duration: "2017 - 2018",
    description: "Assisted in developing features for web applications. Gained hands-on experience with agile methodologies.",
    type: "work",
    projects: [
      {
        title: "Event Management Platform",
        description: "Contributed to building a platform for organizing and promoting local events.",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000",
        technologies: ["JavaScript", "jQuery", "Bootstrap", "PHP", "MySQL"]
      }
    ]
  }
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
                    <p className="text-gray-400">{exp.organization}</p>
                    <p className="text-sm text-gray-500 mb-3">{exp.duration}</p>
                    <p className="text-gray-300 mb-4">{exp.description}</p>
                    
                    {/* View Projects Button */}
                    {exp.projects && exp.projects.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="flex items-center gap-2 text-cosmic-blue hover:text-cosmic-purple transition-colors duration-200"
                          >
                            <ExternalLink size={16} />
                            View Projects
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-cosmic-black border-cosmic-blue">
                          <div className="p-4">
                            <h3 className="text-xl font-bold mb-2">
                              Projects at {exp.organization}
                            </h3>
                            <p className="text-sm text-gray-400 mb-6">
                              During {exp.duration}
                            </p>
                            
                            <div className="space-y-6">
                              {exp.projects.map((project, idx) => (
                                <div key={idx} className="glass-panel p-4">
                                  {project.image && (
                                    <div className="w-full h-40 mb-4 overflow-hidden rounded-lg">
                                      <img 
                                        src={project.image} 
                                        alt={project.title}
                                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                      />
                                    </div>
                                  )}
                                  <h4 className="font-bold text-lg mb-2">{project.title}</h4>
                                  <p className="text-gray-300 mb-3">{project.description}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {project.technologies.map((tech, techIdx) => (
                                      <span 
                                        key={techIdx}
                                        className="bg-cosmic-blue/20 text-cosmic-blue text-xs px-2 py-1 rounded"
                                      >
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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
