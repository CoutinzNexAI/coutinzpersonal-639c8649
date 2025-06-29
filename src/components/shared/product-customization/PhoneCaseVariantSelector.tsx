import React, { useState, useEffect, useMemo } from 'react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PhoneCaseVariantSelectorProps {
  product: PrintifyProductMapping;
  selectedVariantId: number | null;
  onVariantChange: (variantId: number) => void;
  label?: string;
  emoji?: string;
  customSingleVariantText?: string;
  customSingleVariantSubtext?: string;
  className?: string;
}

// Função para extrair marca do nome do modelo
const extractBrand = (title: string): string => {
  if (title.toLowerCase().includes('iphone')) return 'Apple';
  if (title.toLowerCase().includes('samsung')) return 'Samsung';
  return 'Outros';
};

// Função para limpar o nome do modelo (remover marca)
const cleanModelName = (title: string): string => {
  return title
    .replace(/^iPhone\s*/i, 'iPhone ')
    .replace(/^Samsung Galaxy\s*/i, '')
    .trim();
};

export const PhoneCaseVariantSelector: React.FC<PhoneCaseVariantSelectorProps> = ({
  product,
  selectedVariantId,
  onVariantChange,
  label = "Modelo do Telemóvel",
  emoji = "📱",
  customSingleVariantText,
  customSingleVariantSubtext,
  className = ""
}) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  
  // Organizar variantes por marca
  const variantsByBrand = useMemo(() => {
    if (!product.variants) return {};
    
    const organized: Record<string, Array<{id: number; title: string; cleanName: string}>> = {};
    
    product.variants.forEach(variant => {
      const brand = extractBrand(variant.title);
      const cleanName = cleanModelName(variant.title);
      
      if (!organized[brand]) {
        organized[brand] = [];
      }
      
      organized[brand].push({
        id: variant.id,
        title: variant.title,
        cleanName: cleanName
      });
    });
    
    // Ordenar modelos dentro de cada marca
    Object.keys(organized).forEach(brand => {
      organized[brand].sort((a, b) => {
        // Ordenação especial para iPhones (por número)
        if (brand === 'Apple') {
          const numA = parseInt(a.cleanName.match(/\d+/)?.[0] || '0');
          const numB = parseInt(b.cleanName.match(/\d+/)?.[0] || '0');
          if (numA !== numB) return numB - numA; // Mais recente primeiro
          return a.cleanName.localeCompare(b.cleanName);
        }
        // Ordenação alfabética para Samsung
        return a.cleanName.localeCompare(b.cleanName);
      });
    });
    
    return organized;
  }, [product.variants]);

  const brands = Object.keys(variantsByBrand).sort();
  const modelsForSelectedBrand = selectedBrand ? variantsByBrand[selectedBrand] || [] : [];

  // Detectar marca da variante selecionada
  useEffect(() => {
    if (selectedVariantId && product.variants) {
      const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
      if (selectedVariant) {
        const brand = extractBrand(selectedVariant.title);
        setSelectedBrand(brand);
      }
    }
  }, [selectedVariantId, product.variants]);

  // Reset modelo quando marca muda
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    // Limpar seleção de modelo quando marca muda
    if (selectedVariantId) {
      const currentVariant = product.variants?.find(v => v.id === selectedVariantId);
      if (currentVariant && extractBrand(currentVariant.title) !== brand) {
        // Se a marca mudou, limpar seleção
        onVariantChange(0); // Valor temporário para limpar
      }
    }
  };

  const handleModelChange = (variantIdStr: string) => {
    const variantId = parseInt(variantIdStr);
    onVariantChange(variantId);
  };

  // Se não há variantes, não renderizar nada
  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  // Se há apenas uma variante, mostrar informação bloqueada
  if (product.variants.length === 1) {
    const singleVariant = product.variants[0];
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-ghibli-earth">
          <span>{emoji}</span>
          <span>{label}</span>
        </div>
        
        <div className="bg-ghibli-cream/20 border border-ghibli-sand/40 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ghibli-earth">{singleVariant.title}</p>
              <p className="text-sm text-ghibli-earth/70">
                {customSingleVariantText || 'Modelo único disponível'}
              </p>
            </div>
            <div className="text-2xl opacity-50">📱</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-ghibli-earth">
        <span>{emoji}</span>
        <span>{label}</span>
      </div>

      {/* Seletor de Marca */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-ghibli-earth/80 uppercase tracking-wider">
          Marca
        </label>
        <Select value={selectedBrand} onValueChange={handleBrandChange}>
          <SelectTrigger className="w-full bg-white border-ghibli-sand/40 focus:border-ghibli-moss">
            <SelectValue placeholder="Escolha a marca..." />
          </SelectTrigger>
          <SelectContent>
            {brands.map(brand => (
              <SelectItem key={brand} value={brand}>
                <div className="flex items-center gap-2">
                  <span>{brand === 'Apple' ? '🍎' : brand === 'Samsung' ? '📱' : '📲'}</span>
                  <span>{brand}</span>
                  <span className="text-xs text-gray-500">
                    ({variantsByBrand[brand]?.length || 0} modelos)
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Seletor de Modelo */}
      {selectedBrand && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-ghibli-earth/80 uppercase tracking-wider">
            Modelo
          </label>
          <Select 
            value={selectedVariantId?.toString() || ''} 
            onValueChange={handleModelChange}
            disabled={!selectedBrand}
          >
            <SelectTrigger className="w-full bg-white border-ghibli-sand/40 focus:border-ghibli-moss">
              <SelectValue placeholder={`Escolha o modelo ${selectedBrand}...`} />
            </SelectTrigger>
            <SelectContent>
              {modelsForSelectedBrand.map(model => (
                <SelectItem key={model.id} value={model.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>📱</span>
                    <span>{model.cleanName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Informação adicional */}
      {customSingleVariantSubtext && (
        <div className="text-xs text-ghibli-earth/60 bg-ghibli-cream/10 rounded-lg p-3 border border-ghibli-sand/20">
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span>{customSingleVariantSubtext}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneCaseVariantSelector; 