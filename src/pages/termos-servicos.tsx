// src/pages/termos-servicos.tsx
import React from 'react';
import Header from '@/components/Header'; // Ajusta o caminho se necessário
import Footer from '@/components/Footer'; // Ajusta o caminho se necessário
import Head from 'next/head'; // Para definir o título da página

const TermosServicosPage: React.FC = () => {
  // --- PREENCHE ESTES DADOS ---
  const nomeEmpresaOuSeuNome = "PicTuz Team"; // Substitui pelo nome correto
  const urlSite = "https://pictuz.com"; // Confirma se este é o URL final
  const emailContacto = "pictuzinfo@gmail.com"; // Substitui pelo teu email de suporte
  const dataAtualizacao = "14 de Maio de 2025"; // Atualiza a data
  const urlPoliticaPrivacidade = "/politica-privacidade"; // Link para a página da Política de Privacidade

  return (
    <div className="flex flex-col min-h-screen bg-ghibli-paper">
      <Head>
        <title>Termos e Condições de Serviço - Regras de Utilização | Pictuz</title>
        <meta name="description" content="Termos e Condições de utilização do Pictuz. Conheça as regras, direitos e deveres para usar nossa plataforma de transformação de fotos com AI." />
        <meta name="keywords" content="termos serviço, condições utilização, regras AI fotos, termos Pictuz, direitos utilizador" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Termos e Condições de Serviço - Pictuz" />
        <meta property="og:description" content="Regras e condições para utilização da plataforma Pictuz de transformação de fotos com AI" />
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
          {/* Usar classes para estilizar títulos e parágrafos */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">1. Definições</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Serviço:</strong> Refere-se à aplicação web PicTuz, acessível em <a href={urlSite} target="_blank" rel="noopener noreferrer" className="text-ghibli-sky hover:underline">{urlSite}</a>, incluindo todas as suas funcionalidades, ferramentas, conteúdos e APIs.</li>
              <li><strong>Utilizador ("você"):</strong> Qualquer pessoa singular ou coletiva que aceda ou utilize o Serviço.</li>
              <li><strong>Conta:</strong> A conta pessoal criada pelo Utilizador através de autenticação Google via Supabase Auth para aceder às funcionalidades do Serviço.</li>
              <li><strong>Conteúdo do Utilizador:</strong> Refere-se a qualquer fotografia, imagem ou outro material que carregue, submeta ou disponibilize através do Serviço.</li>
              <li><strong>Transformação:</strong> O processo pelo qual o Serviço utiliza inteligência artificial (OpenAI API) para aplicar um estilo artístico selecionado ao Conteúdo do Utilizador.</li>
              <li><strong>Imagem Transformada:</strong> A imagem resultante do processo de Transformação, armazenada permanentemente no seu histórico.</li>
              <li><strong>Estilo:</strong> Um filtro ou modelo artístico predefinido disponível no Serviço para aplicação ao Conteúdo do Utilizador.</li>
              <li><strong>PicCoins:</strong> A moeda virtual interna do Serviço, utilizada para pagar transformações de imagem (1 PicCoin = 1 transformação).</li>
              <li><strong>Comunidade:</strong> A funcionalidade opcional que permite aos utilizadores partilhar publicamente as suas transformações com outros membros da comunidade PicTuz.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">2. Descrição do Serviço</h2>
            <p className="text-ghibli-earth">
              O PicTuz é uma plataforma de transformação de imagens que permite aos utilizadores carregar fotografias digitais, selecionar um estilo artístico predefinido e, mediante pagamento em PicCoins, solicitar uma transformação dessas fotografias utilizando algoritmos de inteligência artificial da OpenAI. As transformações são processadas na nuvem e as Imagens Transformadas ficam disponíveis permanentemente no histórico da Conta do utilizador. O Serviço inclui também funcionalidades de comunidade para partilha opcional de criações.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">3. Registo e Conta de Utilizador</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Necessidade de Conta:</strong> Para utilizar as funcionalidades de transformação, histórico e comunidade, é necessário criar uma Conta através de autenticação Google.</li>
              <li><strong>Autenticação Obrigatória:</strong> O registo e login são exclusivamente efetuados através de autenticação com conta Google, utilizando os serviços do Supabase Auth. Ao utilizar este método, autoriza-nos a aceder às informações básicas do seu perfil Google (nome, email e foto de perfil) conforme descrito na nossa <a href={urlPoliticaPrivacidade} className="text-ghibli-sky hover:underline">Política de Privacidade</a>.</li>
              <li><strong>Bónus de Boas-vindas:</strong> Novos utilizadores recebem automaticamente 2 PicCoins gratuitos como bónus de boas-vindas para experimentar o Serviço.</li>
              <li><strong>Segurança da Conta:</strong> Você é responsável por manter a confidencialidade das suas credenciais de acesso Google e por todas as atividades que ocorram na sua Conta. Deve notificar-nos imediatamente sobre qualquer uso não autorizado da sua Conta.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">4. Sistema PicCoins</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Moeda Virtual:</strong> PicCoins são a moeda virtual exclusiva do Serviço, utilizada para pagar transformações de imagem. Cada transformação custa 1 PicCoin.</li>
              <li><strong>Aquisição:</strong> PicCoins podem ser adquiridos através do sistema de pagamento Stripe em vários pacotes com preços e quantidades diferentes.</li>
              <li><strong>Ganhar PicCoins:</strong> Pode ganhar PicCoins adicionais através de:
                <ul className="list-circle list-outside pl-6 mt-2 space-y-1">
                  <li>Bónus de boas-vindas (2 PicCoins para novos utilizadores)</li>
                  <li>Publicação semanal na comunidade (máximo 1 PicCoin por semana)</li>
                  <li>Promoções especiais ocasionais</li>
                </ul>
              </li>
              <li><strong>Não Reembolsáveis:</strong> PicCoins são virtuais e não têm valor monetário real. Não são reembolsáveis nem transferíveis para dinheiro real.</li>
              <li><strong>Validade:</strong> PicCoins não expiram enquanto a sua Conta estiver ativa.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">5. Utilização Aceitável do Serviço</h2>
             <p className="mb-4 text-ghibli-earth">Concorda em utilizar o Serviço apenas para fins lícitos e de acordo com estes Termos.</p>
             <p className="mb-2 text-ghibli-earth"><strong>É estritamente proibido:</strong></p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
                <li>Carregar Conteúdo que seja ilegal, difamatório, obsceno, pornográfico, ofensivo, que viole direitos de privacidade ou que infrinja direitos de propriedade intelectual de terceiros.</li>
                <li>Utilizar o Serviço para qualquer fim comercial não autorizado ou para criar conteúdo com intenção de prejudicar terceiros.</li>
                <li>Tentar obter acesso não autorizado ao Serviço, sistemas informáticos ou redes conectadas ao Serviço.</li>
                <li>Utilizar o Serviço de forma a danificar, desativar, sobrecarregar ou prejudicar o Serviço ou interferir com outros utilizadores.</li>
                <li>Carregar material que contenha vírus, malware ou qualquer código malicioso.</li>
                <li>Criar múltiplas contas para contornar limitações ou obter bónus adicionais indevidamente.</li>
                <li>Abuso do sistema de comunidade através de spam, conteúdo repetitivo ou interações artificiais.</li>
            </ul>
             <p className="mt-4 text-ghibli-earth"><strong>Responsabilidade pelo Conteúdo:</strong> Declara e garante que possui todos os direitos necessários sobre o Conteúdo que carrega ou que tem autorização do titular dos direitos para o fazer. É totalmente responsável pelo conteúdo que submete ao Serviço.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">6. Conteúdo do Utilizador e Imagens Transformadas</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Licença para Processamento:</strong> Ao carregar Conteúdo para o Serviço, concede-nos uma licença limitada, não exclusiva e temporária para processar, armazenar e transformar esse Conteúdo exclusivamente para fornecer o Serviço contratado. Esta licença inclui o direito de enviar o conteúdo para a OpenAI API para processamento.</li>
              <li><strong>Armazenamento Permanente:</strong> As suas imagens originais e transformadas são armazenadas permanentemente no Supabase Storage para permitir acesso ao histórico e suporte técnico. Este armazenamento faz parte do valor do serviço prestado.</li>
              <li><strong>Propriedade e Licenciamento das Imagens Transformadas:</strong>
                <ul className="list-circle list-outside pl-6 mt-2 space-y-1">
                    <li>Você retém a propriedade dos direitos sobre o seu Conteúdo original.</li>
                    <li>Sujeito ao pagamento das taxas aplicáveis (via PicCoins) e ao cumprimento destes Termos, obtém uma licença perpétua, não exclusiva e mundial para usar as Imagens Transformadas para fins pessoais e comerciais.</li>
                    <li><strong>Limitação de Responsabilidade:</strong> A utilização de certas transformações pode estar sujeita a direitos de terceiros. É da sua responsabilidade garantir que a utilização comercial das Imagens Transformadas não infringe direitos de terceiros. Não oferecemos garantias de singularidade das Imagens Transformadas.</li>
                </ul>
              </li>
              <li><strong>Funcionalidades da Comunidade:</strong> Ao optar por publicar transformações na comunidade, concede aos outros utilizadores o direito de visualizar e interagir com esse conteúdo através do sistema de likes e comentários. As publicações da comunidade podem permanecer visíveis mesmo após a eliminação da sua conta, mas serão desassociadas do seu perfil.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">7. Pagamentos, PicCoins e Reembolsos</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Sistema de Pagamento:</strong> O acesso às funcionalidades de transformação requer PicCoins, que são adquiridos através de pagamentos processados pelo Stripe. Os preços estão claramente indicados na plataforma e podem ser alterados mediante aviso prévio.</li>
              <li><strong>Processador de Pagamento:</strong> Todos os pagamentos são processados através do Stripe. Ao efetuar um pagamento, aceita os termos e condições do Stripe. Não armazenamos informações completas do cartão de crédito nos nossos servidores.</li>
              <li><strong>Política de Reembolsos:</strong> 
                <ul className="list-circle list-outside pl-6 mt-2 space-y-1">
                  <li>PicCoins são virtuais e não reembolsáveis após a compra bem-sucedida.</li>
                  <li>Se uma transformação falhar devido a problemas técnicos do nosso lado, o PicCoin será devolvido automaticamente à sua conta.</li>
                  <li>Em caso de problemas técnicos comprovados que impeçam o uso do Serviço, poderemos oferecer créditos adicionais à nossa discrição.</li>
                  <li>Problemas relacionados com pagamentos devem ser reportados em 30 dias.</li>
                </ul>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">8. Propriedade Intelectual do Serviço PicTuz</h2>
            <p className="text-ghibli-earth">
              O Serviço e todo o seu conteúdo original (excluindo o Conteúdo do Utilizador e as Imagens Transformadas conforme licenciado acima), características e funcionalidades são e permanecerão propriedade exclusiva de {nomeEmpresaOuSeuNome} e dos seus licenciadores. O Serviço está protegido por direitos de autor, marcas registadas e outras leis de Portugal e de países estrangeiros. As nossas marcas e imagem comercial não podem ser usadas em conexão com qualquer produto ou serviço sem o nosso consentimento prévio por escrito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">9. Disponibilidade e Limitações do Serviço</h2>
             <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
                <li>O Serviço é fornecido "TAL COMO ESTÁ" e "CONFORME DISPONÍVEL", sem garantias de qualquer tipo, expressas ou implícitas.</li>
                <li>Não garantimos que o Serviço funcionará ininterruptamente, de forma segura ou que estará disponível em qualquer momento ou local específico; que quaisquer erros ou defeitos serão corrigidos; que o Serviço está livre de vírus ou outros componentes prejudiciais; ou que os resultados da utilização do Serviço atenderão às suas expectativas.</li>
                <li>Reservamo-nos o direito de modificar, suspender ou descontinuar o Serviço (ou qualquer parte ou conteúdo do mesmo) a qualquer momento, com ou sem aviso prévio.</li>
             </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">10. Limitação de Responsabilidade</h2>
            <p className="text-ghibli-earth">
              Na máxima extensão permitida pela lei aplicável, em nenhuma circunstância {nomeEmpresaOuSeuNome}, seus diretores, funcionários, parceiros, agentes, fornecedores ou afiliados serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, perda de lucros, dados, uso, goodwill ou outras perdas intangíveis, resultantes de (i) o seu acesso ou uso ou incapacidade de aceder ou usar o Serviço; (ii) qualquer conduta ou conteúdo de terceiros no Serviço; (iii) qualquer conteúdo obtido do Serviço; e (iv) acesso não autorizado, uso ou alteração das suas transmissões ou conteúdo, seja com base em garantia, contrato, ato ilícito (incluindo negligência) ou qualquer outra teoria legal, quer tenhamos sido informados ou não da possibilidade de tais danos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">11. Indemnização</h2>
            <p className="text-ghibli-earth">
              Concorda em defender, indemnizar e isentar {nomeEmpresaOuSeuNome} e os seus licenciados e licenciadores, e os seus funcionários, contratados, agentes, diretores e administradores, de e contra todas e quaisquer reivindicações, danos, obrigações, perdas, responsabilidades, custos ou dívidas, e despesas (incluindo, mas não se limitando a, honorários de advogados), resultantes ou decorrentes de a) sua utilização e acesso ao Serviço, por si ou por qualquer pessoa que utilize a sua conta e palavra-passe; b) uma violação destes Termos, ou c) Conteúdo do Utilizador carregado para o Serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">12. Modificação dos Termos</h2>
            <p className="text-ghibli-earth">
              Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes de quaisquer novos termos entrarem em vigor. O que constitui uma alteração material será determinado a nosso exclusivo critério. Ao continuar a aceder ou usar o nosso Serviço após essas revisões entrarem em vigor, concorda em ficar vinculado pelos termos revistos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">13. Rescisão</h2>
            <p className="text-ghibli-earth">
             Podemos rescindir ou suspender a sua Conta e o acesso ao Serviço imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se violar os Termos. Após a rescisão, o seu direito de usar o Serviço cessará imediatamente. Se desejar rescindir a sua Conta, pode simplesmente deixar de usar o Serviço ou contactar-nos para solicitar a eliminação da conta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">14. Lei Aplicável e Resolução de Litígios</h2>
            <p className="text-ghibli-earth">
              Estes Termos serão regidos e interpretados de acordo com as leis de Portugal, sem consideração pelas suas disposições sobre conflitos de leis. Qualquer litígio decorrente ou relacionado com estes Termos ou com o Serviço será submetido à jurisdição exclusiva dos tribunais da Comarca de Lisboa, Portugal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">15. Contacto</h2>
            <p className="text-ghibli-earth">
              Se tiver alguma dúvida sobre estes Termos, por favor contacte-nos através do email: <a href={`mailto:${emailContacto}`} className="text-ghibli-sky hover:underline">{emailContacto}</a>
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermosServicosPage;