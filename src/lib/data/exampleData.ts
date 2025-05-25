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
      id: "simpson",
      name: "Estilo Simpson",
      description: "Transforme suas fotos no estilo dos Simpsons, com cores vibrantes e o estilo característico da série.",
      examples: [
        { before: "/wbgnormal.jpg", after: "/wbgsimpson.png" },
        { before: "/ronaldonormal.jpg", after: "/ronaldosimpson.png" },
        { before: "/profjamnormal.jpg", after: "/profsimpson.png" },
        { before: "/barbarabandeiranormal.webp", after: "/barbarabandeirasimpson.png" },
      ]
    },
    {
      id: "ghibli",
      name: "Estilo Ghibli",
      description: "Dê às suas imagens o visual mágico dos filmes do Studio Ghibli, com cores suaves e detalhes encantadores.",
      examples: [
        { before: "/tonymickaelcarreiranormal.jpg", after: "/tonymickaelghibli.png" },
        { before: "/gyokerespotenormal.jpeg", after: "/gyopoteghibli.png" },
        { before: "/casamentonormal.jpg", after: "/casalghibli.png" },
        { before: "/caogatonormal.jpg", after: "/caogatoghibli.png" },
        { before: "/saojoaoportonormal.jpg", after: "/saojoaoportoghibli.png" }
      ]
    },
    {
      id: "azulejo",
      name: "Estilo Azulejo Português",
      description: "Transforme suas fotos no estilo tradicional dos azulejos portugueses, com padrões azuis e brancos.",
      examples: [
        { before: "/camoesnormal.jpg", after: "/camoesazulejo.png" },
        { before: "/saojoaoportonormal.jpg", after: "/saojoaoportoazulejo.png" },
        { before: "/andreventuranormal.png", after: "/andreventuraazulejo.png" },
        { before: "/pastoralentejonormal.png", after: "/pastoralentejoazulejo.png" }
      ]
    },
    {
      id: "lego",
      name: "Estilo LEGO",
      description: "Transforme suas fotos em peças LEGO, com o visual de blocos característico.",
      examples: [
        { before: "/camoesnormal.jpg", after: "/camoeslego.png" },
        { before: "/marcelonormal.jpg", after: "/MarceloLego.png" }, // Nota: imagem 'before' repetida, pode ser intencional
        { before: "/yamalnormal.webp", after: "/yamallego.png" }
      ]
    },
    {
      id: "metal",
      name: "Estilo 3D Metal",
      description: "Dê às suas fotos um visual metálico, com tons escuros e acabamento metalizado.",
      examples: [
        { before: "/wbgnormal.jpg", after: "/wbgmetal.png" },
        { before: "/ronaldoeuro.webp", after: "/ronaldometal.png" },
        { before: "/barbarabandeiranormal.webp", after: "/barbarabandeirametal.png" }
      ]
    },
    {
      id: "cartoon",
      name: "Estilo Cartoon",
      description: "Transforme suas fotos em desenhos animados coloridos e estilizados.",
      examples: [
        { before: "/barbarabandeiranormal.webp", after: "/barbarabandeiracartoon.png" },
        { before: "/wbgnormal.jpg", after: "/wbgcartoon.png" },
        { before: "/ronaldoeuro.webp", after: "/ronaldocartoon.png" },
        { before: "/pastoralentejonormal.png", after: "/pastorcartoon.png" },
        { before: "/marcelonormal.jpg", after: "/marcelocartoon.png" },
        { before: "/camoesnormal.jpg", after: "/camoescartoon.png" },
      ]
    },
    {
      id: "bandadesenhada",
      name: "Estilo Super-Herói", // Considerar "Banda Desenhada" ou "Estilo BD"
      description: "Transforme suas fotos em desenhos animados coloridos e estilizados.", // Descrição igual à de "Cartoon", pode querer diferenciar
      examples: [
        { before: "/profjamnormal.jpg", after: "/profbd.png" },
        { before: "/hermannormal.jpeg", after: "/hermanbd.png" },
        { before: "/casamentonormal.jpg", after: "/casalbd.png" },
        { before: "/mbappenormal.jpg", after: "/mbappesp.png" }
      ]
    },

    {
      id: "minecraft",
      name: "Estilo Minecraft",
      description: "Transforme suas fotos em desenhos animados coloridos e estilizados.",
      examples: [
        { before: "/yamallewa.jpg", after: "/yamallewamine.png" },
        { before: "/barbarabandeiranormal.webp", after: "/barbarabandeiraminecraft.png" },
        { before: "/wbgnormal.jpg", after: "/wbgminevdd.png" },
        { before: "/morambappenormal.webp", after: "/morambappemine.png" },
        { before: "/montenegronormal.jpg", after: "/montemine.png" }
      ],
    }
  ];
  
