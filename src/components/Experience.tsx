import React from 'react';
import { GraduationCap, Briefcase } from 'lucide-react';
import ProjectsPopup from './ProjectsPopup';

const Experience = () => {
  return (
    <section id="experience" className="section-padding">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Experience</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Education */}
          <div className="glass-panel p-6">
            <div className="flex items-center mb-4">
              <GraduationCap size={24} className="mr-3 text-cosmic-purple" />
              <h3 className="text-xl font-bold">Education</h3>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold">
                <ProjectsPopup courseTitle="Ciência da Computação">
                  <button className="hover:text-cosmic-blue transition-colors">
                    Bachelor of Computer Science
                  </button>
                </ProjectsPopup>
              </h4>
              <p className="text-gray-400">University of Example - 2018-2022</p>
              <p className="text-gray-400 mt-2">
                Relevant coursework: Data Structures, Algorithms, Database Systems, Software Engineering.
              </p>
            </div>
          </div>
          
          {/* Work Experience */}
          <div className="glass-panel p-6">
            <div className="flex items-center mb-4">
              <Briefcase size={24} className="mr-3 text-cosmic-purple" />
              <h3 className="text-xl font-bold">Work Experience</h3>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold">Software Engineer</h4>
              <p className="text-gray-400">Tech Company - 2022-Present</p>
              <p className="text-gray-400 mt-2">
                Developing and maintaining web applications using React, Node.js, and other modern technologies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
