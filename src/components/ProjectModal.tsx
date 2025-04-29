import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Assuming these imports are correct
import { Button } from "@/components/ui/button"; // Assuming this import is correct

// Define the structure for a single project - can be reused
type Project = {
  title: string;
  pdfUrl: string;
};

// Define the props the component will accept
type ProjectModalProps = {
  projects: Project[]; // Expects an array of projects
};

const ProjectModal: React.FC<ProjectModalProps> = ({ projects }) => {
  // Function to open PDF in a new tab
  const openPdf = (url: string) => {
    // Basic validation for URL format (optional but recommended)
    if (url && (url.startsWith('/') || url.startsWith('http'))) {
       window.open(url, '_blank', 'noopener,noreferrer'); // Added security attributes
    } else {
      console.error("Invalid PDF URL:", url);
      // Optionally show an error message to the user
    }
  };

  // If there are no projects passed, don't render the modal trigger (handled in Experience component)
  // This component now assumes it's only rendered when projects exist.

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* Using the same button style as the user provided */}
        <Button variant="outline" className="bg-cosmic-blue/10 border-cosmic-blue/20 hover:bg-cosmic-blue/20 text-sm px-3 py-1.5 h-auto"> {/* Adjusted size slightly */}
          View Projects
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700 text-gray-200"> {/* Adjusted size and styling */}
        <DialogHeader>
          {/* Changed title to be more generic */}
          <DialogTitle className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Relevant Projects
          </DialogTitle>
        </DialogHeader>
        {/* Check if projects array is actually populated */}
        {projects && projects.length > 0 ? (
          // Grid layout for the projects
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Button
                key={project.title}
                variant="outline"
                // Styling the project buttons
                className="p-4 h-auto text-left flex flex-col items-start gap-1.5 rounded-md bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-blue-500/70 transition-all duration-200"
                onClick={() => openPdf(project.pdfUrl)}
              >
                {/* Project Title */}
                <span className="text-base font-medium text-gray-100">{project.title}</span>
                {/* Call to action text */}
                <span className="text-xs text-blue-400 group-hover:text-blue-300">Click to view PDF</span>
              </Button>
            ))}
          </div>
        ) : (
          // Message if no projects are found (shouldn't happen if trigger is conditional, but good fallback)
          <p className="text-gray-400">No specific projects available for this item.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;
