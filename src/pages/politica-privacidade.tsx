// src/pages/politica-privacidade.tsx
import React from 'react';
import Header from '@/components/Header'; // Ajusta o caminho se necessário
import Footer from '@/components/Footer'; // Ajusta o caminho se necessário
import Head from 'next/head'; // Para definir o título da página
import Link from 'next/link'; // Para links internos

const PoliticaPrivacidadePage: React.FC = () => {
  // --- PREENCHE ESTES DADOS ---
  const nomeEmpresaOuSeuNome = "PicTuz Team"; // Substitui pelo nome correto
  const urlSite = "https://pictuz.com"; // Confirma se este é o URL final
  const emailContacto = "pictuzinfo@gmail.com"; // Substitui pelo teu email de suporte
  const dataAtualizacao = "22 de Maio de 2025"; // Atualiza a data
  const urlTermosServicos = "/termos-servicos"; // Link para a página de Termos

  return (
    <div className="flex flex-col min-h-screen bg-ghibli-paper">
      <Head>
        <title>Política de Privacidade - Como Protegemos os Seus Dados | Pictuz</title>
        <meta name="description" content="Política de Privacidade do Pictuz. Saiba como protegemos e tratamos os seus dados pessoais, imagens e informações de pagamento com total transparência." />
        <meta name="keywords" content="política privacidade, proteção dados, RGPD, privacidade AI, dados pessoais Portugal" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Política de Privacidade - Pictuz" />
        <meta property="og:description" content="Como protegemos os seus dados pessoais e imagens na plataforma Pictuz" />
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
            Bem-vindo(a) à Política de Privacidade do PicTuz. A sua privacidade é extremamente importante para nós. Este documento explica como {nomeEmpresaOuSeuNome} ("nós", "nosso") recolhe, utiliza, armazena e protege as suas informações pessoais quando utiliza o nosso serviço PicTuz (o "Serviço"), acessível através de <a href={urlSite} target="_blank" rel="noopener noreferrer" className="text-ghibli-sky hover:underline">{urlSite}</a>.
          </p>
          <p className="mb-6 text-ghibli-earth">
            Ao utilizar o Serviço, concorda com a recolha e utilização de informações de acordo com esta política. Esta Política de Privacidade deve ser lida em conjunto com os nossos <Link href={urlTermosServicos} legacyBehavior><a className="text-ghibli-sky hover:underline">Termos de Serviço</a></Link>.
          </p>

          {/* Secções da Política */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">1. Informações que Recolhemos</h2>
            <p className="mb-4 text-ghibli-earth">Recolhemos diferentes tipos de informações para diversos fins, a fim de fornecer e melhorar o nosso Serviço para si:</p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li>
                <strong>Dados Pessoais (Via Autenticação Google):</strong> Quando cria uma conta utilizando o Google login através do Supabase Auth, recolhemos automaticamente o seu nome completo, endereço de email e URL da foto de perfil do Google. Esta informação é utilizada para criar e manter o seu perfil de utilizador.
              </li>
              <li>
                <strong>Imagens Carregadas:</strong> Recolhemos e armazenamos as fotografias que carrega para transformação. Estas incluem:
                <ul className="list-circle list-outside pl-6 mt-2 space-y-1">
                  <li><strong>Imagens Originais:</strong> Armazenadas no nosso sistema Supabase Storage para processamento</li>
                  <li><strong>Imagens Transformadas:</strong> O resultado final após processamento por IA, armazenadas permanentemente para acesso no seu histórico</li>
                </ul>
              </li>
              <li>
                <strong>Dados de Pagamento:</strong> Utilizamos Stripe para processar pagamentos. Não armazenamos detalhes completos do cartão - apenas identificadores da transação e metadados necessários para gestão da conta e suporte.
              </li>
              <li>
                <strong>Sistema de Transformações:</strong> Mantemos um registo da utilização das suas transformações diárias para gestão dos limites e histórico de utilização.
              </li>
              <li>
                <strong>Dados da Comunidade (Opcionais):</strong> Se escolher publicar transformações na comunidade, recolhemos títulos e descrições públicas que fornece, bem como dados de interação (likes, comentários).
              </li>
              <li>
                <strong>Dados de Utilização e Analytics:</strong> Utilizamos Google Analytics para recolher informações agregadas sobre como o Serviço é utilizado, incluindo páginas visitadas, tempo de permanência e interações básicas. Esta recolha é feita de forma anónima e agregada.
              </li>
              <li>
                <strong>Analytics Comportamentais Avançados:</strong> Análise detalhada do comportamento de utilizadores através do PostHog para:
                <ul className="list-circle list-outside pl-6 mt-2 space-y-1">
                  <li>Identificar pontos de atrito no processo de transformação</li>
                  <li>Otimizar interfaces e fluxos de utilizador</li>
                  <li>Personalizar experiência baseada em padrões de uso</li>
                  <li>Prevenir abandono através de análise de funnels</li>
                  <li>Melhorar sistema de transformações baseado em padrões de utilização</li>
                  <li>Desenvolver funcionalidades baseadas em necessidades reais identificadas</li>
                </ul>
              </li>
              <li>
                <strong>Cookies Técnicos:</strong> Utilizamos cookies essenciais para autenticação (geridos pelo Supabase Auth), funcionamento básico da plataforma, e analytics comportamentais (PostHog).
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">2. Como Utilizamos as Suas Informações</h2>
            <p className="mb-4 text-ghibli-earth">Utilizamos as informações recolhidas para os seguintes fins específicos:</p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Fornecimento do Serviço:</strong> Criar e manter a sua conta, processar transformações de imagem usando OpenAI, e apresentar o histórico das suas criações.</li>
              <li><strong>Processamento de Pagamentos:</strong> Gestão de compras de produtos físicos através do Stripe.</li>
              <li><strong>Funcionalidades da Comunidade:</strong> Permitir partilha opcional das suas transformações, sistema de likes e comentários.</li>
              <li><strong>Suporte ao Cliente:</strong> Resolução de problemas técnicos, recuperação de transformações e assistência geral.</li>
              <li><strong>Melhoramento do Serviço:</strong> Análise agregada de padrões de utilização para otimizar performance e funcionalidades.</li>
              <li><strong>Comunicações de Serviço:</strong> Notificações sobre o estado das transformações e atualizações importantes do serviço.</li>
              <li><strong>Cumprimento Legal:</strong> Satisfazer obrigações legais e fiscais aplicáveis.</li>
            </ul>
            <p className="mt-4 text-ghibli-earth"><strong>Importante sobre as Imagens:</strong> As suas imagens originais são processadas pela OpenAI API para gerar transformações. Não utilizamos as suas imagens para treinar modelos de IA próprios nem as partilhamos com terceiros para outros fins.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">3. Base Legal para o Processamento (RGPD)</h2>
            <p className="mb-4 text-ghibli-earth">Se for residente do Espaço Económico Europeu (EEE), a nossa base legal para processar os seus dados pessoais é:</p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Execução de Contrato:</strong> Processamento necessário para fornecer o serviço conforme acordado nos Termos de Serviço.</li>
              <li><strong>Consentimento:</strong> Dado através da aceitação destes termos e uso voluntário do serviço.</li>
              <li><strong>Interesses Legítimos:</strong> Melhoramento do serviço, prevenção de fraudes e analytics agregados.</li>
              <li><strong>Obrigação Legal:</strong> Cumprimento de requisitos fiscais e legais.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">4. Retenção e Armazenamento de Dados</h2>
            <p className="mb-4 text-ghibli-earth">Estabelecemos períodos de retenção claros para diferentes tipos de dados:</p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Dados da Conta:</strong> Mantidos enquanto a sua conta estiver ativa. Pode solicitar eliminação a qualquer momento.</li>
              <li><strong>Imagens Originais:</strong> Armazenadas indefinidamente no Supabase Storage para permitir re-processamento e suporte técnico. São automaticamente eliminadas se a conta for eliminada.</li>
              <li><strong>Imagens Transformadas:</strong> Armazenadas permanentemente no seu histórico pessoal enquanto a conta estiver ativa. Fazem parte do valor do serviço prestado.</li>
              <li><strong>Histórico de Compras:</strong> Mantido indefinidamente para fins contabilísticos e fiscais, conforme exigido por lei.</li>
              <li><strong>Dados de Pagamento:</strong> Identificadores Stripe retidos por pelo menos 7 anos para conformidade fiscal.</li>
              <li><strong>Dados da Comunidade:</strong> Publicações na comunidade permanecem disponíveis mesmo após eliminação da conta, mas são desassociadas do seu perfil.</li>
            </ul>
            <p className="mt-4 text-ghibli-earth">Todos os dados são armazenados de forma segura utilizando a infraestrutura Supabase (PostgreSQL + Storage), que implementa encriptação em trânsito e em repouso. Os servidores estão localizados na União Europeia para utilizadores europeus.</p>
            
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">🔒 Acesso Administrativo Limitado</h4>
              <p className="text-green-700 text-sm">
                <strong>Importante:</strong> Embora as suas imagens sejam armazenadas na nossa infraestrutura, implementamos controlos rigorosos de acesso. O acesso administrativo aos seus dados pessoais e imagens é:
              </p>
              <ul className="list-disc list-outside pl-4 mt-2 text-green-700 text-sm space-y-1">
                <li><strong>Restrito por Necessidade:</strong> Apenas acessível para resolução de problemas técnicos específicos e reportados</li>
                <li><strong>Registado e Auditado:</strong> Todos os acessos são registados com timestamp, utilizador e justificação</li>
                <li><strong>Temporário:</strong> Acesso concedido apenas pelo tempo mínimo necessário para resolver o problema</li>
                <li><strong>Compartimentado:</strong> Diferentes níveis de acesso - suporte técnico não tem acesso aos mesmos dados que administradores financeiros</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">5. Partilha e Divulgação de Dados</h2>
            <p className="mb-4 text-ghibli-earth">Não vendemos os seus dados pessoais. Partilhamos informações apenas nas seguintes situações específicas:</p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Prestadores de Serviços Essenciais:</strong>
                <ul className="list-circle list-outside pl-6 mt-2 space-y-1">
                  <li><strong>Supabase:</strong> Autenticação, base de dados e armazenamento de imagens (infraestrutura completa)</li>
                  <li><strong>Stripe:</strong> Processamento de pagamentos e gestão de transações</li>
                  <li><strong>OpenAI:</strong> Processamento de transformações de imagem via API (imagens enviadas temporariamente para processamento)</li>
                  <li><strong>Vercel:</strong> Hospedagem e deployment da aplicação</li>
                  <li><strong>Google Analytics:</strong> Análise de utilização (dados agregados e anónimos)</li>
                  <li><strong>PostHog:</strong> Analytics comportamentais avançados, funnels, session recordings e cohort analysis (dados processados na UE)</li>
                </ul>
                Todos estes prestadores têm acesso limitado aos dados, apenas para os fins específicos contratados.
              </li>
              <li><strong>Requisitos Legais:</strong> Podemos divulgar dados se legalmente obrigatório, para proteger direitos ou segurança, ou em investigações legais.</li>
              <li><strong>Comunidade PicTuz:</strong> Apenas dados que escolhe tornar públicos (transformações publicadas, comentários) são visíveis a outros utilizadores.</li>
            </ul>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🛡️ Política de Não-Visualização</h4>
              <p className="text-blue-700 text-sm">
                <strong>Compromisso de Privacidade:</strong> A equipa PicTuz compromete-se a não visualizar, descarregar ou usar as suas imagens pessoais para qualquer fim que não seja o suporte técnico direto e autorizado. 
                Implementamos uma política rigorosa de "não-curiosidade" - o acesso às imagens é feito apenas por sistemas automatizados ou em casos de suporte técnico com a sua autorização prévia.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">6. Segurança dos Dados</h2>
            <p className="text-ghibli-earth">
              A segurança dos seus dados é uma prioridade máxima. Implementamos múltiplas camadas de proteção:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mt-4">
              <li><strong>Encriptação:</strong> Todos os dados são encriptados em trânsito (HTTPS/TLS) e em repouso no Supabase</li>
              <li><strong>Autenticação Segura:</strong> Utilizamos OAuth do Google via Supabase Auth - não armazenamos palavras-passe</li>
              <li><strong>Armazenamento Seguro:</strong> Infraestrutura Supabase com conformidade SOC 2 Type II e certificação ISO 27001</li>
              <li><strong>Acesso Limitado:</strong> Apenas pessoal autorizado tem acesso aos sistemas, com logs de auditoria</li>
              <li><strong>Backups Seguros:</strong> Backups automáticos encriptados para recuperação de desastres</li>
              <li><strong>Segregação de Funções:</strong> Administradores técnicos não têm acesso às ferramentas financeiras e vice-versa</li>
              <li><strong>Políticas de Senha:</strong> Autenticação multifator obrigatória para todos os acessos administrativos</li>
            </ul>
            <p className="text-ghibli-earth mt-4">
              Contudo, nenhum método de transmissão ou armazenamento é 100% seguro. Comprometemo-nos a notificá-lo prontamente sobre qualquer violação de segurança que possa afetar os seus dados pessoais.
            </p>
            
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">🔐 Controlos de Acesso Técnico</h4>
              <p className="text-amber-700 text-sm mb-2">
                <strong>Transparência Total:</strong> Para sua tranquilidade, informamos que:
              </p>
              <ul className="list-disc list-outside pl-4 text-amber-700 text-sm space-y-1">
                <li>O acesso direto às suas imagens requer justificação documentada e aprovação prévia</li>
                <li>Utilizamos chaves de API e credenciais rotativas para limitar exposição</li>
                <li>Implementamos "breakglass" access - acessos de emergência são automaticamente reportados</li>
                <li>Revisões de acesso trimestrais para garantir que apenas pessoal autorizado mantém permissões</li>
                <li>Monitorização contínua de atividades suspeitas ou acessos não autorizados</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">7. Governança e Transparência de Dados</h2>
            <p className="text-ghibli-earth mb-4">
              Para garantir máxima transparência e confiança na gestão dos seus dados, implementamos as seguintes práticas de governança:
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="font-semibold text-slate-800 mb-2">📋 Registos de Acesso Obrigatórios</h4>
                <p className="text-slate-700 text-sm">
                  Qualquer acesso administrativo aos seus dados (incluindo imagens) é automaticamente registado com:
                  data/hora exata, identificação do administrador, razão específica do acesso, duração da sessão e ações realizadas.
                  Estes logs são imutáveis e auditados mensalmente.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">👥 Princípio dos "Quatro Olhos"</h4>
                <p className="text-purple-700 text-sm">
                  Acessos sensíveis aos dados dos utilizadores requerem aprovação de duas pessoas diferentes.
                  Isto significa que mesmo em situações de suporte técnico, não há acesso unilateral aos seus dados pessoais.
                </p>
              </div>
              
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h4 className="font-semibold text-indigo-800 mb-2">🔄 Rotação de Credenciais</h4>
                <p className="text-indigo-700 text-sm">
                  Todas as chaves de acesso administrativo são rotacionadas automaticamente a cada 90 dias.
                  As credenciais antigas são imediatamente invalidadas, garantindo que não existem "portas traseiras" permanentes.
                </p>
              </div>
              
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <h4 className="font-semibold text-teal-800 mb-2">🚨 Alertas Automáticos</h4>
                <p className="text-teal-700 text-sm">
                  O sistema gera alertas automáticos para qualquer acesso fora do horário normal (noites/fins de semana),
                  múltiplos acessos em pouco tempo, ou tentativas de acesso a volumes grandes de dados.
                  Estes alertas são revistos imediatamente pela equipa de segurança.
                </p>
              </div>
            </div>
            
            <p className="text-ghibli-earth mt-6">
              <strong>Compromisso de Transparência:</strong> Se alguma vez precisarmos de aceder aos seus dados para suporte técnico,
              será sempre comunicado previamente (quando possível) e documentado. Pode solicitar um relatório dos acessos
              à sua conta contactando-nos através de <a href={`mailto:${emailContacto}`} className="text-ghibli-sky hover:underline">{emailContacto}</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">8. Os Seus Direitos de Proteção de Dados (RGPD)</h2>
            <p className="mb-4 text-ghibli-earth">Se for residente do Espaço Económico Europeu (EEE), tem os seguintes direitos relativamente aos seus dados pessoais:</p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Direito de Acesso:</strong> Pode solicitar cópias dos seus dados pessoais que processamos</li>
              <li><strong>Direito de Retificação:</strong> Pode solicitar correção de dados incorretos ou incompletos</li>
              <li><strong>Direito de Eliminação ("Direito ao Esquecimento"):</strong> Pode solicitar eliminação dos seus dados pessoais em certas circunstâncias</li>
              <li><strong>Direito de Restrição:</strong> Pode solicitar limitação do processamento dos seus dados</li>
              <li><strong>Direito de Portabilidade:</strong> Pode solicitar transferência dos seus dados para outro serviço</li>
              <li><strong>Direito de Oposição:</strong> Pode opor-se ao processamento baseado em interesses legítimos</li>
              <li><strong>Direito de Retirar Consentimento:</strong> Pode retirar consentimento a qualquer momento</li>
            </ul>
            <p className="mt-4 text-ghibli-earth">
              Para exercer estes direitos, contacte-nos através de <a href={`mailto:${emailContacto}`} className="text-ghibli-sky hover:underline">{emailContacto}</a>. 
              Responderemos ao seu pedido no prazo de 30 dias. Poderemos solicitar verificação de identidade antes de processar pedidos sensíveis.
            </p>
            <p className="mt-4 text-ghibli-earth">
              Tem também o direito de apresentar queixa junto da Comissão Nacional de Proteção de Dados (CNPD) ou da autoridade de proteção de dados do seu país se considerar que os seus direitos foram violados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">9. Transferências Internacionais de Dados</h2>
            <p className="text-ghibli-earth">
              Os seus dados podem ser transferidos e processados fora do seu país de residência, incluindo:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mt-4">
              <li><strong>Supabase:</strong> Servidores localizados preferencialmente na UE (região EU-West-1)</li>
              <li><strong>OpenAI:</strong> Processamento temporário de imagens nos EUA (dados eliminados após processamento)</li>
              <li><strong>Stripe:</strong> Processamento de pagamentos na UE e EUA com adequações apropriadas</li>
            </ul>
            <p className="text-ghibli-earth mt-4">
              Todas as transferências são protegidas por contratos de transferência de dados adequados e outras salvaguardas apropriadas em conformidade com o RGPD.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">10. Cookies, Analytics e Session Recordings</h2>
            <p className="text-ghibli-earth mb-4">
              Utilizamos cookies e tecnologias avançadas de analytics para melhorar significativamente o seu experiência na plataforma:
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🍪 Cookies Essenciais</h4>
                <p className="text-blue-700 text-sm">
                  <strong>Obrigatórios para funcionamento:</strong> Cookies de autenticação Supabase, estado da sessão, 
                  preferências básicas. Estes não podem ser desativados sem afetar funcionalidades core.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">📊 Analytics Comportamentais (PostHog)</h4>
                <p className="text-purple-700 text-sm mb-2">
                  <strong>O que gravamos:</strong>
            </p>
                <ul className="list-disc list-outside pl-4 text-purple-700 text-sm space-y-1">
                  <li>Cliques, hovers, scroll depth e tempo em cada página</li>
                  <li>Jornada completa: landing → upload → seleção → transformação → resultado</li>
                  <li>Padrões de abandono e pontos de atrito</li>
                  <li>Comportamento de utilização (transformações, produtos)</li>
                  <li>Device info (resolução, browser, OS) para otimização responsiva</li>
                </ul>
              </div>
              
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">🎬 Session Recordings</h4>
                <p className="text-red-700 text-sm mb-2">
                  <strong>Gravação de Sessões em Tempo Real:</strong>
                </p>
                <ul className="list-disc list-outside pl-4 text-red-700 text-sm space-y-1">
                  <li><strong>O que grava:</strong> Movimentos do rato, cliques, scrolling, navegação entre páginas</li>
                  <li><strong>Proteção automática:</strong> Passwords, emails, dados de cartão são censurados automaticamente</li>
                  <li><strong>Finalidade:</strong> Identificar bugs, otimizar UX, resolver problemas reportados</li>
                  <li><strong>Retenção:</strong> Máximo 30 dias, depois eliminadas automaticamente</li>
                  <li><strong>Anonimização:</strong> Não associamos recordings com dados pessoais identificáveis</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">✅ Base Legal e Consentimento</h4>
              <p className="text-green-700 text-sm mb-2">
                <strong>RGPD Compliance:</strong> Session recordings constituem dados pessoais. Bases legais:
              </p>
              <ul className="list-disc list-outside pl-4 text-green-700 text-sm space-y-1">
                <li><strong>Consentimento:</strong> Ao aceitar cookies/termos, consente explicitamente aos recordings</li>
                <li><strong>Interesse Legítimo:</strong> Melhoramento contínuo da plataforma e resolução de bugs</li>
                <li><strong>Execução de Contrato:</strong> Otimização do serviço contratado</li>
              </ul>
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">🔧 Como Controlar</h4>
              <p className="text-amber-700 text-sm mb-2">
                <strong>Pode desativar a qualquer momento:</strong>
              </p>
              <ul className="list-disc list-outside pl-4 text-amber-700 text-sm space-y-1">
                <li><strong>Browser:</strong> Configurações → Privacidade → Bloquear cookies de terceiros</li>
                <li><strong>PostHog Opt-out:</strong> Contacte-nos para opt-out permanente dos analytics avançados</li>
                <li><strong>Session Recordings:</strong> Pode solicitar desativação mantendo outras funcionalidades</li>
                <li><strong>Eliminação:</strong> Pode solicitar eliminação de todos os recordings existentes</li>
            </ul>
              <p className="text-amber-700 text-sm mt-2">
                <strong>Impacto:</strong> Desativar pode afetar a qualidade do suporte técnico e otimizações de UX personalizadas.
              </p>
            </div>
            
            <p className="text-ghibli-earth mt-6">
              <strong>Transparência Total:</strong> Para consultar que dados específicos recolhemos sobre si ou solicitar 
              opt-out seletivo, contacte-nos através de <a href={`mailto:${emailContacto}`} className="text-ghibli-sky hover:underline">{emailContacto}</a> 
              com o assunto "Analytics Data Request".
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">11. Eliminação de Conta e Dados</h2>
            <p className="text-ghibli-earth mb-4">
              Pode solicitar a eliminação da sua conta a qualquer momento contactando-nos. O processo de eliminação inclui:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Dados Pessoais:</strong> Eliminados permanentemente no prazo de 30 dias</li>
              <li><strong>Imagens Originais e Transformadas:</strong> Eliminadas permanentemente do nosso storage</li>
              <li><strong>Histórico de Compras:</strong> Anonimizado mas mantido para conformidade fiscal (dados desassociados da sua identidade)</li>
              <li><strong>Publicações da Comunidade:</strong> Mantidas mas desassociadas do seu perfil (aparecem como "Utilizador Eliminado")</li>
            </ul>
            <p className="text-ghibli-earth mt-4">
              <strong>Nota:</strong> A eliminação é irreversível. Certifique-se de fazer download das suas imagens transformadas antes de solicitar a eliminação.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">12. Privacidade de Menores</h2>
            <p className="text-ghibli-earth">
              O nosso Serviço destina-se a utilizadores com 18 anos ou mais. Não recolhemos intencionalmente dados pessoais de menores de 18 anos. Se for pai/mãe ou tutor e tiver conhecimento de que o seu filho nos forneceu dados pessoais, contacte-nos imediatamente. Se descobrirmos que recolhemos dados de menores sem consentimento parental verificado, tomaremos medidas para eliminar essas informações dos nossos sistemas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">13. Alterações a Esta Política de Privacidade</h2>
            <p className="text-ghibli-earth">
              Poderemos atualizar esta Política de Privacidade periodicamente para refletir mudanças no nosso Serviço ou requisitos legais. Alterações significativas serão comunicadas através de:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth mt-4">
              <li>Notificação proeminente no nosso website</li>
              <li>Email para utilizadores registados (para alterações materiais)</li>
              <li>Atualização da data de "Última Atualização" no topo desta política</li>
            </ul>
            <p className="text-ghibli-earth mt-4">
              Recomendamos que revise esta política periodicamente. O uso continuado do Serviço após alterações constitui aceitação da política revista.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">14. Contacto</h2>
            <p className="text-ghibli-earth">
              Para questões sobre esta Política de Privacidade, exercício de direitos RGPD, ou questões de proteção de dados, contacte-nos:
            </p>
            <ul className="list-disc list-outside pl-6 mt-2 space-y-1 text-ghibli-earth">
                <li><strong>Email:</strong> <a href={`mailto:${emailContacto}`} className="text-ghibli-sky hover:underline">{emailContacto}</a></li>
                <li><strong>Assunto:</strong> "Proteção de Dados - [Descrição do pedido]"</li>
                <li><strong>Tempo de Resposta:</strong> Máximo 30 dias para pedidos RGPD, 5 dias úteis para questões gerais</li>
            </ul>
            <p className="text-ghibli-earth mt-4">
              Para emergências de segurança relacionadas com os seus dados, contacte-nos imediatamente com o assunto "URGENTE - Segurança de Dados".
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PoliticaPrivacidadePage;