// src/components/FAQSection.tsx
import React from 'react';
import { motion } from 'framer-motion'; // Importa framer-motion para animações
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Certifica-te que o caminho está correto
import { Plus, Minus } from 'lucide-react'; // Importa ícones Plus e Minus

// Define a estrutura para cada item do FAQ
interface FaqItem {
  id: string;
  question: string;
  answer: string | React.ReactNode; // A resposta pode ser string ou JSX
}

// Conteúdo do FAQ - Adapta estas perguntas e respostas conforme necessário
const faqData: FaqItem[] = [
  {
    id: "item-1",
    question: "O que é o PicTuz e como funciona a magia?",
    answer: (
      <div className="space-y-3">
        <p>
          O <strong>PicTuz</strong> é a plataforma portuguesa mais avançada para transformar as suas fotografias em obras de arte únicas usando inteligência artificial de última geração!
        </p>
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-800 text-sm">
            ✨ <strong>A nossa IA foi treinada</strong> com milhares de obras de arte clássicas e modernas, permitindo criar transformações que rivalizam com artistas profissionais!
          </p>
        </div>
        <p>
          Simplesmente carregue a sua foto, escolha entre os nossos <strong>+15 estilos únicos</strong> (desde Ghibli mágico até Azulejo Português), e veja a magia acontecer em segundos!
        </p>
      </div>
    ),
  },
  {
    id: "item-2",
    question: "Como começar? É realmente grátis?",
    answer: (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 font-medium">
            🎁 <strong>SIM! Completamente grátis para começar!</strong>
          </p>
        </div>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Registe-se gratuitamente</strong> (pode usar o Google) e receba <strong>2 PicCoins</strong> de bónus!
          </li>
          <li>
            <strong>Carregue a sua foto</strong> (JPG, PNG, WEBP até 10MB) - sem marcas de água!
          </li>
          <li>
            <strong>Escolha o seu estilo favorito</strong> da nossa galeria curada
          </li>
          <li>
            <strong>Use as suas PicCoins</strong> para transformar - as primeiras são por nossa conta!
          </li>
          <li>
            <strong>Descarregue em alta qualidade</strong> e partilhe na nossa comunidade
          </li>
        </ol>
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          💡 <strong>Dica:</strong> Explore a nossa comunidade - utilizadores ativos descobrem formas secretas de ganhar PicCoins extra! 🪙
        </p>
      </div>
    ),
  },
  {
    id: "item-3",
    question: "Quanto tempo demora para transformar uma imagem?",
    answer: (
      <div className="space-y-2">
        <p>
          <strong>A magia acontece rapidamente!</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Fotos simples:</strong> 30-60 segundos ⚡</li>
          <li><strong>Fotos complexas:</strong> 1-3 minutos 🎨</li>
          <li><strong>Estilos detalhados:</strong> até 5 minutos para perfeição máxima ✨</li>
        </ul>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            🚀 <strong>Novidade:</strong> Agora com processamento até 5x mais rápido! O nosso sistema de monitorização garante que nunca perde uma transformação.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "item-5",
    question: "As minhas fotos ficam seguras? E a privacidade?",
    answer: (
      <div className="space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 font-medium">
            🔒 <strong>100% Seguro e Privado!</strong>
          </p>
        </div>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Encriptação total:</strong> As suas fotos são protegidas durante todo o processo</li>
          <li><strong>Servidores europeus:</strong> Dados processados em infraestrutura GDPR-compliant</li>
          <li><strong>Retenção limitada:</strong> Fotos originais removidas após processamento</li>
          <li><strong>Controlo total:</strong> Pode eliminar as suas transformações a qualquer momento</li>
          <li><strong>Não vendemos dados:</strong> A sua privacidade é sagrada para nós</li>
        </ul>
        <p className="text-sm">
          Consulte a nossa <strong>Política de Privacidade</strong> para detalhes completos sobre proteção de dados.
        </p>
      </div>
    ),
  },
  {
    id: "item-6",
    question: "Como funciona o sistema de PicCoins?",
    answer: (
      <div className="space-y-3">
        <p>
          As <strong>PicCoins 🪙</strong> são a nossa moeda digital que torna tudo justo e transparente:
        </p>
        <div className="space-y-2">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-yellow-800">
              <strong>🎁 Bónus de Registo:</strong> 2 PicCoins gratuitas (2 transformações!)
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-blue-800">
              <strong>💰 Pacotes Económicos:</strong> Descontos até 40% em pacotes maiores
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <p className="text-purple-800">
              <strong>🌟 Bónus da Comunidade:</strong> Ganhe PicCoins participando ativamente!
            </p>
          </div>
        </div>
        <p className="text-sm text-amber-700">
          💡 <strong>Segredo:</strong> Comentários úteis, likes genuínos e partilhas na comunidade podem render PicCoins surprise! 🎁
        </p>
      </div>
    ),
  },
  {
    id: "item-8",
    question: "Pagamentos são seguros? Que métodos aceitem?",
    answer: (
      <div className="space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 font-medium">
            🛡️ <strong>Pagamentos 100% Seguros via Stripe!</strong>
          </p>
        </div>
        <p>
          Usamos o <strong>Stripe</strong>, a plataforma de pagamentos mais confiável do mundo, utilizada por empresas como Spotify, Uber e Shopify.
        </p>
        <p className="text-sm font-medium">
          🔐 <strong>O PicTuz nunca vê ou armazena dados do seu cartão</strong> - tudo processado diretamente pelo Stripe.
        </p>
      </div>
    ),
  },
  {
    id: "item-9",
    question: "Posso usar as imagens comercialmente?",
    answer: (
      <div className="space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 font-medium">
            ✅ <strong>Sim! Uso comercial permitido!</strong>
          </p>
        </div>
        <p>
          As transformações criadas no PicTuz são <strong>suas</strong> para usar como desejar:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Redes sociais:</strong> Instagram, Facebook, TikTok - sem restrições</li>
          <li><strong>Uso comercial:</strong> Marketing, produtos, vendas online</li>
          <li><strong>Impressões:</strong> Posters, merchandising, arte física</li>
          <li><strong>Portfolios:</strong> Use como exemplos do seu trabalho criativo</li>
        </ul>
        <p className="text-sm text-amber-700">
          📝 <strong>Apenas pedimos:</strong> Se partilhar publicamente, mencione @pictuz.ia - ajuda-nos a crescer! 🙏
        </p>
      </div>
    ),
  },
  {
    id: "item-10",
    question: "Que tipos de fotos funcionam melhor?",
    answer: (
      <div className="space-y-3">
        <p>
          A nossa IA é <strong>inteligente e versátil</strong>, mas algumas dicas garantem resultados incríveis:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <span className="font-medium text-green-800">✅ Funciona MUITO bem:</span>
            <ul className="text-sm mt-1 space-y-1">
              <li>• Retratos nítidos</li>
              <li>• Paisagens detalhadas</li>
              <li>• Animais de estimação</li>
              <li>• Arquitetura</li>
              <li>• Fotos com boa iluminação</li>
            </ul>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded p-3">
            <span className="font-medium text-orange-800">⚠️ Resultados variáveis:</span>
            <ul className="text-sm mt-1 space-y-1">
              <li>• Fotos muito escuras</li>
              <li>• Imagens muito pequenas</li>
              <li>• Múltiplas pessoas</li>
              <li>• Movimento/blur</li>
            </ul>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            💡 <strong>Dica profissional:</strong> Fotos quadradas (1:1) ou verticais (4:5) tendem a ter os melhores resultados para redes sociais!
          </p>
        </div>
      </div>
    ),
  }
];

// Variantes de animação para o conteúdo da resposta
const contentVariants = {
  hidden: { opacity: 0, height: 0, y: -10 },
  visible: {
    opacity: 1,
    height: 'auto',
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -10,
    transition: { duration: 0.2, ease: "easeIn" }
   }
};

export const FAQSection: React.FC = () => {
  return (
    // Secção que envolve o FAQ
    <section id="faq" className="py-12 md:py-20 bg-gradient-to-b from-ghibli-paper to-ghibli-cream/50">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Título da Secção FAQ */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="section-title mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-ghibli-earth text-lg max-w-2xl mx-auto">
            Tudo o que precisa de saber sobre o <strong>PicTuz</strong> e como transformar as suas fotos em arte incrível! ✨
          </p>
        </div>

        {/* Componente Acordeão com layout responsivo */}
        <Accordion
          type="single"
          collapsible
          className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"
        >
          {faqData.map((item, index) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              // Estilo de cada item: fundo mais atrativo, bordas melhoradas
              className={`border border-ghibli-sand/40 bg-gradient-to-br from-white/95 to-ghibli-cream/40 backdrop-blur-sm rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl hover:border-amber-400/50 hover:scale-[1.02] ${
                index < 2 ? 'lg:col-span-2' : '' // Primeiras 2 perguntas ocupam largura total no desktop
              }`}
            >
              <div>
                <AccordionTrigger
                  // Estilo melhorado do trigger
                  className="w-full flex justify-between items-center text-left p-4 md:p-6 font-semibold text-ghibli-wood hover:no-underline group rounded-t-2xl data-[state=open]:text-amber-700 data-[state=open]:bg-gradient-to-r data-[state=open]:from-amber-50/80 data-[state=open]:to-yellow-50/80 transition-all duration-300"
                >
                  {/* Animação de hover no texto */}
                  <motion.span
                    whileHover={{ x: 2, transition: { duration: 0.2 } }}
                    className="flex-1 text-sm md:text-base lg:text-lg pr-4 leading-relaxed"
                  >
                    {item.question}
                  </motion.span>
                  {/* Ícone Plus/Minus com animação melhorada */}
                  <div className="relative h-5 w-5 md:h-6 md:w-6 shrink-0 text-amber-600">
                     <motion.div
                       initial={false}
                       className="transition-transform duration-300 group-data-[state=open]:rotate-180"
                     >
                       <Plus className="h-5 w-5 md:h-6 md:w-6 group-data-[state=open]:hidden" />
                       <Minus className="h-5 w-5 md:h-6 md:w-6 hidden group-data-[state=open]:block" />
                     </motion.div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent
                  // Estilo melhorado da área da resposta
                  className="p-4 md:p-6 pt-2 text-ghibli-earth text-sm md:text-base leading-relaxed bg-white/60 rounded-b-2xl border-t border-ghibli-sand/20"
                >
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="prose prose-sm md:prose-base max-w-none prose-amber"
                  >
                     {item.answer}
                  </motion.div>
                </AccordionContent>
              </div>
            </AccordionItem>
          ))}
        </Accordion>  
      </div>
    </section>
  );
};