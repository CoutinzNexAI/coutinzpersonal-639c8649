import React from 'react';
import { Shield, Sparkles, Truck, Award } from 'lucide-react';

interface ProductGuaranteesProps {
  variant?: 'mobile' | 'desktop';
}

export const ProductGuarantees: React.FC<ProductGuaranteesProps> = ({
  variant = 'mobile'
}) => {
  const guarantees = [
    { icon: Shield, title: 'Proteção Premium' },
    { icon: Sparkles, title: 'Impressão HD' },
    { icon: Truck, title: '~1 semana' },
    { icon: Award, title: 'Garantia Total' }
  ];

  const isMobile = variant === 'mobile';
  const containerClasses = isMobile 
    ? 'grid grid-cols-2 gap-3' 
    : 'grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4';
  
  const itemClasses = isMobile 
    ? 'bg-ghibli-cream/40 rounded-xl p-3 text-center border border-ghibli-sand/30'
    : 'group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30';
  
  const iconClasses = isMobile 
    ? 'w-6 h-6 mx-auto mb-1 rounded-full bg-ghibli-moss/10 flex items-center justify-center'
    : 'w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform';

  return (
    <div className={containerClasses}>
      {guarantees.map(({ icon: Icon, title }, index) => (
        <div key={index} className={itemClasses}>
          <div className={iconClasses}>
            <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />
          </div>
          <span className="text-xs font-bold text-ghibli-earth">{title}</span>
        </div>
      ))}
    </div>
  );
}; 