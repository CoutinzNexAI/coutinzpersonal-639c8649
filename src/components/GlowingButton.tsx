
import React from 'react';
import { cn } from "@/lib/utils";

interface GlowingButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

const GlowingButton = ({ 
  children, 
  className = '', 
  href, 
  onClick,
  variant = 'primary' 
}: GlowingButtonProps) => {
  const baseClasses = "relative px-6 py-3 rounded-lg font-medium transition-all duration-300 overflow-hidden group";
  
  const variantClasses = {
    primary: "bg-cosmic-purple text-white hover:animate-pulse-glow",
    secondary: "bg-cosmic-blue text-white hover:animate-pulse-glow", 
    outline: "border-2 border-cosmic-purple bg-transparent text-cosmic-purple hover:bg-cosmic-purple/10"
  };
  
  const buttonContent = (
    <>
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-gradient-to-r from-cosmic-purple to-cosmic-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
    </>
  );

  if (href) {
    return (
      <a 
        href={href} 
        className={cn(baseClasses, variantClasses[variant], className)}
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <button 
      onClick={onClick} 
      className={cn(baseClasses, variantClasses[variant], className)}
    >
      {buttonContent}
    </button>
  );
};

export default GlowingButton;
