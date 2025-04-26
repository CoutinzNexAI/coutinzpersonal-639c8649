
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { FileText, Download } from "lucide-react";

interface Project {
  id: number;
  title: string;
  description: string;
  fileUrl: string;
  course: string;
}

interface ProjectsPopupProps {
  courseTitle: string;
  children: React.ReactNode;
}

const ProjectsPopup: React.FC<ProjectsPopupProps> = ({ courseTitle, children }) => {
  // Dados de exemplo dos projetos
  const projects: Project[] = [
    {
      id: 1,
      title: "Análise de Algoritmos",
      description: "Um estudo aprofundado sobre a eficiência de diferentes algoritmos de ordenação.",
      fileUrl: "/projects/algoritmos.pdf",
      course: "Ciência da Computação"
    },
    {
      id: 2,
      title: "Sistemas Operacionais",
      description: "Implementação de um gerenciador de processos para sistemas Linux.",
      fileUrl: "/projects/sistemas.pdf",
      course: "Ciência da Computação"
    },
    {
      id: 3,
      title: "Projeto Final",
      description: "Desenvolvimento de uma aplicação web completa utilizando React e Node.js.",
      fileUrl: "/projects/projeto-final.pdf",
      course: "Ciência da Computação"
    }
  ].filter(project => project.course === courseTitle);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-cosmic-black/90 border-cosmic-blue">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4 cosmic-gradient-text">
            Projetos: {courseTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4">
          {projects.length > 0 ? projects.map(project => (
            <div key={project.id} className="glass-panel p-4 hover:border-cosmic-blue transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                  <p className="text-gray-300 mt-1">{project.description}</p>
                </div>
                <a 
                  href={project.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-cosmic-blue/20 p-2 rounded-full hover:bg-cosmic-blue/40 transition-colors"
                  title="Download PDF"
                >
                  <Download size={18} />
                </a>
              </div>
            </div>
          )) : (
            <div className="text-center p-6">
              <FileText size={48} className="mx-auto text-gray-500 mb-2" />
              <p className="text-gray-400">Nenhum projeto disponível para este curso</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectsPopup;
