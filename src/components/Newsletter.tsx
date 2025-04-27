
import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";

const Newsletter = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    // Simulate subscription
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail('');
      toast({
        title: "Subscribed!",
        description: "You've successfully subscribed to my newsletter.",
        icon: <CheckCircle className="h-5 w-5 text-green-500" />
      });
    }, 1000);
  };

  return (
    <section className="py-10 bg-cosmic-black/70">
      <div className="container mx-auto px-4">
        <div className="glass-panel p-8 md:p-12 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="md:w-2/3">
              <h3 className="text-2xl font-bold mb-2 cosmic-gradient-text">Stay Updated</h3>
              <p className="text-gray-300">
                Subscribe to my newsletter for the latest projects, insights, and tech tips delivered straight to your inbox.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="md:w-1/3 flex gap-2">
              <div className="relative flex-grow">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-cosmic-black/50 border-white/10 focus:border-cosmic-blue w-full"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button 
                type="submit"
                disabled={isSubmitting}
                variant="secondary"
                className="shrink-0"
              >
                {isSubmitting ? "..." : "Join"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
