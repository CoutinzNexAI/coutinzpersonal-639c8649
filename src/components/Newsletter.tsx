
import React from 'react';
import { Mail, Send, Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import GlowingButton from './GlowingButton';

const Newsletter = () => {
  return (
    <section id="newsletter" className="section-padding relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="text-cosmic-blue" />
                <h3 className="text-xl font-bold">Stay Connected</h3>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold cosmic-gradient-text">
                Subscribe for Updates & Insights
              </h2>
              
              <p className="text-gray-300">
                Get notified about my latest projects, tech articles, and professional updates. 
                No spam, just valuable content.
              </p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <div>
                    <GlowingButton className="mt-4">
                      <span className="flex items-center gap-2">
                        <Send size={16} />
                        Subscribe Now
                      </span>
                    </GlowingButton>
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-cosmic-black border-cosmic-blue">
                  <div className="p-4">
                    <h2 className="text-xl font-bold mb-4">Almost there!</h2>
                    <p className="mb-4">Enter your email to receive updates:</p>
                    
                    <form className="space-y-4">
                      <div>
                        <input 
                          type="email" 
                          placeholder="Your email address" 
                          className="w-full p-3 bg-cosmic-black/80 border border-cosmic-blue/50 rounded-lg focus:outline-none focus:border-cosmic-blue"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="consent" className="rounded border-cosmic-blue/50" />
                        <label htmlFor="consent" className="text-sm text-gray-300">
                          I agree to receive occasional emails with updates and insights
                        </label>
                      </div>
                      <GlowingButton className="w-full">
                        <span className="flex items-center justify-center gap-2">
                          <Heart size={16} />
                          Join the Community
                        </span>
                      </GlowingButton>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <svg width="200" height="200" viewBox="0 0 200 200" className="animate-float">
                  <defs>
                    <linearGradient id="mailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0EA5E9" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                  </defs>
                  
                  {/* Envelope base */}
                  <rect x="20" y="50" width="160" height="100" rx="5" fill="url(#mailGradient)" />
                  
                  {/* Envelope flap */}
                  <path 
                    d="M20,50 L100,90 L180,50 L180,50 L20,50 Z" 
                    fill="#0c87c1"
                  />
                  
                  {/* Envelope content */}
                  <rect x="40" y="80" width="120" height="50" rx="2" fill="white" opacity="0.7" />
                  
                  {/* Decorative lines */}
                  <line x1="50" y1="90" x2="150" y2="90" stroke="#333" strokeWidth="2" />
                  <line x1="50" y1="100" x2="150" y2="100" stroke="#333" strokeWidth="2" />
                  <line x1="50" y1="110" x2="120" y2="110" stroke="#333" strokeWidth="2" />
                  
                  {/* Animated hearts */}
                  <circle cx="170" cy="70" r="5" fill="#f06" opacity="0.8">
                    <animate 
                      attributeName="cy" 
                      values="70;40;70" 
                      dur="4s" 
                      repeatCount="indefinite" 
                    />
                    <animate 
                      attributeName="opacity" 
                      values="0.8;0.4;0.8" 
                      dur="4s" 
                      repeatCount="indefinite" 
                    />
                  </circle>
                  <circle cx="30" cy="80" r="4" fill="#f06" opacity="0.6">
                    <animate 
                      attributeName="cy" 
                      values="80;60;80" 
                      dur="3s" 
                      repeatCount="indefinite" 
                      begin="1s"
                    />
                    <animate 
                      attributeName="opacity" 
                      values="0.6;0.3;0.6" 
                      dur="3s" 
                      repeatCount="indefinite" 
                      begin="1s"
                    />
                  </circle>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute -z-10 top-1/3 left-1/4 w-[300px] h-[300px] bg-cosmic-purple/10 rounded-full blur-[120px]" />
      <div className="absolute -z-10 bottom-1/3 right-1/4 w-[250px] h-[250px] bg-cosmic-blue/10 rounded-full blur-[100px]" />
    </section>
  );
};

export default Newsletter;
