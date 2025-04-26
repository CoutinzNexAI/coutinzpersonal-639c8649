
import React, { useState } from 'react';
import { Calendar, Book } from 'lucide-react';

type DiaryEntry = {
  id: number;
  month: string;
  year: string;
  title: string;
  content: string;
  tags: string[];
};

const diaryEntries: DiaryEntry[] = [
  {
    id: 1,
    month: "January",
    year: "2024",
    title: "Getting Started with WebGL",
    content: "This month I dove into WebGL and Three.js to create interactive 3D experiences on the web. I learned how to set up a scene, create geometries, and implement lighting. The learning curve was steep but extremely rewarding.",
    tags: ["WebGL", "Three.js", "3D Graphics"]
  },
  {
    id: 2,
    month: "February",
    year: "2024",
    title: "React Performance Optimization",
    content: "I focused on optimizing React applications this month. Learned about memoization, virtualization for large lists, and effective state management strategies. Implemented these techniques in my projects and saw significant performance improvements.",
    tags: ["React", "Performance", "Optimization"]
  },
  {
    id: 3,
    month: "March",
    year: "2024",
    title: "Exploring AI Image Generation",
    content: "This month I explored AI image generation with Stable Diffusion models. I learned how to fine-tune models for specific styles and integrate them into web applications. This research directly contributed to my Ghibli Style Transform project.",
    tags: ["AI", "Stable Diffusion", "Image Generation"]
  },
  {
    id: 4,
    month: "April",
    year: "2024",
    title: "Building with TypeScript",
    content: "I focused on improving my TypeScript skills and implementing advanced types in my projects. Learned about generics, utility types, and strict type checking. This has drastically reduced bugs in my codebase and improved team collaboration.",
    tags: ["TypeScript", "Development", "Type Safety"]
  },
];

const Diary = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="diary" className="section-padding">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Learning Diary</h2>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {diaryEntries.map(entry => (
              <div 
                key={entry.id}
                className={`glass-panel p-6 transition-all duration-300 ${
                  expandedId === entry.id ? 'md:col-span-2' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Calendar size={18} className="text-cosmic-purple mr-2" />
                    <span className="text-gray-400">{entry.month} {entry.year}</span>
                  </div>
                  
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="text-sm text-cosmic-purple hover:underline"
                  >
                    {expandedId === entry.id ? 'Show Less' : 'Read More'}
                  </button>
                </div>
                
                <h3 className="text-xl font-bold mb-3">{entry.title}</h3>
                
                <p className={`text-gray-300 ${expandedId !== entry.id && 'line-clamp-3'}`}>
                  {entry.content}
                </p>
                
                {expandedId === entry.id && (
                  <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Book size={16} className="mr-2 text-cosmic-purple" />
                      Topics Covered
                    </h4>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {entry.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="text-xs bg-cosmic-blue/20 text-cosmic-blue px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Diary;
