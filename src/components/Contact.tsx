
import React, { useState } from 'react';
import { Mail, Send, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setFormState({ name: '', email: '', message: '' });
      toast({
        title: "Message sent successfully!",
        description: "Thank you for reaching out. I'll get back to you soon."
      });
    }, 1500);
  };

  return (
    <section id="contact" className="section-padding relative overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Get In Touch</h2>
        
        <div className="max-w-4xl mx-auto">
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact info */}
            <div className="glass-panel p-8 animate-fade-in hover:scale-[1.02] transition-transform duration-300">
              <div className="mb-6 relative">
                <Star className="absolute -top-2 -left-2 w-6 h-6 text-cosmic-purple animate-pulse" />
                <h3 className="text-2xl font-bold mb-4 cosmic-gradient-text">Let's Connect</h3>
                <p className="text-gray-300 mb-8">
                  Have a project in mind or just want to say hello? Feel free to reach out. I'm always open to discussing new ideas and opportunities.
                </p>
              </div>
              
              {/* Contact details with icons */}
              <div className="space-y-4">
                <div className="flex items-center group">
                  <div className="h-10 w-10 rounded-full bg-cosmic-blue/20 flex items-center justify-center mr-4 group-hover:bg-cosmic-blue/40 transition-colors">
                    <Mail size={18} className="text-cosmic-blue group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white">your.email@example.com</p>
                  </div>
                </div>
              </div>
              
              {/* Availability indicator */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Availability
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                </h4>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                  <p className="text-green-400">Available for new projects</p>
                </div>
              </div>
            </div>
            
            {/* Contact form */}
            <div className="glass-panel p-8 animate-fade-in hover:scale-[1.02] transition-transform duration-300" style={{ animationDelay: '0.2s' }}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-gray-400 mb-1">Name</label>
                  <Input 
                    id="name"
                    name="name"
                    placeholder="Your name" 
                    value={formState.name}
                    onChange={handleChange}
                    required
                    className="bg-cosmic-black/50 border-white/10 focus:border-cosmic-blue focus:ring-1 focus:ring-cosmic-blue hover:border-cosmic-blue/50 transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-gray-400 mb-1">Email</label>
                  <Input 
                    id="email"
                    name="email"
                    type="email" 
                    placeholder="your.email@example.com" 
                    value={formState.email}
                    onChange={handleChange}
                    required
                    className="bg-cosmic-black/50 border-white/10 focus:border-cosmic-blue focus:ring-1 focus:ring-cosmic-blue hover:border-cosmic-blue/50 transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-gray-400 mb-1">Message</label>
                  <Textarea 
                    id="message"
                    name="message"
                    placeholder="Tell me about your project or inquiry" 
                    rows={5}
                    value={formState.message}
                    onChange={handleChange}
                    required
                    className="bg-cosmic-black/50 border-white/10 focus:border-cosmic-blue focus:ring-1 focus:ring-cosmic-blue hover:border-cosmic-blue/50 transition-colors"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-cosmic-blue hover:bg-cosmic-blue/80 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>Processing...</>
                    ) : (
                      <>
                        Send Message 
                        <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cosmic-purple to-cosmic-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dynamic background effects */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-cosmic-blue opacity-10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cosmic-purple opacity-10 rounded-full blur-3xl animate-pulse"></div>
    </section>
  );
};

export default Contact;
