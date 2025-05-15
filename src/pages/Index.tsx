// src/pages/index.tsx
import Link from 'next/link';
import React from 'react';

// Este console.log pode ou não aparecer nos Runtime Logs da Vercel
// dependendo se esta página for renderizada no servidor em runtime ou no build.
// Mas se a página funcionar, veremos o conteúdo no navegador.
console.log("[index.tsx] MINIMAL PAGE: Ficheiro carregado, a iniciar renderização para /");

const MinimalIndexPage = () => {
  // Este console.log aparecerá na consola do NAVEGADOR se a página renderizar.
  console.log("[index.tsx] MINIMAL PAGE: Componente MinimalIndexPage a renderizar para / (CLIENT-SIDE)");
  return (
    <div style={{ 
        padding: '50px', 
        textAlign: 'center', 
        backgroundColor: '#f0f0f0', 
        color: '#333', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif' // Adiciona uma fonte básica para melhor legibilidade
    }}>
      <h1>Página Inicial Mínima de Teste</h1>
      <p>Se estás a ver isto, o ficheiro <code>index.tsx</code> básico está a ser alcançado e renderizado.</p>
      <p>Data e Hora (Cliente): {new Date().toISOString()}</p>
      <Link href="/politica-privacidade" style={{marginTop: '20px', color: 'blue', textDecoration: 'underline'}}>
        Ir para Política de Privacidade (teste de link)
      </Link>
    </div>
  );
};

export default MinimalIndexPage;
