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
    question: "Como funciona o PicTuz? É realmente grátis criar as fotos?",
    answer: (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 font-medium">
            🎁 <strong>SIM! Completamente grátis para transformar as suas fotos!</strong>
          </p>
        </div>
        <p>
          O <strong>PicTuz</strong> oferece <strong>10 transformações gratuitas por dia</strong> para todos os utilizadores. Simplesmente:
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Registe-se gratuitamente</strong> (pode usar o Google)</li>
          <li><strong>Carregue a sua foto</strong> (JPG, PNG, WEBP até 10MB)</li>
          <li><strong>Escolha entre +15 estilos únicos</strong> (Ghibli, LEGO, Cartoon, Azulejo Português...)</li>
          <li><strong>Transforme instantaneamente</strong> - sem custos!</li>
          <li><strong>Descarregue em alta qualidade</strong> e use como desejar</li>
        </ol>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            ⏰ <strong>Limite diário:</strong> 10 transformações por dia. Mais que suficiente para criar arte incrível!
        </p>
        </div>
      </div>
    ),
  },
  {
    id: "item-2",
    question: "Que produtos físicos posso encomendar?",
    answer: (
      <div className="space-y-3">
        <p className="font-medium text-ghibli-wood">
          Transforme as suas criações em produtos físicos de <strong>qualidade premium</strong>:
        </p>
        <div className="bg-gradient-to-r from-ghibli-moss/10 to-green-50 border border-green-200 rounded-lg p-4">
          <ul className="text-sm space-y-2">
            <li>• <strong>Decoração:</strong> Canvas, posters, quadros com moldura</li>
            <li>• <strong>Uso diário:</strong> Canecas, capas de telemóvel</li>
            <li>• <strong>Escritório:</strong> Cadernos, mousepads</li>
            <li>• <strong>Acessórios:</strong> Sacos personalizados</li>
          </ul>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            🛍️ <strong>Visite a nossa loja</strong> para ver todos os produtos disponíveis e escolher o perfeito para si!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "item-3",
    question: "Quanto tempo demora a entrega e qual o processo?",
    answer: (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 font-medium">
            🚀 <strong>Entrega rápida em 3-5 dias úteis!</strong>
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-ghibli-moss text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <h4 className="font-medium text-ghibli-wood">Encomenda Confirmada</h4>
              <p className="text-sm text-ghibli-earth">Recebe confirmação imediata por email com detalhes da encomenda</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-ghibli-sand text-ghibli-wood rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <h4 className="font-medium text-ghibli-wood">Produção Premium</h4>
              <p className="text-sm text-ghibli-earth">Impressão de alta qualidade com controlo rigoroso (1-2 dias úteis)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-ghibli-sand text-ghibli-wood rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <h4 className="font-medium text-ghibli-wood">Embalagem e Envio</h4>
              <p className="text-sm text-ghibli-earth">Embalagem cuidadosa e envio com tracking (1 dia útil)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-ghibli-moss text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">✓</div>
            <div>
              <h4 className="font-medium text-ghibli-wood">Entrega na Sua Casa</h4>
              <p className="text-sm text-ghibli-earth">Recebe o seu produto personalizado em casa (2-3 dias úteis após envio)</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            📦 <strong>Tracking incluído:</strong> Acompanhe a sua encomenda em tempo real desde a produção até à entrega!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "item-4",
    question: "A qualidade dos produtos é realmente boa?",
    answer: (
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-800 font-medium">
            ⭐ <strong>Qualidade Premium Garantida!</strong>
          </p>
        </div>
        <p>
          Usamos apenas <strong>materiais de alta qualidade</strong> e parceiros de confiança para garantir que recebe produtos que duram:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Impressão HD profissional</strong> com cores vibrantes e duradouras</li>
          <li><strong>Materiais premium</strong> resistentes ao uso diário</li>
          <li><strong>Controlo de qualidade rigoroso</strong> antes do envio</li>
          <li><strong>Acabamentos profissionais</strong> em todos os produtos</li>
        </ul>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 text-sm">
            🛡️ <strong>Garantia de 30 dias:</strong> Se não ficar 100% satisfeito com a qualidade, devolvemos o dinheiro!
        </p>
        </div>
      </div>
    ),
  },
  {
    id: "item-5",
    question: "Quanto tempo demora para transformar uma imagem?",
    answer: (
      <div className="space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 font-medium">
            ⚡ <strong>Transformação instantânea - resultados em segundos!</strong>
        </p>
        </div>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Fotos simples:</strong> 30-60 segundos ⚡</li>
          <li><strong>Fotos complexas:</strong> 1-3 minutos 🎨</li>
          <li><strong>Estilos detalhados:</strong> até 5 minutos para perfeição máxima ✨</li>
        </ul>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            🚀 <strong>Sistema otimizado:</strong> Processamento até 5x mais rápido com monitorização que garante que nunca perde uma transformação!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "item-6",
    question: "As minhas fotos ficam seguras? E a privacidade?",
    answer: (
      <div className="space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 font-medium">
            🔒 <strong>100% Seguro e Privado - A sua privacidade é sagrada!</strong>
          </p>
        </div>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Encriptação total:</strong> Fotos protegidas durante todo o processo</li>
          <li><strong>Servidores europeus:</strong> Dados processados em infraestrutura GDPR-compliant</li>
          <li><strong>Retenção limitada:</strong> Fotos originais removidas após processamento</li>
          <li><strong>Controlo total:</strong> Pode eliminar as suas transformações a qualquer momento</li>
          <li><strong>Não vendemos dados:</strong> Zero partilha com terceiros</li>
        </ul>
        <p className="text-sm">
          Consulte a nossa <strong>Política de Privacidade</strong> para detalhes completos sobre proteção de dados.
        </p>
      </div>
    ),
  },
  {
    id: "item-7",
    question: "Pagamentos são seguros? Que métodos aceitam?",
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
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-blue-800 text-sm">
              💳 <strong>Métodos aceites:</strong> Visa, Mastercard, American Express, Apple Pay, Google Pay
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <p className="text-purple-800 text-sm">
              🔐 <strong>Segurança máxima:</strong> O PicTuz nunca vê ou armazena dados do seu cartão - tudo processado diretamente pelo Stripe
        </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "item-8",
    question: "Posso usar as imagens comercialmente? Há restrições?",
    answer: (
      <div className="space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 font-medium">
            ✅ <strong>Sim! Uso comercial totalmente permitido!</strong>
          </p>
        </div>
        <p>
          As transformações criadas no PicTuz são <strong>100% suas</strong> para usar como desejar:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Redes sociais:</strong> Instagram, Facebook, TikTok - sem restrições</li>
          <li><strong>Uso comercial:</strong> Marketing, produtos, vendas online</li>
          <li><strong>Impressões:</strong> Posters, merchandising, arte física</li>
          <li><strong>Portfolios:</strong> Use como exemplos do seu trabalho criativo</li>
          <li><strong>NFTs e arte digital:</strong> Crie e venda as suas criações</li>
        </ul>
        <div className="bg-amber-50 border border-amber-200 rounded p-3">
          <p className="text-amber-700 text-sm">
          📝 <strong>Apenas pedimos:</strong> Se partilhar publicamente, mencione @pictuz.ia - ajuda-nos a crescer! 🙏
        </p>
        </div>
      </div>
    ),
  },
  {
    id: "item-9",
    question: "Que imagens posso transformar? Há limitações?",
    answer: (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 font-medium">
            ✅ <strong>Pode transformar quase tudo!</strong>
          </p>
        </div>
        <p>
          A nossa IA funciona com uma grande variedade de imagens:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Pessoas:</strong> Retratos, selfies, fotos de família</li>
          <li><strong>Animais:</strong> Cães, gatos, qualquer animal de estimação</li>
          <li><strong>Lugares:</strong> Paisagens, cidades, monumentos, natureza</li>
          <li><strong>Objetos:</strong> Carros, comida, arquitetura, arte</li>
          <li><strong>Memórias:</strong> Casamentos, festas, viagens</li>
        </ul>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">
            ❌ <strong>Não permitido:</strong> Conteúdo violento, armas, nudez ou imagens inapropriadas
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            💡 <strong>Dica:</strong> Fotos nítidas e bem iluminadas dão sempre os melhores resultados!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "item-10",
    question: "Oferecem descontos ou promoções?",
    answer: (
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-800 font-medium">
            🎁 <strong>Sim! Várias formas de poupar!</strong>
          </p>
        </div>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li><strong>Descontos automáticos:</strong> Compre 2+ produtos e poupe automaticamente</li>
          <li><strong>Transformações gratuitas:</strong> 10 por dia, crie à vontade</li>
          <li><strong>Promoções especiais:</strong> Ofertas exclusivas por email</li>
          <li><strong>Novidades:</strong> Acesso antecipado a novos produtos</li>
        </ul>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            📧 <strong>Subscreva a nossa newsletter</strong> para receber ofertas exclusivas e ser o primeiro a saber das novidades!
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