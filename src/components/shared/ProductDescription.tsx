import React from 'react';

interface DescriptionItem {
  text: string;
  color?: 'moss' | 'wood';
  emoji?: string;
}

interface ProductDescriptionProps {
  items?: DescriptionItem[];
  className?: string;
}

const defaultMugDescription: DescriptionItem[] = [
  { 
    text: 'Caneca de <span class="font-bold text-ghibli-moss">cerâmica premium</span> resistente',
    color: 'moss'
  },
  { 
    text: 'Impressão duradoura e <span class="font-bold">resistente à lavagem</span>',
    color: 'moss'
  },
  { 
    text: '<span class="font-bold text-ghibli-wood">Perfeita para todas as ocasiões</span>',
    color: 'wood'
  }
];

export const ProductDescription: React.FC<ProductDescriptionProps> = ({
  items = defaultMugDescription,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <ul className="text-sm space-y-1 text-ghibli-earth/80">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              item.color === 'wood' ? 'bg-ghibli-wood' : 'bg-ghibli-moss'
            }`}></div>
            <span 
              dangerouslySetInnerHTML={{ __html: item.text }}
            />
            {item.emoji && <span className="text-red-500">{item.emoji}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductDescription; 