import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ NOVO: Função utilitária para obter src de imagem com fallback
export function getImageSrc(path: string | undefined | null, fallbackUrl?: string): string {
  // Se não há path, usar fallback personalizado ou padrão
  if (!path) {
    return fallbackUrl || 'https://placehold.co/400x400/F5F5DC/8B4513?text=Imagem+Indisponível';
  }
  
  // Se já é uma URL absoluta, retornar como está
  if (path.startsWith('http') || path.startsWith('/')) {
    return path;
  }
  
  // Adicionar '/' no início se necessário
  return `/${path}`;
}
