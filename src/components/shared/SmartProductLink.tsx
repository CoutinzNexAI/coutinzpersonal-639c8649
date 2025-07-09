import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';

interface SmartProductLinkProps {
  productUrl: string;
  children: React.ReactNode;
  className?: string;
}

export const SmartProductLink: React.FC<SmartProductLinkProps> = ({
  productUrl,
  children,
  className
}) => {
  const router = useRouter();
  const { getRedirectUrl, isLoading } = useSmartRedirect();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Prevent default se ainda estiver carregando
    if (isLoading) {
      e.preventDefault();
      return;
    }

    const targetUrl = getRedirectUrl(productUrl);
    
    // Se a URL de destino é diferente da original, redirecionar manualmente
    if (targetUrl !== productUrl) {
      e.preventDefault();
      router.push(targetUrl);
    }
    
    // Se targetUrl === productUrl, deixar o Link funcionar normalmente
  };

  return (
    <Link
      href={productUrl}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
}; 