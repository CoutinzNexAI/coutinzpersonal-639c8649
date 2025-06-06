// src/lib/data/exampleData.ts

/**
 * Interface para definir a estrutura de um exemplo de estilo.
 * Cada estilo pode ter múltiplos pares de imagens "antes" e "depois".
 */
export interface StyleExample {
    id: string; // Identificador único para o estilo (ex: "simpson", "ghibli")
    name: string; // Nome do estilo para exibição (ex: "Estilo Simpson")
    description: string; // Descrição do estilo
    examples: {
      before: string; // Caminho para a imagem "antes" (original)
      after: string;  // Caminho para a imagem "depois" (transformada)
    }[]; // Array de exemplos de imagens
  }
  
  /**
   * Array com os dados dos exemplos de estilos para serem exibidos no modal.
   * As imagens devem estar localizadas na pasta `public`.
   */
  export const STYLE_EXAMPLES_DATA: StyleExample[] = [
    {
      id: "imperador",
      name: "Estilo Imperador",
      description: "Transforme-se no Imperador, inspirado no século XVI!",
      examples: [
        { before: "/foto/barbarabandeiranormal.webp", after: "/imperador/barbara.png" },
        { before: "/foto/gyokeresnormal.jpg", after: "/imperador/gyokers.png" },
        { before: "/foto/neves.png", after: "/imperador/joaoneves.png" },
        { before: "/foto/madalenaaragao.png", after: "/imperador/madalena.png" },
        { before: "/foto/marcelonormal.jpg", after: "/imperador/marcelo.png" },
        { before: "/foto/ronaldonormal.jpg", after: "/imperador/ronaldo.png" },
      ]
    },
    {
      id: "simpson",
      name: "Estilo Simpson",
      description: "Transforme suas fotos no estilo dos Simpsons, com cores vibrantes e o estilo característico da série.",
      examples: [
        { before: "/foto/wbgnormal.jpg", after: "/simpson/wbgsimpson.png" },
        { before: "/foto/joaomadalena.webp", after: "/simpson/joaomadalena.png" },
        { before: "/foto/profjamnormal.jpg", after: "/simpson/profsimpson.png" },
        { before: "/foto/barbarabandeiranormal.webp", after: "/simpson/barbarabandeirasimpson.png" },
        { before: "/foto/mbappe.jpg", after: "/simpson/mbappesimpson.png" },
        { before: "/foto/morambappenormal.webp", after: "/simpson/morasimpson.png" },
      ]
    },
    {
      id: "ghibli",
      name: "Estilo Ghibli",
      description: "Dê às suas imagens o visual mágico dos filmes do Studio Ghibli, com cores suaves e detalhes encantadores.",
      examples: [
        { before: "/foto/tonymickaelcarreiranormal.jpg", after: "/ghibli/tonymickaelghibli.png" },
        { before: "/foto/gyokerespotenormal.jpeg", after: "/ghibli/gyopoteghibli.png" },
        { before: "/foto/casamentonormal.jpg", after: "/ghibli/casalghibli.png" },
        { before: "/foto/caogatonormal.jpg", after: "/ghibli/caogatoghibli.png" },
        { before: "/foto/saojoaoportonormal.jpg", after: "/ghibli/saojoaoportoghibli.png" },
        { before: "/foto/joaomadalena.webp", after: "/ghibli/joaomadalena.png" },

      ]
    },
    {
      id: "azulejo",
      name: "Estilo Azulejo Português",
      description: "Transforme suas fotos no estilo tradicional dos azulejos portugueses, com padrões azuis e brancos.",
      examples: [
        { before: "/foto/camoesnormal.jpg", after: "/azulejo/camoesazulejo.png" },
        { before: "/foto/saojoaoportonormal.jpg", after: "/azulejo/saojoaoportoazulejo.png" },
        { before: "/foto/andreventuranormal.png", after: "/azulejo/andreventuraazulejo.png" },
        { before: "/foto/pastoralentejonormal.png", after: "/azulejo/pastoralentejoazulejo.png" },
        { before: "/foto/badbuny.jpg", after: "/azulejo/badbunny.png" },
        { before: "/foto/yamalnormal.webp", after: "/azulejo/yamalazulejo.png" },
      ]
    },
    {
      id: "lego",
      name: "Estilo LEGO",
      description: "Transforme suas fotos em peças LEGO, com o visual de blocos característico.",
      examples: [
        { before: "/foto/badbuny.jpg", after: "/lego/badbunny.png" },
        { before: "/foto/joaomadalena.webp", after: "/lego/madalenajoao.png" },
        { before: "/foto/camoesnormal.jpg", after: "/lego/camoeslego.png" },
        { before: "/foto/marcelonormal.jpg", after: "/lego/MarceloLego.png" }, // Nota: imagem 'before' repetida, pode ser intencional
        { before: "/foto/yamalnormal.webp", after: "/lego/yamallego.png" },
        { before: "/foto/neves.png", after: "/lego/joaoneves.png" },
      ]
    },
    {
      id: "Rei Portugal",
      name: "Estilo Rei Portugal",
      description: "Transforme-se no Rei Portugal, inspirado no século XVI!",
      examples: [
        { before: "/foto/madalenaaragao.png", after: "/reiportugal/madalena.png" },
        { before: "/foto/marcelonormal.jpg", after: "/reiportugal/marcelo.png" },
        { before: "/foto/montenegronormal.jpg", after: "/reiportugal/monte.png" },
        { before: "/foto/yamalnormal.webp", after: "/reiportugal/yamal.png" },
        { before: "/foto/badbuny.jpg", after: "/reiportugal/badbunny.png" },
        { before: "/foto/barbarabandeiranormal.webp", after: "/reiportugal/barbarainha.png" },
      ],
    },
    {
      id: "cartoon",
      name: "Estilo Cartoon",
      description: "Transforme suas fotos em desenhos animados coloridos e estilizados.",
      examples: [
        { before: "/foto/barbarabandeiranormal.webp", after: "/cartoon/barbarabandeiracartoon.png" },
        { before: "/foto/wbgnormal.jpg", after: "/cartoon/wbgcartoon.png" },
        { before: "/foto/ronaldoeuro.webp", after: "/cartoon/ronaldocartoon.png" },
        { before: "/foto/pastoralentejonormal.png", after: "/cartoon/pastorcartoon.png" },
        { before: "/foto/marcelonormal.jpg", after: "/cartoon/marcelocartoon.png" },
        { before: "/foto/camoesnormal.jpg", after: "/cartoon/camoescartoon.png" },
      ]
    },
    {
      id: "bandadesenhada",
      name: "Estilo Super-Herói", // Considerar "Banda Desenhada" ou "Estilo BD"
      description: "Transforme suas fotos em desenhos animados coloridos e estilizados.", // Descrição igual à de "Cartoon", pode querer diferenciar
      examples: [
        { before: "/foto/profjamnormal.jpg", after: "/sp/profbd.png" },
        { before: "/foto/hermannormal.jpeg", after: "/sp/hermanbd.png" },
        { before: "/foto/casamentonormal.jpg", after: "/sp/casalbd.png" },
        { before: "/foto/mbappe.jpg", after: "/sp/mbappe.png" },
        { before: "/foto/badbuny.jpg", after: "/sp/badbunny.png" },
        { before: "/foto/barbarabandeiranormal.webp", after: "/sp/barbarabandeirabd.png" },
      ]
    },

    {
      id: "minecraft",
      name: "Estilo Minecraft",
      description: "Transforme suas fotos em desenhos animados coloridos e estilizados.",
      examples: [
        { before: "/foto/yamallewa.jpg", after: "/minecraft/yamallewamine.png" },
        { before: "/foto/barbarabandeiranormal.webp", after: "/minecraft/barbarabandeiraminecraft.png" },
        { before: "/foto/wbgnormal.jpg", after: "/minecraft/wbgminevdd.png" },
        { before: "/foto/morambappenormal.webp", after: "/minecraft/moramine1.png" },
        { before: "/foto/montenegronormal.jpg", after: "/minecraft/montemine.png" },
        { before: "/foto/caogatonormal.jpg", after: "/minecraft/caogato.png" },
      ],
    },
    {
      id: "GTAV",
      name: "Estilo GTAV",
      description: "Transforme-se numa personagem do GTA V!",
      examples: [
        { before: "/foto/badbuny.jpg", after: "/GTA/badbunny.png" },
        { before: "/foto/barbarabandeiranormal.webp", after: "/GTA/barbarabandeira.png" },
        { before: "/foto/travis.webp", after: "/GTA/travis.png" },
        { before: "/foto/osprimos.jpg", after: "/GTA/primos.png" },
      ],
    },
    {
      id: "Deus Grego",
      name: "Estilo Deus Grego",
      description: "Transforme-se num Deus Grego!",
      examples: [
        { before: "/foto/badbuny.jpg", after: "/deusgrego/badbunny.png" },
        { before: "/foto/madalenaaragao.png", after: "/deusgrego/madalena.png" },
        { before: "/foto/montenegronormal.jpg", after: "/deusgrego/mike.png" },
        { before: "/foto/yamalnormal.webp", after: "/deusgrego/neves.png" },
        { before: "/foto/ronaldoeuro.webp", after: "/deusgrego/ronaldotaca.png" },
      ],
    },
  ];
  
