
import React from 'react';
import { Quote } from 'lucide-react';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

type Testimonial = {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  image: string;
};

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "CTO",
    company: "TechVision",
    content: "Working with this developer was a game-changer for our project. Their attention to detail and innovative problem-solving skills helped us launch our platform ahead of schedule.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300"
  },
  {
    id: 2,
    name: "Sophia Chen",
    role: "Product Manager",
    company: "InnovateLabs",
    content: "An exceptional talent who combines technical expertise with creative thinking. They understood our vision and transformed it into an intuitive, beautiful user experience.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=300"
  },
  {
    id: 3,
    name: "Marcus Williams",
    role: "Founder",
    company: "CreativeSphere",
    content: "I've worked with many developers, but few have the same level of dedication and passion. They're not just a coder, but a true partner who cares about the success of the project.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300"
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="section-padding overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center mb-12">What People Say</h2>
        
        <div className="max-w-5xl mx-auto relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="md:basis-1/1 lg:basis-1/2">
                  <div className="glass-panel p-6 h-full flex flex-col">
                    <div className="mb-4 flex justify-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cosmic-blue">
                          <img 
                            src={testimonial.image} 
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-cosmic-blue rounded-full p-1">
                          <Quote size={12} className="text-white" />
                        </div>
                      </div>
                    </div>
                    
                    <blockquote className="text-gray-300 text-center italic mb-4 flex-grow">
                      "{testimonial.content}"
                    </blockquote>
                    
                    <div className="text-center">
                      <p className="font-bold text-white">{testimonial.name}</p>
                      <p className="text-gray-400 text-sm">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2" />
            </div>
          </Carousel>
          
          <div className="mt-8 flex justify-center gap-2 md:hidden">
            <CarouselPrevious />
            <CarouselNext />
          </div>
          
          <div className="absolute -z-10 w-[200px] h-[200px] bg-cosmic-blue/20 rounded-full blur-[100px] -top-20 -left-20" />
          <div className="absolute -z-10 w-[200px] h-[200px] bg-cosmic-purple/20 rounded-full blur-[100px] -bottom-20 -right-20" />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
