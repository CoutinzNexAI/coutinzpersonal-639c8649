
import React from 'react';
import { Star, MessageCircle, User } from 'lucide-react';
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
  image: string;
  text: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "Product Manager",
    company: "TechCorp Inc.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200",
    text: "Working with this developer was an absolute pleasure. They translated our vision into a stunning website that exceeded our expectations in every way.",
    rating: 5
  },
  {
    id: 2,
    name: "Sarah Lee",
    role: "CEO",
    company: "Startup Ventures",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
    text: "Incredible attention to detail and technical skills. Our web application performance improved by 60% after their optimizations.",
    rating: 5
  },
  {
    id: 3,
    name: "Michael Chen",
    role: "Marketing Director",
    company: "Global Brands",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
    text: "The most responsive developer I've worked with. Always available for questions and implemented changes quickly while maintaining high quality.",
    rating: 4
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <div className="glass-panel p-6 h-full flex flex-col">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center">
        <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
          <img 
            src={testimonial.image} 
            alt={testimonial.name} 
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-bold">{testimonial.name}</h3>
          <p className="text-sm text-gray-400">{testimonial.role}, {testimonial.company}</p>
        </div>
      </div>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            size={16} 
            className={i < testimonial.rating ? "text-cosmic-purple fill-cosmic-purple" : "text-gray-500"} 
          />
        ))}
      </div>
    </div>
    
    <div className="relative flex-grow">
      <MessageCircle className="absolute text-cosmic-blue/20 h-16 w-16 -top-2 -left-2 opacity-30" />
      <p className="text-gray-300 relative z-10 italic">"{testimonial.text}"</p>
    </div>
  </div>
);

const Testimonials = () => {
  return (
    <section id="testimonials" className="section-padding bg-cosmic-black/50">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Client Testimonials</h2>
        
        <div className="max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <TestimonialCard testimonial={testimonial} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-6 gap-4">
              <CarouselPrevious className="relative static left-0 translate-y-0 bg-cosmic-purple/10 hover:bg-cosmic-purple/20 border-cosmic-purple/20" />
              <CarouselNext className="relative static right-0 translate-y-0 bg-cosmic-purple/10 hover:bg-cosmic-purple/20 border-cosmic-purple/20" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
