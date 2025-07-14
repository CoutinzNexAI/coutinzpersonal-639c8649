// src/pages/politica-privacidade.tsx
import React from 'react';
import Header from '@/components/Header'; // Ajusta o caminho se necessário
import Footer from '@/components/Footer'; // Ajusta o caminho se necessário
import Head from 'next/head'; // Para definir o título da página
import Link from 'next/link'; // Para links internos

const PoliticaPrivacidadePage: React.FC = () => {
  // --- DADOS ATUALIZADOS ---
  const nomeEmpresaOuSeuNome = "PicTuz Team";
  const urlSite = "https://pictuz.com";
  const emailContacto = "pictuzinfo@gmail.com";
  const dataAtualizacao = "29 de Dezembro de 2024"; // ✅ Data corrigida
  const urlTermosServicos = "/termos-servicos";

  return (
    <div className="flex flex-col min-h-screen bg-ghibli-paper">
      <Head>
        <title>Política de Privacidade - Como Protegemos os Seus Dados | Pictuz</title>
        <meta name="description" content="Política de Privacidade do Pictuz. Proteção de dados pessoais, imagens, pagamentos Stripe, fulfillment especializado e conformidade RGPD com total transparência." />
        <meta name="keywords" content="política privacidade, proteção dados, RGPD, privacidade AI, produtos personalizados, Stripe, Portugal" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Política de Privacidade - Pictuz" />
        <meta property="og:description" content="Como protegemos os seus dados pessoais, imagens e pagamentos na plataforma Pictuz" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://pictuz.com/politica-privacidade" />
        
        {/* SEO Técnico */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://pictuz.com/politica-privacidade" />
      </Head>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm p-6 md:p-10 rounded-lg shadow-md border border-ghibli-sand/30">
          {/* Título Principal */}
          <h1 className="text-3xl md:text-4xl font-ghibli font-bold text-ghibli-wood mb-6 text-center">
            Política de Privacidade - PicTuz
          </h1>
          <p className="text-sm text-center text-muted-foreground mb-8">
            Última Atualização: {dataAtualizacao}
          </p>

          {/* Introdução */}
          <p className="mb-6 text-ghibli-earth">
            Bem-vindo(a) à Política de Privacidade do PicTuz. A sua privacidade é extremamente importante para nós. Este documento explica como {nomeEmpresaOuSeuNome} ("nós", "nosso") recolhe, utiliza, armazena e protege as suas informações pessoais quando utiliza o nosso serviço PicTuz (o "Serviço"), incluindo transformações AI e loja de produtos personalizados, acessível através de <a href={urlSite} target="_blank" rel="noopener noreferrer" className="text-ghibli-sky hover:underline">{urlSite}</a>.
          </p>
          <p className="mb-6 text-ghibli-earth">
            Ao utilizar o Serviço, concorda com a recolha e utilização de informações de acordo com esta política. Esta Política de Privacidade deve ser lida em conjunto com os nossos <Link href={urlTermosServicos} legacyBehavior><a className="text-ghibli-sky hover:underline">Termos de Serviço</a></Link>.
          </p>

          {/* Secções da Política */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">1. Informações que Recolhemos</h2>
            <p className="mb-4 text-ghibli-earth">Recolhemos diferentes tipos de informações para fornecer e melhorar o nosso Serviço completo de transformações AI e produtos personalizados:</p>
            
            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">1.1 Dados Pessoais (Autenticação)</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>Via Google Auth (Supabase):</strong> Nome completo, endereço de email e URL da foto de perfil do Google para criar e manter o seu perfil de utilizador.</li>
              <li><strong>ID de Utilizador:</strong> Identificador único gerado automaticamente para gestão da conta e histórico.</li>
            </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">1.2 Conteúdo e Transformações</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>Imagens Originais:</strong> Fotografias que carrega para transformação, armazenadas no Supabase Storage durante o processamento.</li>
              <li><strong>Imagens Transformadas:</strong> Resultados das transformações AI, armazenados permanentemente para acesso no seu histórico.</li>
              <li><strong>Metadados de Transformação:</strong> Data, estilo aplicado, parâmetros de processamento e estado das transformações.</li>
              <li><strong>Limite de Transformações:</strong> Registo da utilização das suas transformações diárias gratuitas.</li>
            </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">1.3 Loja e Pagamentos</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>Dados de Pagamento (Stripe):</strong> Processamos pagamentos através do Stripe. Não armazenamos detalhes completos do cartão - apenas identificadores de transação, metadados de pagamento e dados necessários para gestão de encomendas.</li>
              <li><strong>Informações de Encomenda:</strong> Produtos selecionados, personalizações aplicadas, preços, quantidades e referências de encomenda.</li>
              <li><strong>Dados de Entrega:</strong> Para fulfillment de produtos físicos, partilhamos dados de entrega necessários (nome, morada, contacto) com a nossa gráfica parceira apenas para produção e expedição.</li>
              <li><strong>Histórico de Compras:</strong> Registo das suas encomendas para suporte e gestão de conta.</li>
            </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">1.4 Comunidade (Opcional)</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>Publicações Públicas:</strong> Transformações que escolhe partilhar, incluindo títulos e descrições fornecidas.</li>
              <li><strong>Interações Sociais:</strong> Likes, comentários e outras interações na comunidade.</li>
            </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">1.5 Analytics e Comportamento</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>PostHog Analytics:</strong> Análise comportamental detalhada incluindo:
                <ul className="list-circle list-outside pl-6 mt-2 space-y-1">
                  <li>Padrões de navegação e utilização da plataforma</li>
                  <li>Funnels de conversão (transformações → produtos)</li>
                  <li>Heatmaps e session recordings (dados sensíveis censurados)</li>
                  <li>Performance de funcionalidades e identificação de problemas</li>
                  <li>Personalização de experiência baseada em preferências</li>
                </ul>
              </li>
              <li><strong>Google Analytics:</strong> Dados agregados sobre tráfego, páginas visitadas, tempo de permanência e origens de tráfego.</li>
              <li><strong>Vercel Analytics:</strong> Dados de performance da aplicação e velocidade de carregamento.</li>
                </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">1.6 Dados Técnicos</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Cookies Essenciais:</strong> Gestão de sessão e autenticação (Supabase Auth).</li>
              <li><strong>Logs de Sistema:</strong> Registos técnicos para debugging e segurança.</li>
              <li><strong>Informações de Dispositivo:</strong> Tipo de dispositivo, browser, resolução (para otimização).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">2. Como Utilizamos as Suas Informações</h2>
            <p className="mb-4 text-ghibli-earth">Utilizamos as informações recolhidas para os seguintes fins específicos:</p>
            
            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">2.1 Prestação do Serviço</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>Processamento de Transformações:</strong> Envio de imagens para OpenAI API para transformação AI e armazenamento dos resultados.</li>
              <li><strong>Gestão de Conta:</strong> Manutenção do perfil, histórico de transformações e autenticação.</li>
              <li><strong>Fulfillment de Produtos:</strong> Processamento de encomendas, produção e entrega através da nossa gráfica parceira.</li>
              <li><strong>Processamento de Pagamentos:</strong> Gestão segura de transações através do Stripe.</li>
            </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">2.2 Melhoramento e Otimização</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>Analytics Comportamentais:</strong> Identificação de pontos de atrito, otimização de funnels e melhoramento da experiência utilizador.</li>
              <li><strong>Desenvolvimento de Funcionalidades:</strong> Criação de novas funcionalidades baseadas em padrões de utilização reais.</li>
              <li><strong>Personalização:</strong> Adaptação da interface e sugestões baseadas nas suas preferências.</li>
              <li><strong>Performance:</strong> Otimização da velocidade e estabilidade da plataforma.</li>
            </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">2.3 Suporte e Comunicação</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>Suporte Técnico:</strong> Resolução de problemas e assistência com encomendas.</li>
              <li><strong>Atualizações Importantes:</strong> Comunicação sobre alterações de serviço, políticas ou questões de segurança.</li>
              <li><strong>Gestão de Reclamações:</strong> Processamento de devoluções, reembolsos e questões de qualidade.</li>
            </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">2.4 Segurança e Conformidade</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Prevenção de Fraude:</strong> Deteção de atividades suspeitas em pagamentos e utilização.</li>
              <li><strong>Cumprimento Legal:</strong> Conformidade com obrigações legais e regulamentares.</li>
              <li><strong>Moderação de Conteúdo:</strong> Verificação de cumprimento das regras de conteúdo aceitável.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">3. Partilha de Informações com Terceiros</h2>
            <p className="mb-4 text-ghibli-earth">Só partilhamos os seus dados com terceiros nas seguintes circunstâncias específicas:</p>
            
            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">3.1 Parceiros de Serviço Essenciais</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>OpenAI:</strong> Imagens para transformação AI (processamento temporário, não armazenamento).</li>
              <li><strong>Gráfica Parceira:</strong> Dados de encomenda e entrega necessários para produção e expedição de produtos físicos.</li>
              <li><strong>Stripe:</strong> Dados de pagamento para processamento seguro de transações.</li>
              <li><strong>Supabase:</strong> Armazenamento seguro de dados de conta, imagens e metadados.</li>
            </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">3.2 Fornecedores de Analytics</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>PostHog:</strong> Dados comportamentais agregados e anonimizados para analytics avançados.</li>
              <li><strong>Google Analytics:</strong> Dados de tráfego agregados e anonimizados.</li>
              <li><strong>Vercel:</strong> Dados de performance da aplicação.</li>
              </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">3.3 Situações Legais</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Obrigações Legais:</strong> Cumprimento de ordens judiciais, regulamentações ou investigações legais.</li>
              <li><strong>Proteção de Direitos:</strong> Defesa dos nossos direitos legais ou de terceiros.</li>
              <li><strong>Segurança Pública:</strong> Prevenção de atividades ilegais ou prejudiciais.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">4. Armazenamento e Segurança de Dados</h2>
            
            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">4.1 Localização e Armazenamento</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>Supabase:</strong> Dados principais armazenados em datacenters europeus para conformidade RGPD.</li>
              <li><strong>Histórico Permanente:</strong> Imagens transformadas são mantidas permanentemente para acesso continuado ao seu histórico.</li>
              <li><strong>Backups Seguros:</strong> Sistemas de backup automático com encriptação para proteção contra perda de dados.</li>
            </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">4.2 Medidas de Segurança</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>Encriptação:</strong> Dados em trânsito e em repouso protegidos com encriptação de nível bancário.</li>
              <li><strong>Autenticação Segura:</strong> OAuth do Google gerido pelo Supabase Auth para máxima segurança.</li>
              <li><strong>Acesso Limitado:</strong> Acesso aos dados estritamente limitado a pessoal autorizado para operações específicas.</li>
              <li><strong>Monitorização:</strong> Sistemas de deteção de intrusões e monitorização contínua de segurança.</li>
            </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">4.3 Retenção de Dados</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Histórico de Transformações:</strong> Mantido permanentemente como parte do valor do serviço.</li>
              <li><strong>Dados de Encomenda:</strong> Mantidos por 7 anos para conformidade fiscal e garantias.</li>
              <li><strong>Analytics:</strong> Dados comportamentais mantidos por 2 anos para análise de tendências.</li>
              <li><strong>Logs de Sistema:</strong> Mantidos por 6 meses para resolução de problemas técnicos.</li>
              </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">5. Os Seus Direitos RGPD</h2>
            <p className="mb-4 text-ghibli-earth">De acordo com o Regulamento Geral de Proteção de Dados (RGPD), tem os seguintes direitos:</p>
            
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Direito de Acesso:</strong> Solicitar uma cópia dos dados pessoais que temos sobre si.</li>
              <li><strong>Direito de Retificação:</strong> Correção de dados incorretos ou incompletos.</li>
              <li><strong>Direito de Apagamento:</strong> Solicitar a eliminação dos seus dados pessoais (sujeito a limitações legais e contratuais).</li>
              <li><strong>Direito de Limitação:</strong> Restringir o processamento dos seus dados em certas circunstâncias.</li>
              <li><strong>Direito de Portabilidade:</strong> Receber os seus dados em formato estruturado e legível por máquina.</li>
              <li><strong>Direito de Oposição:</strong> Opor-se ao processamento dos seus dados para marketing direto ou outros fins.</li>
              <li><strong>Retirada de Consentimento:</strong> Retirar consentimento para analytics avançados mantendo acesso às funcionalidades principais.</li>
            </ul>
            
            <p className="mt-4 text-ghibli-earth">
              Para exercer qualquer destes direitos, contacte-nos em <a href={`mailto:${emailContacto}`} className="text-ghibli-sky hover:underline">{emailContacto}</a>. Responderemos no prazo de 30 dias.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">6. Cookies e Tecnologias de Tracking</h2>
            
            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">6.1 Cookies Essenciais</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>Autenticação:</strong> Cookies do Supabase Auth para manter a sessão de utilizador.</li>
              <li><strong>Carrinho de Compras:</strong> Armazenamento local dos itens selecionados.</li>
              <li><strong>Preferências:</strong> Configurações de interface e preferências de utilizador.</li>
            </ul>

            <h3 className="text-lg font-semibold text-ghibli-wood mb-3">6.2 Cookies de Analytics</h3>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mb-4">
              <li><strong>PostHog:</strong> Tracking comportamental para otimização da plataforma.</li>
              <li><strong>Google Analytics:</strong> Análise de tráfego e utilização agregada.</li>
              <li><strong>Vercel Analytics:</strong> Monitorização de performance da aplicação.</li>
            </ul>

            <p className="text-ghibli-earth">
              Pode gerir as suas preferências de cookies através das configurações do seu browser. Note que desativar cookies essenciais pode afetar a funcionalidade da plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">7. Menores de Idade</h2>
            <p className="text-ghibli-earth">
              O nosso Serviço não se destina a menores de 16 anos. Não recolhemos conscientemente informações pessoais de menores de 16 anos. Se for pai/mãe ou tutor e souber que o seu filho nos forneceu dados pessoais, contacte-nos para que possamos tomar as medidas necessárias para remover essas informações.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">8. Transferências Internacionais</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Dados Principais:</strong> Armazenados em datacenters europeus (Supabase) para máxima proteção RGPD.</li>
              <li><strong>Processamento AI:</strong> OpenAI (EUA) - dados enviados temporariamente apenas para processamento, não armazenamento.</li>
              <li><strong>Analytics:</strong> PostHog e Google Analytics com salvaguardas adequadas para transferências UE-EUA.</li>
              <li><strong>Fulfillment:</strong> Nossa gráfica processa dados de entrega conforme necessário para produção e expedição.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">9. Atualizações desta Política</h2>
            <p className="text-ghibli-earth">
              Podemos atualizar esta Política de Privacidade periodicamente para refletir alterações no nosso Serviço ou requisitos legais. Notificaremos sobre alterações significativas através da plataforma ou por email. Recomendamos que reveja esta política regularmente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">10. Contacto e Questões</h2>
            <p className="text-ghibli-earth">
              Para questões sobre esta Política de Privacidade, exercício dos seus direitos RGPD, ou questões sobre proteção de dados, contacte-nos:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mt-4">
              <li><strong>Email:</strong> <a href={`mailto:${emailContacto}`} className="text-ghibli-sky hover:underline">{emailContacto}</a></li>
              <li><strong>Resposta:</strong> Garantimos resposta no prazo de 30 dias conforme RGPD</li>
              <li><strong>Direitos RGPD:</strong> Processamento gratuito de todos os pedidos relacionados com os seus direitos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">11. Autoridade de Supervisão</h2>
            <p className="text-ghibli-earth">
              Se não estiver satisfeito com a nossa resposta a questões de privacidade, tem o direito de apresentar uma reclamação à Comissão Nacional de Proteção de Dados (CNPD) de Portugal, a autoridade de supervisão competente para questões de proteção de dados.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PoliticaPrivacidadePage;