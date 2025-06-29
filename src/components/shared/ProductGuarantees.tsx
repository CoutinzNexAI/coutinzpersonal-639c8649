import React from 'react';
import { Shield, Sparkles, Truck, Award } from 'lucide-react';

interface GuaranteeItem {
  icon: React.ReactNode | React.ComponentType<{ className?: string }>;
  title: string;
}

interface ProductGuaranteesProps {
  guarantees?: GuaranteeItem[];
  className?: string;
}

const defaultGuarantees: GuaranteeItem[] = [
  {
    icon: <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />,
    title: 'Material Premium'
  },
  {
    icon: <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />,
    title: 'Impressão HD'
  },
  {
    icon: <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />,
    title: '~1 semana'
  },
  {
    icon: <Award className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />,
    title: 'Garantia Total'
  }
];

export const ProductGuarantees: React.FC<ProductGuaranteesProps> = ({
  guarantees = defaultGuarantees,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-2 gap-2 sm:gap-3 ${className}`}>
      {guarantees.map((guarantee, index) => (
        <div 
          key={index}
          className="group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30"
        >
          <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            {React.isValidElement(guarantee.icon) ? guarantee.icon : React.createElement(guarantee.icon as React.ComponentType<{ className?: string }>, { className: "w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" })}
          </div>
          <span className="text-xs font-bold text-ghibli-earth">{guarantee.title}</span>
        </div>
      ))}
    </div>
  );
};

export default ProductGuarantees; 