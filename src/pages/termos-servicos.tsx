// src/pages/termos-servicos.tsx
import React from 'react';
import Header from '@/components/Header'; // Ajusta o caminho se necessário
import Footer from '@/components/Footer'; // Ajusta o caminho se necessário
import Head from 'next/head'; // Para definir o título da página

const TermosServicosPage: React.FC = () => {
  // --- DADOS ATUALIZADOS ---
  const nomeEmpresaOuSeuNome = "PicTuz Team";
  const urlSite = "https://pictuz.com";
  const emailContacto = "pictuzinfo@gmail.com";
  const dataAtualizacao = "29 de Dezembro de 2024"; // ✅ Data corrigida
  const urlPoliticaPrivacidade = "/politica-privacidade";

  return (
    <div className="flex flex-col min-h-screen bg-ghibli-paper">
      <Head>
        <title>Termos e Condições de Serviço - Regras de Utilização | Pictuz</title>
        <meta name="description" content="Termos e Condições do Pictuz. Regras para transformações AI, compra de produtos personalizados (canvas, canecas, posters) e utilização da plataforma." />
        <meta name="keywords" content="termos serviço, condições utilização, produtos personalizados, canvas, canecas, termos Pictuz, direitos utilizador" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Termos e Condições de Serviço - Pictuz" />
        <meta property="og:description" content="Regras para transformações AI e compra de produtos personalizados na plataforma Pictuz" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://pictuz.com/termos-servicos" />
        
        {/* SEO Técnico */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://pictuz.com/termos-servicos" />
      </Head>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm p-6 md:p-10 rounded-lg shadow-md border border-ghibli-sand/30">
          {/* Título Principal */}
          <h1 className="text-3xl md:text-4xl font-ghibli font-bold text-ghibli-wood mb-6 text-center">
            Termos e Condições de Serviço - PicTuz
          </h1>
          <p className="text-sm text-center text-muted-foreground mb-8">
            Última Atualização: {dataAtualizacao}
          </p>

          {/* Introdução */}
          <p className="mb-6 text-ghibli-earth">
            Bem-vindo(a) ao PicTuz! Estes Termos e Condições de Serviço ("Termos") regem o seu acesso e utilização da aplicação web PicTuz e serviços associados (coletivamente, o "Serviço"), fornecidos por {nomeEmpresaOuSeuNome} ("nós", "nosso").
          </p>
          <p className="mb-6 text-ghibli-earth">
            Ao aceder ou utilizar o Serviço, concorda em ficar vinculado por estes Termos e pela nossa <a href={urlPoliticaPrivacidade} className="text-ghibli-sky hover:underline">Política de Privacidade</a>. Se não concordar com qualquer parte destes Termos, não poderá aceder ou utilizar o Serviço.
          </p>

          {/* Secções dos Termos */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">1. Definições</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Serviço:</strong> Refere-se à aplicação web PicTuz, acessível em <a href={urlSite} target="_blank" rel="noopener noreferrer" className="text-ghibli-sky hover:underline">{urlSite}</a>, incluindo transformações AI, loja de produtos personalizados e todas as funcionalidades associadas.</li>
              <li><strong>Utilizador ("você"):</strong> Qualquer pessoa singular ou coletiva que aceda ou utilize o Serviço.</li>
              <li><strong>Conta:</strong> A conta pessoal criada pelo Utilizador através de autenticação Google via Supabase Auth para aceder às funcionalidades do Serviço.</li>
              <li><strong>Conteúdo do Utilizador:</strong> Qualquer fotografia, imagem ou outro material que carregue, submeta ou disponibilize através do Serviço.</li>
              <li><strong>Transformação:</strong> O processo pelo qual o Serviço utiliza inteligência artificial (OpenAI API) para aplicar um estilo artístico selecionado ao Conteúdo do Utilizador.</li>
              <li><strong>Imagem Transformada:</strong> A imagem resultante do processo de Transformação, armazenada permanentemente no histórico do utilizador.</li>
              <li><strong>Transformações Diárias Gratuitas:</strong> Limite diário de transformações de imagem gratuitas disponíveis para cada utilizador registado.</li>
              <li><strong>Loja de Produtos:</strong> A secção do Serviço onde pode adquirir produtos físicos personalizados (canvas, canecas, posters, capas, etc.) utilizando as suas Imagens Transformadas.</li>
              <li><strong>Produtos Personalizados:</strong> Artigos físicos (canvas emoldurados, canecas, posters, capas de telemóvel, etc.) criados com as suas Imagens Transformadas através do nosso parceiro Printify.</li>
              <li><strong>Parceiro de Fulfillment:</strong> Printify, empresa que produz e entrega os Produtos Personalizados encomendados através da Loja.</li>
              <li><strong>Comunidade:</strong> Funcionalidade opcional que permite aos utilizadores partilhar publicamente as suas transformações com outros membros.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">2. Descrição do Serviço</h2>
            <p className="text-ghibli-earth mb-4">
              O PicTuz é uma plataforma que combina transformação de imagens com inteligência artificial e uma loja de produtos personalizados:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Transformações AI:</strong> Permite carregar fotografias, selecionar estilos artísticos e transformá-las usando algoritmos da OpenAI. As transformações são gratuitas dentro de um limite diário.</li>
              <li><strong>Loja de Produtos Personalizados:</strong> Permite encomendar produtos físicos (canvas emoldurados, canecas, posters, capas de telemóvel, etc.) personalizados com as suas Imagens Transformadas.</li>
              <li><strong>Fulfillment via Printify:</strong> Todos os produtos são produzidos e entregues pelo nosso parceiro Printify, garantindo qualidade profissional e entregas mundiais.</li>
              <li><strong>Histórico Permanente:</strong> Todas as Imagens Transformadas ficam disponíveis permanentemente no histórico da sua Conta.</li>
              <li><strong>Comunidade:</strong> Funcionalidade opcional para partilhar e descobrir criações de outros utilizadores.</li>
            </ul>
            <p className="text-ghibli-earth mt-4">
              <strong>Analytics e Melhoramento:</strong> Implementamos sistemas avançados de analytics (PostHog, Google Analytics) para otimizar a experiência do utilizador, identificar problemas e desenvolver funcionalidades baseadas em necessidades reais.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">3. Registo e Conta de Utilizador</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Autenticação Obrigatória:</strong> Para utilizar transformações, histórico, compras e comunidade, deve criar uma Conta através de autenticação Google.</li>
              <li><strong>Transformações Gratuitas:</strong> Utilizadores registados têm acesso a transformações gratuitas dentro do limite diário estabelecido.</li>
              <li><strong>Informações de Perfil:</strong> Ao autenticar-se, acedemos ao seu nome, email e foto de perfil do Google para criar o seu perfil.</li>
              <li><strong>Responsabilidade da Conta:</strong> É responsável por manter a segurança das suas credenciais Google e por todas as atividades na sua Conta.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">4. Loja de Produtos e Compras</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Produtos Disponíveis:</strong> Canvas emoldurados, canecas, posters, capas de telemóvel, sacos, mousepad e outros produtos que podem ser personalizados com as suas Imagens Transformadas.</li>
              <li><strong>Preços e Pagamentos:</strong> Os preços são exibidos em Euro (€) e incluem IVA quando aplicável. Os pagamentos são processados de forma segura através do Stripe.</li>
              <li><strong>Personalização:</strong> Pode ajustar a posição, escala e outros aspetos da sua imagem no produto antes da compra.</li>
              <li><strong>Processo de Encomenda:</strong> Após o pagamento, a encomenda é automaticamente enviada para o Printify para produção e expedição.</li>
              <li><strong>Produção e Entrega:</strong> O Printify produz os seus produtos personalizados e gere toda a logística de entrega. Os prazos de produção e entrega são fornecidos durante o checkout.</li>
              <li><strong>Qualidade:</strong> Garantimos que todos os produtos são produzidos com materiais de alta qualidade pelo Printify.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">5. Política de Devoluções e Reembolsos</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Produtos Personalizados:</strong> Devido à natureza personalizada dos produtos, não aceitamos devoluções por mudança de opinião.</li>
              <li><strong>Defeitos de Produção:</strong> Se receber um produto com defeito de produção ou danos durante o transporte, contacte-nos em {emailContacto} no prazo de 14 dias após a receção.</li>
              <li><strong>Reembolsos por Defeito:</strong> Para produtos com defeitos comprovados, oferecemos reimpressão gratuita ou reembolso total.</li>
              <li><strong>Erros de Encomenda:</strong> Se houver erro na sua encomenda por nossa parte, assumimos total responsabilidade e corrigimos sem custos.</li>
              <li><strong>Processo de Reclamação:</strong> Para iniciar uma reclamação, contacte-nos com fotos do produto e número da encomenda.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">6. Propriedade Intelectual e Licenças</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Suas Imagens:</strong> Mantém todos os direitos sobre as fotografias originais que carrega.</li>
              <li><strong>Imagens Transformadas:</strong> As Imagens Transformadas são criadas através do nosso Serviço, mas pode utilizá-las livremente para fins pessoais e comerciais.</li>
              <li><strong>Licença para Produção:</strong> Ao encomendar produtos, concede-nos licença para reproduzir a sua Imagem Transformada no produto escolhido.</li>
              <li><strong>Conteúdo da Comunidade:</strong> Ao partilhar na Comunidade, concede uma licença não-exclusiva para exibir publicamente a sua transformação na plataforma.</li>
              <li><strong>Propriedade da Plataforma:</strong> O PicTuz, incluindo design, código, algoritmos e marca, são propriedade nossa e estão protegidos por direitos de autor.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">7. Uso Aceitável e Proibições</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Conteúdo Proibido:</strong> Não pode carregar imagens que sejam ilegais, ofensivas, pornográficas, violentas, que violem direitos de terceiros ou que promovam ódio.</li>
              <li><strong>Uso Comercial Responsável:</strong> Pode usar as Imagens Transformadas comercialmente, mas é responsável por garantir que tem direitos sobre as imagens originais.</li>
              <li><strong>Não Pode:</strong> Tentar contornar limitações técnicas, fazer engenharia reversa, revender transformações como serviço, ou usar o Serviço para fins ilegais.</li>
              <li><strong>Moderação:</strong> Reservamo-nos o direito de remover conteúdo que viole estas regras e suspender contas infratoras.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">8. Analytics, Tracking e Consentimento</h2>
            <p className="text-ghibli-earth mb-4">
              Ao utilizar o Serviço, concorda com a recolha de dados para melhoramento da plataforma:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Analytics Comportamentais:</strong> Utilizamos PostHog para analisar padrões de utilização, funnels de conversão e otimizar a experiência do utilizador.</li>
              <li><strong>Session Recordings:</strong> Podemos gravar sessões (movimentos, cliques) para identificar problemas de usabilidade. Dados sensíveis são automaticamente censurados.</li>
              <li><strong>Google Analytics:</strong> Recolhemos dados agregados sobre tráfego e utilização da plataforma.</li>
              <li><strong>Finalidade:</strong> Todos os dados são utilizados exclusivamente para melhorar o Serviço, corrigir bugs e desenvolver funcionalidades.</li>
              <li><strong>Direito de Retirada:</strong> Pode contactar-nos para retirar o consentimento para analytics avançados mantendo acesso às funcionalidades principais.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">9. Limitação de Responsabilidade</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Serviço "Como Está":</strong> O Serviço é fornecido "como está" sem garantias específicas sobre disponibilidade contínua ou resultados específicos das transformações.</li>
              <li><strong>Limitação de Danos:</strong> A nossa responsabilidade máxima não excederá o valor pago pelos produtos ou serviços específicos em questão.</li>
              <li><strong>Responsabilidade por Conteúdo:</strong> Não somos responsáveis pelo conteúdo que carrega ou pelas consequências da sua utilização.</li>
              <li><strong>Parceiros Terceiros:</strong> Para questões relacionadas com produção ou entrega de produtos, deve contactar diretamente o Printify se necessário.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">10. Modificações aos Termos</h2>
            <p className="text-ghibli-earth">
              Podemos atualizar estes Termos periodicamente. As alterações significativas serão comunicadas através da plataforma ou por email. O uso continuado do Serviço após as alterações constitui aceitação dos novos Termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">11. Contacto</h2>
            <p className="text-ghibli-earth">
              Para questões sobre estes Termos ou o Serviço, contacte-nos em: <a href={`mailto:${emailContacto}`} className="text-ghibli-sky hover:underline">{emailContacto}</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">12. Lei Aplicável</h2>
            <p className="text-ghibli-earth">
              Estes Termos são regidos pela lei portuguesa. Qualquer disputa será resolvida nos tribunais competentes de Portugal.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermosServicosPage;