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
        <title>Termos e Condições de Serviço - PicTuz</title>
        <meta name="description" content="Termos e Condições de utilização do serviço PicTuz." />
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
              <li><strong>Conta:</strong> A conta pessoal criada pelo Utilizador para aceder a funcionalidades específicas do Serviço, geralmente através de autenticação Google via Supabase Auth.</li>
              <li><strong>Conteúdo do Utilizador:</strong> Refere-se a qualquer fotografia, imagem ou outro material que você carregue, submeta ou disponibilize através do Serviço.</li>
              <li><strong>Transformação:</strong> O processo pelo qual o Serviço utiliza inteligência artificial para aplicar um estilo artístico selecionado ao Conteúdo do Utilizador.</li>
              <li><strong>Imagem Transformada:</strong> A imagem resultante do processo de Transformação.</li>
              <li><strong>Estilo:</strong> Um filtro ou modelo artístico predefinido disponível no Serviço para aplicação ao Conteúdo do Utilizador.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">2. Descrição do Serviço</h2>
            <p className="text-ghibli-earth">
              O PicTuz permite aos Utilizadores carregar as suas fotografias digitais, selecionar um Estilo artístico disponível na nossa plataforma e, mediante pagamento, solicitar uma Transformação dessas fotografias utilizando algoritmos de inteligência artificial. As Imagens Transformadas ficam disponíveis para download pelo Utilizador através da sua Conta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">3. Registo e Conta de Utilizador</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Necessidade de Conta:</strong> Para utilizar a funcionalidade principal de Transformação e aceder ao seu histórico, é necessário criar uma Conta.</li>
              <li><strong>Autenticação:</strong> O registo e login são efetuados através de autenticação com conta Google, utilizando os serviços do Supabase Auth. Ao utilizar este método, autoriza-nos a aceder a informações básicas do seu perfil Google (como nome, email e foto de perfil) conforme descrito na nossa <a href={urlPoliticaPrivacidade} className="text-ghibli-sky hover:underline">Política de Privacidade</a>.</li>
              <li><strong>Segurança da Conta:</strong> Você é responsável por manter a confidencialidade das suas credenciais de acesso (através da sua conta Google) e por todas as atividades que ocorram na sua Conta. Deve notificar-nos imediatamente sobre qualquer uso não autorizado da sua Conta.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">4. Utilização Aceitável do Serviço</h2>
             <p className="mb-4 text-ghibli-earth">Concorda em utilizar o Serviço apenas para fins lícitos e de acordo com estes Termos.</p>
             <p className="mb-2 text-ghibli-earth"><strong>É estritamente proibido:</strong></p>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
                <li>Carregar ou processar Conteúdo do Utilizador que seja ilegal, difamatório, obsceno, pornográfico, ofensivo, que viole direitos de privacidade ou publicidade, ou que infrinja direitos de propriedade intelectual de terceiros.</li>
                <li>Utilizar o Serviço para qualquer fim comercial não autorizado ou para solicitar outros utilizadores.</li>
                <li>Tentar obter acesso não autorizado ao Serviço, a outras Contas, sistemas informáticos ou redes conectadas ao Serviço.</li>
                <li>Utilizar o Serviço de forma a danificar, desativar, sobrecarregar ou prejudicar o Serviço ou interferir com a utilização do Serviço por parte de terceiros.</li>
                <li>Carregar qualquer material que contenha vírus de software ou qualquer outro código informático, ficheiros ou programas concebidos para interromper, destruir ou limitar a funcionalidade de qualquer software ou hardware informático ou equipamento de telecomunicações.</li>
            </ul>
             <p className="mt-4 text-ghibli-earth"><strong>Responsabilidade pelo Conteúdo:</strong> Você declara e garante que possui todos os direitos necessários sobre o Conteúdo do Utilizador que carrega ou que tem autorização do titular dos direitos para o fazer e para nos conceder as licenças necessárias ao abrigo destes Termos.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">5. Conteúdo do Utilizador e Imagens Transformadas</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Licença para Processamento:</strong> Ao carregar Conteúdo do Utilizador para o Serviço, concede-nos uma licença mundial, não exclusiva, isenta de royalties, transferível e sublicenciável para usar, reproduzir, modificar (para fins de transformação), adaptar, exibir e distribuir esse Conteúdo do Utilizador *exclusivamente* com o propósito de operar, fornecer, melhorar e desenvolver o Serviço de Transformação para si. Esta licença termina quando o seu conteúdo é eliminado do Serviço (ou a sua conta é encerrada), exceto na medida necessária para cumprir obrigações legais ou para backups de sistema.</li>
              <li><strong>Armazenamento:</strong> Compreende e concorda que, para fornecer o Serviço (incluindo o histórico de transformações), precisamos de armazenar o seu Conteúdo do Utilizador (imagens originais carregadas) e as Imagens Transformadas nos nossos sistemas, utilizando infraestrutura segura fornecida pelo Supabase Storage. O tratamento destes dados é detalhado na nossa <a href={urlPoliticaPrivacidade} className="text-ghibli-sky hover:underline">Política de Privacidade</a>.</li>
              <li><strong>Propriedade Intelectual das Imagens Transformadas:</strong>
                <ul className="list-circle list-outside pl-6 mt-2 space-y-1">
                    <li>Você retém a propriedade dos direitos de autor do seu Conteúdo do Utilizador original.</li>
                    <li>Sujeito ao pagamento das taxas aplicáveis e ao cumprimento destes Termos, concedemos-lhe uma licença mundial, perpétua, não exclusiva e isenta de royalties para usar, copiar, modificar, exibir e distribuir as Imagens Transformadas geradas a partir do seu Conteúdo do Utilizador para fins pessoais e comerciais.</li>
                    <li><strong>Importante:</strong> A utilização de certos Estilos pode estar sujeita a direitos de terceiros (por exemplo, estilos inspirados em artistas específicos). É da sua responsabilidade garantir que a sua utilização da Imagem Transformada não infringe quaisquer direitos de terceiros. Não oferecemos garantias relativamente à singularidade das Imagens Transformadas ou à sua adequação para fins específicos (incluindo uso comercial sem risco de infração). A utilização de Imagens Transformadas para fins comerciais é feita por sua conta e risco.</li>
                </ul>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">6. Pagamentos, Taxas e Reembolsos</h2>
            <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
              <li><strong>Taxas:</strong> O acesso à funcionalidade de Transformação requer o pagamento de uma taxa por cada imagem transformada, conforme indicado na plataforma no momento da solicitação. Reservamo-nos o direito de alterar os nossos preços a qualquer momento, mediante aviso prévio publicado no Serviço ou enviado por email.</li>
              <li><strong>Processador de Pagamento:</strong> Todos os pagamentos são processados através do nosso parceiro externo, Stripe. Ao efetuar um pagamento, concorda com os termos e condições do Stripe. Não armazenamos informações completas do seu cartão de crédito nos nossos servidores.</li>
              <li><strong>Reembolsos:</strong> Devido à natureza digital e computacional do serviço, geralmente não oferecemos reembolsos após o início do processo de Transformação. No entanto, se ocorrer uma falha técnica comprovada imputável ao Serviço que impeça a conclusão ou entrega da Imagem Transformada, poderemos, à nossa discrição, oferecer um reembolso ou um crédito para uma nova transformação. Contacte o suporte para analisar a sua situação.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">7. Propriedade Intelectual do Serviço PicTuz</h2>
            <p className="text-ghibli-earth">
              O Serviço e todo o seu conteúdo original (excluindo o Conteúdo do Utilizador e as Imagens Transformadas conforme licenciado acima), características e funcionalidades são e permanecerão propriedade exclusiva de {nomeEmpresaOuSeuNome} e dos seus licenciadores. O Serviço está protegido por direitos de autor, marcas registadas e outras leis de Portugal e de países estrangeiros. As nossas marcas e imagem comercial não podem ser usadas em conexão com qualquer produto ou serviço sem o nosso consentimento prévio por escrito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">8. Disponibilidade e Limitações do Serviço</h2>
             <ul className="list-disc list-outside pl-6 space-y-2 text-ghibli-earth">
                <li>O Serviço é fornecido "TAL COMO ESTÁ" e "CONFORME DISPONÍVEL", sem garantias de qualquer tipo, expressas ou implícitas.</li>
                <li>Não garantimos que o Serviço funcionará ininterruptamente, de forma segura ou que estará disponível em qualquer momento ou local específico; que quaisquer erros ou defeitos serão corrigidos; que o Serviço está livre de vírus ou outros componentes prejudiciais; ou que os resultados da utilização do Serviço atenderão às suas expectativas.</li>
                <li>Reservamo-nos o direito de modificar, suspender ou descontinuar o Serviço (ou qualquer parte ou conteúdo do mesmo) a qualquer momento, com ou sem aviso prévio.</li>
             </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">9. Limitação de Responsabilidade</h2>
            <p className="text-ghibli-earth">
              Na máxima extensão permitida pela lei aplicável, em nenhuma circunstância {nomeEmpresaOuSeuNome}, seus diretores, funcionários, parceiros, agentes, fornecedores ou afiliados serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, perda de lucros, dados, uso, goodwill ou outras perdas intangíveis, resultantes de (i) o seu acesso ou uso ou incapacidade de aceder ou usar o Serviço; (ii) qualquer conduta ou conteúdo de terceiros no Serviço; (iii) qualquer conteúdo obtido do Serviço; e (iv) acesso não autorizado, uso ou alteração das suas transmissões ou conteúdo, seja com base em garantia, contrato, ato ilícito (incluindo negligência) ou qualquer outra teoria legal, quer tenhamos sido informados ou não da possibilidade de tais danos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">10. Indemnização</h2>
            <p className="text-ghibli-earth">
              Concorda em defender, indemnizar e isentar {nomeEmpresaOuSeuNome} e os seus licenciados e licenciadores, e os seus funcionários, contratados, agentes, diretores e administradores, de e contra todas e quaisquer reivindicações, danos, obrigações, perdas, responsabilidades, custos ou dívidas, e despesas (incluindo, mas não se limitando a, honorários de advogados), resultantes ou decorrentes de a) sua utilização e acesso ao Serviço, por si ou por qualquer pessoa que utilize a sua conta e palavra-passe; b) uma violação destes Termos, ou c) Conteúdo do Utilizador carregado para o Serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">11. Modificação dos Termos</h2>
            <p className="text-ghibli-earth">
              Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes de quaisquer novos termos entrarem em vigor. O que constitui uma alteração material será determinado a nosso exclusivo critério. Ao continuar a aceder ou usar o nosso Serviço após essas revisões entrarem em vigor, concorda em ficar vinculado pelos termos revistos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">12. Rescisão</h2>
            <p className="text-ghibli-earth">
             Podemos rescindir ou suspender a sua Conta e o acesso ao Serviço imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se violar os Termos. Após a rescisão, o seu direito de usar o Serviço cessará imediatamente. Se desejar rescindir a sua Conta, pode simplesmente deixar de usar o Serviço ou contactar-nos para solicitar a eliminação da conta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">13. Lei Aplicável e Resolução de Litígios</h2>
            <p className="text-ghibli-earth">
              Estes Termos serão regidos e interpretados de acordo com as leis de Portugal, sem consideração pelas suas disposições sobre conflitos de leis. Qualquer litígio decorrente ou relacionado com estes Termos ou com o Serviço será submetido à jurisdição exclusiva dos tribunais da Comarca de Lisboa, Portugal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-ghibli text-ghibli-wood mb-4">14. Contacto</h2>
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