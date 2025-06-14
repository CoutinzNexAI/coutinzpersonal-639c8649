
import React, { useState } from 'react';
import { Star, MessageCircle, User, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    text: '',
    rating: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingChange = (rating: number) => {
    setFormData({
      ...formData,
      rating
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({ name: '', role: '', company: '', text: '', rating: 5 });
      setShowForm(false);
      toast({
        title: "Testimonial submitted!",
        description: "Thank you for your feedback. It will be reviewed and published soon."
      });
    }, 1500);
  };

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

        {/* Add Testimonial Section */}
        <div className="mt-16 text-center">
          {!showForm ? (
            <div className="glass-panel p-8 max-w-md mx-auto">
              <h3 className="text-xl font-bold mb-4 cosmic-gradient-text">Share Your Experience</h3>
              <p className="text-gray-300 mb-6">
                Worked with me? I'd love to hear about your experience!
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-cosmic-purple hover:bg-cosmic-blue transition-colors duration-300 flex items-center gap-2"
              >
                <Plus size={16} />
                Write a Testimonial
              </Button>
            </div>
          ) : (
            <div className="glass-panel p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-6 cosmic-gradient-text">Write Your Testimonial</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-gray-400 mb-1">Name</label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="bg-cosmic-black/50 border-white/10 focus:border-cosmic-blue"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-gray-400 mb-1">Role</label>
                    <Input
                      id="role"
                      name="role"
                      placeholder="Your job title"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="bg-cosmic-black/50 border-white/10 focus:border-cosmic-blue"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-gray-400 mb-1">Company</label>
                  <Input
                    id="company"
                    name="company"
                    placeholder="Your company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="bg-cosmic-black/50 border-white/10 focus:border-cosmic-blue"
                  />
                </div>

                <div>
                  <label htmlFor="text" className="block text-gray-400 mb-1">Your Experience</label>
                  <Textarea
                    id="text"
                    name="text"
                    placeholder="Tell others about your experience working with me..."
                    value={formData.text}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="bg-cosmic-black/50 border-white/10 focus:border-cosmic-blue"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Rating</label>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={24}
                        className={`cursor-pointer transition-colors ${
                          i < formData.rating ? "text-cosmic-purple fill-cosmic-purple" : "text-gray-500"
                        }`}
                        onClick={() => handleRatingChange(i + 1)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border-white/10 hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-cosmic-purple hover:bg-cosmic-blue transition-colors duration-300 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Testimonial
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
