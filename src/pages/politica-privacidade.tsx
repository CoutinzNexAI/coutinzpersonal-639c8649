// src/pages/politica-privacidade.tsx
import React from 'react';
import Header from '@/components/Header'; // Ajusta o caminho se necessário
import Footer from '@/components/Footer'; // Ajusta o caminho se necessário
import Head from 'next/head'; // Para definir o título da página
import Link from 'next/link'; // Para links internos

const PoliticaPrivacidadePage: React.FC = () => {
  // --- PREENCHE ESTES DADOS ---
  const nomeEmpresaOuSeuNome = "MODULA Team"; // Substitui pelo nome correto
  const urlSite = "https://doingthingsbig.net/en/"; // Confirma se este é o URL final
  const emailContacto = "suporte@modula.app"; // Substitui pelo teu email de suporte
  const dataAtualizacao = "7 de Maio de 2025"; // Atualiza a data
  const urlTermosServicos = "/termos-servicos"; // Link para a página de Termos

  return (
    <div className="flex flex-col min-h-screen bg-ghibli-paper">
      <Head>
        <title>Política de Privacidade - MODULA</title>
        <meta name="description" content="Política de Privacidade do serviço MODULA, explicando como tratamos os seus dados." />
      </Head>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm p-6 md:p-10 rounded-lg shadow-md border border-ghibli-sand/30">
          {/* Título Principal */}
          <h1 className="text-3xl md:text-4xl font-ghibli font-bold text-ghibli-wood mb-6 text-center">
            Política de Privacidade - MODULA
          </h1>
          <p className="text-sm text-center text-muted-foreground mb-8">
            Última Atualização: {dataAtualizacao}
          </p>

          {/* Introdução */}
          <p className="mb-6 text-ghibli-earth">
            Bem-vindo(a) à Política de Privacidade do MODULA. A sua privacidade é extremamente importante para nós. Este documento explica como {nomeEmpresaOuSeuNome} ("nós", "nosso") recolhe, utiliza, armazena e protege as suas informações pessoais quando utiliza o nosso serviço MODULA (o "Serviço"), acessível através de <a href={urlSite} target="_blank" rel="noopener noreferrer" className="text-ghibli-sky hover:underline">{urlSite}</a>.
          </p>
          <p className="mb-6 text-ghibli-earth">
            Ao utilizar o Serviço, concorda com a recolha e utilização de informações de acordo com esta política. Esta Política de Privacidade deve ser lida em conjunto com os nossos <Link href={urlTermosServicos} legacyBehavior><a className="text-ghibli-sky hover:underline">Termos de Serviço</a></Link>.
          </p>
          <p className="mb-8 text-ghibli-earth italic text-sm">
            **Nota Importante:** Esta política é fornecida para fins informativos. Recomendamos vivamente a consulta de um profissional legal para garantir a total conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD) e outras leis aplicáveis.
          </p>

          {/* Secções da Política */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">1. Informações que Recolhemos</h2>
            <p className="mb-4 text-ghibli-earth">Recolhemos diferentes tipos de informações para diversos fins, a fim de fornecer e melhorar o nosso Serviço para si:</p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li>
                <strong>Dados Pessoais Fornecidos por Si (Via Autenticação Google):</strong> Ao criar ou aceder à sua Conta utilizando o login Google (via Supabase Auth), podemos receber informações do seu perfil Google, tais como o seu nome, endereço de email e URL da foto de perfil. A recolha destes dados está sujeita às políticas de privacidade da Google e às suas configurações de permissão.
              </li>
              <li>
                <strong>Conteúdo do Utilizador (Imagens):</strong> Recolhemos as fotografias que você carrega ("Imagens Originais") para o Serviço com o propósito de realizar a Transformação solicitada. Também armazenamos as imagens resultantes ("Imagens Transformadas") no seu histórico de conta para que as possa visualizar e descarregar.
              </li>
              <li>
                <strong>Dados de Pagamento:</strong> Quando efetua um pagamento por uma Transformação, a transação é processada pelo nosso parceiro Stripe. Não recolhemos nem armazenamos os detalhes completos do seu cartão de crédito. O Stripe recolhe as informações necessárias para processar o pagamento de acordo com a sua própria política de privacidade. Poderemos armazenar um identificador da transação ou o ID de cliente Stripe associado à sua conta para fins de gestão e suporte.
              </li>
              <li>
                <strong>Dados de Utilização (Potencial):</strong> Poderemos recolher informações sobre como o Serviço é acedido e utilizado (por exemplo, tipos de estilos mais usados, frequência de utilização, dados de erro anónimos). Estes dados são geralmente agregados e anonimizados para nos ajudar a melhorar o Serviço. *(Nota: Se usares ferramentas de análise como Google Analytics ou Vercel Analytics, deves detalhar aqui).*
              </li>
               <li>
                <strong>Cookies e Tecnologias Semelhantes:</strong> Poderemos usar cookies essenciais (por exemplo, para manter a sua sessão de login via Supabase Auth) e outras tecnologias. Consulte a nossa secção sobre Cookies abaixo. *(Nota: Se usares cookies não essenciais, como os de análise ou marketing, precisas de um banner de consentimento de cookies e detalhar aqui).*
               </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">2. Como Utilizamos as Suas Informações</h2>
            <p className="mb-4 text-ghibli-earth">Utilizamos as informações recolhidas para diversos fins:</p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li>Para fornecer e manter o nosso Serviço (criar a sua conta, processar as transformações, apresentar o histórico).</li>
              <li>Para processar os seus pagamentos através do Stripe.</li>
              <li>Para o notificar sobre alterações ao nosso Serviço ou sobre o estado das suas transformações.</li>
              <li>Para lhe permitir participar em funcionalidades interativas do nosso Serviço, quando optar por fazê-lo.</li>
              <li>Para fornecer apoio ao cliente.</li>
              <li>Para recolher análises ou informações valiosas para que possamos melhorar o nosso Serviço (geralmente de forma agregada/anonimizada).</li>
              <li>Para monitorizar a utilização do nosso Serviço.</li>
              <li>Para detetar, prevenir e resolver problemas técnicos.</li>
              <li>Para cumprir as nossas obrigações legais.</li>
            </ul>
             <p className="mt-4 text-ghibli-earth"><strong>Especificamente sobre as Imagens:</strong> As suas Imagens Originais são usadas exclusivamente para gerar a Imagem Transformada solicitada. Não utilizamos as suas imagens para treinar os nossos modelos de IA ou para quaisquer outros fins sem o seu consentimento explícito adicional.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">3. Base Legal para o Processamento (RGPD)</h2>
            <p className="mb-4 text-ghibli-earth">Se for do Espaço Económico Europeu (EEE), a nossa base legal para recolher e usar as informações pessoais descritas nesta Política de Privacidade depende dos Dados Pessoais que recolhemos e do contexto específico em que os recolhemos:</p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li>Precisamos de executar um contrato consigo (fornecer o Serviço conforme os Termos de Serviço).</li>
              <li>Deu-nos permissão para o fazer (através da aceitação dos Termos e desta Política, e do consentimento no registo).</li>
              <li>O processamento está nos nossos interesses legítimos e não é anulado pelos seus direitos (por exemplo, para melhorar o serviço, prevenir fraudes).</li>
              <li>Para processamento de pagamentos.</li>
              <li>Para cumprir a lei.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">4. Retenção e Armazenamento de Dados</h2>
            <p className="mb-4 text-ghibli-earth">Reteremos as suas informações pessoais apenas durante o tempo necessário para os fins estabelecidos nesta Política de Privacidade.</p>
             <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
                <li>**Dados da Conta:** Mantidos enquanto a sua conta estiver ativa.</li>
                <li>**Imagens Originais:** Processadas e potencialmente armazenadas temporariamente durante a transformação. Poderão ser eliminadas após um curto período, exceto se necessário para resolução de problemas. *(Clarificar a política exata de retenção)*.</li>
                <li>**Imagens Transformadas:** Armazenadas no seu histórico de conta para seu acesso. Permanecerão disponíveis enquanto a sua conta estiver ativa, a menos que opte por eliminá-las (se essa funcionalidade existir) ou solicite a eliminação da sua conta.</li>
                <li>**Dados de Pagamento:** Identificadores de transação podem ser retidos para fins fiscais e de contabilidade, conforme exigido por lei.</li>
             </ul>
            <p className="mt-4 text-ghibli-earth">As suas informações, incluindo Dados Pessoais e Imagens, são armazenadas de forma segura utilizando os serviços do Supabase (Auth e Storage), que implementa medidas de segurança robustas. Os servidores podem estar localizados fora do seu país de residência; ao usar o Serviço, consente essa transferência.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">5. Partilha e Divulgação de Dados</h2>
            <p className="mb-4 text-ghibli-earth">Não vendemos as suas informações pessoais. Poderemos partilhar as suas informações nas seguintes situações:</p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li>**Prestadores de Serviços:** Poderemos empregar empresas e indivíduos terceiros para facilitar o nosso Serviço ("Prestadores de Serviços"), para fornecer o Serviço em nosso nome, para executar serviços relacionados com o Serviço ou para nos ajudar a analisar como o nosso Serviço é utilizado. Estes terceiros incluem:
                <ul>
                    <li>**Supabase:** Para autenticação, base de dados e armazenamento de imagens.</li>
                    <li>**Stripe:** Para processamento de pagamentos.</li>
                    <li>**OpenAI (ou outro fornecedor de IA):** Para realizar a transformação das imagens. A imagem original é enviada para a API da IA para processamento.</li>
                    {/* Adicionar outros, como Vercel (hospedagem), serviços de email, análise, etc. */}
                </ul>
                 Estes terceiros têm acesso às suas informações pessoais apenas para realizar estas tarefas em nosso nome e são obrigados a não as divulgar ou usar para qualquer outro fim.
              </li>
              <li>**Requisitos Legais:** Poderemos divulgar as suas informações se acreditarmos de boa fé que tal ação é necessária para: cumprir uma obrigação legal, proteger e defender os nossos direitos ou propriedade, prevenir ou investigar possíveis irregularidades relacionadas com o Serviço, proteger a segurança pessoal dos utilizadores do Serviço ou do público, ou proteger contra responsabilidade legal.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">6. Segurança dos Dados</h2>
            <p className="text-ghibli-earth">
              A segurança dos seus dados é importante para nós, mas lembre-se que nenhum método de transmissão pela Internet ou método de armazenamento eletrónico é 100% seguro. Utilizamos medidas de segurança comercialmente aceitáveis (incluindo as fornecidas pelos nossos parceiros como Supabase e Stripe) para proteger as suas informações pessoais, mas não podemos garantir a sua segurança absoluta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">7. Os Seus Direitos de Proteção de Dados (RGPD)</h2>
            <p className="mb-4 text-ghibli-earth">Se for residente do Espaço Económico Europeu (EEE), tem certos direitos de proteção de dados:</p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li>O direito de aceder, atualizar ou eliminar as informações que temos sobre si.</li>
              <li>O direito de retificação.</li>
              <li>O direito de oposição.</li>
              <li>O direito de restrição.</li>
              <li>O direito à portabilidade dos dados.</li>
              <li>O direito de retirar o consentimento.</li>
            </ul>
            <p className="mt-4 text-ghibli-earth">Pode exercer alguns destes direitos através das definições da sua conta (se disponível). Para outros pedidos ou se tiver dificuldades, por favor contacte-nos através de <a href={`mailto:${emailContacto}`} className="text-ghibli-sky hover:underline">{emailContacto}</a>. Poderemos pedir-lhe que verifique a sua identidade antes de responder a tais pedidos.</p>
            <p className="mt-4 text-ghibli-earth">Tem o direito de apresentar uma queixa a uma Autoridade de Proteção de Dados sobre a nossa recolha e utilização dos seus Dados Pessoais. Para mais informações, por favor contacte a sua autoridade local de proteção de dados no EEE.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">8. Cookies</h2>
            <p className="text-ghibli-earth">
              Utilizamos cookies essenciais para o funcionamento do Serviço, como os necessários para manter a sua sessão de autenticação (geridos pelo Supabase Auth). Não utilizamos cookies de rastreamento ou publicidade de terceiros sem o seu consentimento explícito. *(Nota: Ajustar esta secção se usar cookies de análise ou outros não essenciais. Nesse caso, precisa de um banner de consentimento e uma política de cookies mais detalhada).*
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">9. Privacidade Infantil</h2>
            <p className="text-ghibli-earth">
              O nosso Serviço não se destina a menores de 18 anos ("Crianças"). Não recolhemos intencionalmente informações de identificação pessoal de menores de 18 anos. Se for pai/mãe ou tutor e tiver conhecimento de que a sua Criança nos forneceu Dados Pessoais, por favor contacte-nos. Se tomarmos conhecimento de que recolhemos Dados Pessoais de crianças sem verificação do consentimento parental, tomaremos medidas para remover essas informações dos nossos servidores. *(Nota: Verificar a idade mínima aplicável em Portugal/UE).*
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">10. Alterações a Esta Política de Privacidade</h2>
            <p className="text-ghibli-earth">
              Poderemos atualizar a nossa Política de Privacidade periodicamente. Notificá-lo-emos de quaisquer alterações publicando a nova Política de Privacidade nesta página e atualizando a data de "Última Atualização" no topo. Aconselhamos a rever esta Política de Privacidade periodicamente para quaisquer alterações. As alterações a esta Política de Privacidade entram em vigor quando são publicadas nesta página.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">11. Contacte-nos</h2>
            <p className="text-ghibli-earth">
              Se tiver alguma dúvida sobre esta Política de Privacidade, por favor contacte-nos:
            </p>
            <ul className="list-disc list-outside pl-6 mt-2 space-y-1 text-ghibli-earth">
                <li>Por email: <a href={`mailto:${emailContacto}`} className="text-ghibli-sky hover:underline">{emailContacto}</a></li>
                {/* Adicionar outros métodos de contacto se aplicável */}
            </ul>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PoliticaPrivacidadePage;