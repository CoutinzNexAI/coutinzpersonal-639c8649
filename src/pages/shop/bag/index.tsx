import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PromotionalBanner from '@/components/landing/PromotionalBanner';
import { useRouter } from 'next/router';
import { getPrintifyProductsByCategory } from '@/lib/printify/printifyProducts';

const BagIndexPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Como só há um tipo de saco, redirecionar diretamente para ele
    const bagProducts = getPrintifyProductsByCategory('bags');
    const bagProductIds = Object.keys(bagProducts);
    
    if (bagProductIds.length > 0) {
      const firstBagId = bagProductIds[0]; // 'tote_bag'
      router.replace(`/shop/bag/${firstBagId}`);
    } else {
      // Se não há produtos, voltar à loja principal
      router.replace('/shop');
    }
  }, [router]);

  // Loading state enquanto redireciona
  return (
    <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-ghibli-moss border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-ghibli-earth">A carregar sacos...</p>
      </div>
    </div>
  );
};

export default BagIndexPage; 