// src/pages/_app.tsx (VERSÃO DE TESTE SIMPLIFICADA)
import type { AppProps } from 'next/app';
import '@/index.css'; // Mantém os teus estilos globais base, se necessário

console.log("[_app.tsx SIMPLIFICADO] Ficheiro _app.tsx de TESTE carregado");

function MyAppSimplified({ Component, pageProps, router }: AppProps) { // Adicionado router para logar o caminho
  // Nota: pageProps.router pode não estar sempre disponível aqui da forma esperada
  // para obter o caminho. Usar o router importado de 'next/router' dentro do componente
  // é mais fiável se precisares dele para lógica. Para este log, tentamos assim.
  console.log(`[_app.tsx SIMPLIFICADO] Componente MyApp de TESTE a renderizar para o caminho: ${router?.asPath || 'caminho desconhecido'}`);
  return <Component {...pageProps} />;
}

export default MyAppSimplified;
