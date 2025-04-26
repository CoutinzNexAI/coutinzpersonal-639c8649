
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ProjectCategory = {
  name: string;
  projects: {
    title: string;
    pdfUrl: string;
  }[];
};

const projectCategories: ProjectCategory[] = [
  {
    name: "Statistics",
    projects: [
      { title: "Statistical Analysis Project", pdfUrl: "/pdfs/stats-project.pdf" },
      { title: "Data Visualization Study", pdfUrl: "/pdfs/data-viz.pdf" },
    ]
  },
  {
    name: "Solver Projects",
    projects: [
      { title: "Algorithm Optimization", pdfUrl: "/pdfs/algorithm.pdf" },
      { title: "Mathematical Modeling", pdfUrl: "/pdfs/math-model.pdf" },
    ]
  }
];

const ProjectModal = () => {
  const openPdf = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-cosmic-blue/10 border-cosmic-blue/20 hover:bg-cosmic-blue/20">
          View Projects
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4">Academic Projects</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6">
          {projectCategories.map((category) => (
            <div key={category.name} className="space-y-3">
              <h3 className="text-xl font-semibold text-cosmic-blue">{category.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.projects.map((project) => (
                  <Button
                    key={project.title}
                    variant="outline"
                    className="p-4 h-auto text-left flex flex-col items-start gap-2 hover:bg-cosmic-blue/10"
                    onClick={() => openPdf(project.pdfUrl)}
                  >
                    <span className="text-lg font-medium">{project.title}</span>
                    <span className="text-sm text-gray-400">Click to view PDF</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;
