/**
 * Gera uma URL de imagem de texto usando um serviço externo simples
 * @param text - O texto a ser renderizado
 * @returns Promise<string> - URL da imagem gerada
 */
export async function generateImageFromText(text: string): Promise<string> {
  try {
    // Para simplificar, vamos criar uma imagem de texto usando um serviço online
    // ou retornar um placeholder transparente por enquanto
    
    // Codificar o texto para URL
    const encodedText = encodeURIComponent(text);
    
    // Usar um serviço de geração de imagem de texto (placeholder)
    // Em produção, poderia usar serviços como:
    // - https://via.placeholder.com/1500x200/FFFFFF/000000?text=${encodedText}
    // - Implementação com Sharp ou Canvas no servidor
    
    // Por enquanto, retornar um placeholder ou usar os IDs mapeados
    const phraseImageMapping: Record<string, string> = {
      'PicTuz - since 2025': '68548af2cc947707f0ee650f',
      'Criado com IA': '68548af3cc947707f0ee651a',
      'Arte Personalizada': '68548af4cc947707f0ee652b',
      'Feito em Portugal': '68548af5cc947707f0ee653c',
    };
    
    // Se o texto estiver no mapeamento, retornar o ID
    if (phraseImageMapping[text]) {
      return phraseImageMapping[text];
    }
    
    // Fallback para imagem transparente
    return '68548b05a7a3520a5d3534c0'; // ID da imagem transparente
    
  } catch (error) {
    console.error('Erro ao gerar imagem de texto:', error);
    throw new Error(`Failed to generate text image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Função simplificada para gerar imagem de frase para sweats
 * @param phraseText - Texto da frase
 * @returns Promise<string> - ID da imagem na Printify
 */
export async function generatePhraseImage(text: string): Promise<string> {
  try {
    // Mapeamento de frases para IDs de imagem da Printify
    const phraseToImageId: { [key: string]: string } = {
      'É apenas uma fase, mãe': '65a20850d3c0ea00080e8ac7',
      'Não gosto de Domingo': '65a20850d3c0ea00080e8ac8',
      'Dormir é para os fracos': '65a20850d3c0ea00080e8ac9',
      'Café primeiro, questões depois': '65a20850d3c0ea00080e8aca',
      'Sem frase': 'transparent'
    };

    if (phraseToImageId[text]) {
      return phraseToImageId[text];
    }
    
    // Se não encontrar mapeamento, usar imagem transparente
    return 'transparent';
  } catch (error) {
    console.error('Erro ao gerar imagem de texto:', error);
    return 'transparent';
  }
} 