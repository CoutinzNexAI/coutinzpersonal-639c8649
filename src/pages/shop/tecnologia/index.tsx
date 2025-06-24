import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

const TecnologiaIndexPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar diretamente para custom_phone_case
    router.replace('/shop/tecnologia/custom_phone_case');
  }, [router]);

  // Loading state enquanto redireciona
  return (
    <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-ghibli-moss border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-ghibli-earth">A carregar tecnologia...</p>
      </div>
    </div>
  );
};

export default TecnologiaIndexPage; 