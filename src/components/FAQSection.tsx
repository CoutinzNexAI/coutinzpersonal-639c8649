// src/components/FAQSection.tsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // Importa framer-motion para animações
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
    question: "O que é o PicTuz?",
    answer: "O PicTuz é uma plataforma online inovadora que utiliza inteligência artificial para transformar as suas fotografias em obras de arte únicas. Explore uma variedade de estilos e dê uma nova vida às suas imagens!",
  },
  {
    id: "item-2",
    question: "Como funciona o PicTuz?",
    answer: (
      <div className="space-y-2">
        <p>É muito simples!</p>
        <ol className="list-decimal list-inside space-y-1 pl-2">
          <li>Crie a sua conta ou faça login (pode usar a sua conta Google).</li>
          <li>Carregue a fotografia que deseja transformar (aceitamos JPG, PNG, WEBP, até 10MB).</li>
          <li>Navegue pela nossa galeria de estilos e escolha o seu favorito.</li>
          <li>Efetue o pagamento de forma segura através do Stripe.</li>
        </ol>
        <p>A nossa IA entra em ação e, em pouco tempo, a sua imagem transformada estará pronta para descarregar!</p>
      </div>
    ),
  },
  {
    id: "item-3",
    question: "O PicTuz é gratuito?",
    answer: "Cada transformação de imagem no PicTuz envolve um pequeno custo, pago no momento do processamento. Isto permite-nos manter e evoluir a tecnologia de IA. Fique atento a possíveis promoções!",
  },
  {
    id: "item-4",
    question: "As minhas fotos são armazenadas nos servidores do PicTuz?",
    answer: "Para processar a sua imagem, precisamos de a carregar temporariamente para os nossos servidores seguros. A imagem original é usada para a transformação e depois guardamos a imagem transformada no seu histórico pessoal para que a possa descarregar. Levamos a sua privacidade muito a sério. Consulte a nossa Política de Privacidade para mais detalhes.",
  },
  {
    id: "item-5",
    question: "É seguro fazer pagamentos no PicTuz?",
    answer: "Sim, completamente! Todos os pagamentos são processados através do Stripe, uma das plataformas de pagamento mais seguras e reconhecidas mundialmente. O PicTuz não armazena os dados do seu cartão.",
  },
  // Adiciona mais perguntas aqui...
  {
    id: "item-6",
    question: "Quais estilos artísticos estão disponíveis?",
    answer: "Oferecemos uma coleção crescente de estilos, desde inspirações clássicas como Ghibli e Cartoon, até estéticas mais abstratas ou temáticas como Azulejo Português. Explore a nossa galeria de estilos para ver todas as opções!",
   },
   {
    id: "item-7",
    question: "Preciso de uma conta para usar o serviço?",
    answer: "Sim, é necessário criar uma conta (pode usar o login Google) para transformar imagens, aceder ao seu histórico e descarregar os seus resultados.",
   },
   {
    id: "item-8",
    question: "Quanto tempo demora para transformar uma imagem?",
    answer: "O tempo de processamento pode variar dependendo da complexidade do estilo e da carga atual nos nossos servidores, mas geralmente leva apenas alguns instantes a poucos minutos. Será notificado assim que estiver pronta!",
   },
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
    <section id="faq" className="py-16 md:py-24 bg-ghibli-paper"> {/* ADICIONADO: id="faq" */}
      <div className="container mx-auto px-4 max-w-5xl"> {/* Aumentada largura máxima */}
        {/* Título da Secção FAQ */}
        <h2 className="section-title text-center mb-10 md:mb-16"> {/* Aumentada margem inferior */}
          Perguntas Frequentes
        </h2>

        {/* Componente Acordeão com layout em 2 colunas em desktop */}
        {/* Aplicado grid e gap */}
        <Accordion
          type="single"
          collapsible
          className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" // Grid layout
        >
          {faqData.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              // Estilo de cada item: fundo subtil, borda temática, sombra no hover
              className="border border-ghibli-sand/30 bg-gradient-to-br from-white/80 to-ghibli-cream/30 backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:border-ghibli-sand/50"
            >
              {/* Usar um div interno para motion.div não interferir com AccordionItem */}
              <div>
                <AccordionTrigger
                  // Estilo do trigger: padding, fontes, cores, hover
                  className="w-full flex justify-between items-center text-left p-4 md:p-5 font-medium text-ghibli-wood hover:no-underline group rounded-t-xl data-[state=open]:text-ghibli-moss data-[state=open]:bg-ghibli-cream/40"
                >
                  {/* Animação de hover no texto */}
                  <motion.span
                    whileHover={{ x: 2, transition: { duration: 0.2 } }} // Leve deslocamento no hover
                    className="flex-1 text-base md:text-lg pr-4" // Padding à direita para espaço do ícone
                  >
                    {item.question}
                  </motion.span>
                  {/* Ícone Plus/Minus com animação */}
                  <div className="relative h-5 w-5 shrink-0 text-ghibli-moss">
                    {/* Minus (visível quando aberto) */}
                    <motion.div
                       initial={false} // Não animar na montagem
                       animate={{ scale: 1, opacity: 1, rotate: 0 }}
                       exit={{ scale: 0.5, opacity: 0, rotate: -90 }}
                       transition={{ duration: 0.2, ease: "easeInOut" }}
                       className="absolute inset-0"
                       // A visibilidade é controlada pelo data-state do pai (AccordionTrigger)
                       // Usamos classes do grupo para mostrar/esconder baseado no estado
                       // Nota: O Accordion do Shadcn pode não expor o estado diretamente para animação fácil aqui.
                       // Uma abordagem mais simples é usar a classe data-[state=open] no pai.
                       // Vamos usar a rotação no ícone abaixo.
                    >
                      {/* Simplificado: Usar rotação no ícone */}
                    </motion.div>
                    {/* Ícone Chevron (ou Plus/Minus) que roda */}
                     <motion.div
                       initial={false}
                       animate={{ rotate: 0 }} // Estado fechado
                       // A rotação será controlada pela classe data-[state=open] no Trigger
                       className="transition-transform duration-300 group-data-[state=open]:rotate-180"
                     >
                       <Plus className="h-5 w-5 group-data-[state=open]:hidden" />
                       <Minus className="h-5 w-5 hidden group-data-[state=open]:block" />
                     </motion.div>
                  </div>
                </AccordionTrigger>
                {/* AnimatePresence para animar a entrada/saída do conteúdo */}
                <AnimatePresence initial={false}>
                  {/* O AccordionContent do Shadcn já tem animação, mas podemos envolvê-lo */}
                  {/* para adicionar mais efeitos se necessário, ou usar o próprio AccordionContent */}
                  {/* como motion component se ele aceitar a prop 'as'. Por simplicidade, */}
                  {/* vamos confiar na animação padrão do Shadcn por agora. */}
                   <AccordionContent
                     // Estilo da área da resposta
                     className="p-4 md:p-5 pt-2 text-ghibli-earth text-sm md:text-base leading-relaxed bg-white/40 rounded-b-xl overflow-hidden" // overflow-hidden ajuda na animação
                   >
                     {/* Adicionar um motion.div para animar o conteúdo interno */}
                      <motion.div
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit" // Nota: AnimatePresence precisa estar fora do AccordionItem para exit funcionar corretamente
                      >
                         {item.answer}
                      </motion.div>
                   </AccordionContent>
                </AnimatePresence>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};