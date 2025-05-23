import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/sonner'; // Assumindo que está corretamente configurado

// Definindo tipos
export interface UploadedFile {
  file: File;
  preview: string;
}

// Constantes para validação
export const ALLOWED_FILE_TYPES_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Função para ler os primeiros bytes de um ficheiro como string hexadecimal
const getFileHeaderHex = (file: File, bytesToRead: number = 12): Promise<string> => { // Alterado aqui: bytesToRead default é 12
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result && reader.result instanceof ArrayBuffer) {
        const arr = new Uint8Array(reader.result).subarray(0, bytesToRead);
        const header = Array.from(arr)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        resolve(header);
      } else {
        reject(new Error('Falha ao ler o cabeçalho do ficheiro.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o ficheiro.'));
    reader.readAsArrayBuffer(file.slice(0, bytesToRead)); // slice(0, bytesToRead) é importante
  });
};

// Função para detectar tipo de imagem pelo conteúdo (header)
const detectImageTypeFromHeader = (headerHex: string): string | null => {
  // JPEG: ffd8ff
  if (headerHex.startsWith('ffd8ff')) {
    return 'image/jpeg';
  }
  
  // PNG: 89504e47
  if (headerHex.startsWith('89504e47')) {
    return 'image/png';
  }
  
  // WebP: RIFF no início (52494646) + WEBP no offset 8 (57454250)
  if (headerHex.startsWith('52494646') && headerHex.length >= 24) {
    const webpSignature = headerHex.substring(16, 24); // bytes 8-11
    if (webpSignature === '57454250') {
      return 'image/webp';
    }
  }
  
  return null;
};

// Função para validar a assinatura do ficheiro (ATUALIZADA - mais permissiva)
const isValidFileSignature = (headerHex: string, browserMimeType: string): boolean => {
  // Detecta o tipo real pelo conteúdo do ficheiro
  const actualImageType = detectImageTypeFromHeader(headerHex);
  
  if (!actualImageType) {
    console.warn(`[isValidFileSignature] Nenhum tipo de imagem válido detectado. Header: ${headerHex.substring(0, 16)}`);
    return false;
  }
  
  // Verifica se o tipo detectado é permitido
  if (!ALLOWED_FILE_TYPES_MIME.includes(actualImageType)) {
    console.warn(`[isValidFileSignature] Tipo detectado não permitido: ${actualImageType}`);
    return false;
  }
  
  // ✅ NOVA ABORDAGEM: Aceita se o conteúdo é uma imagem válida
  // Não importa se a extensão não coincide com o MIME type do browser
  console.log(`[isValidFileSignature] ✅ Imagem válida detectada: ${actualImageType} (browser MIME: ${browserMimeType})`);
  return true;
};


export function useImageUpload() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false); // Novo estado para verificação

  // Formatar tamanho do arquivo para exibição
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Validar arquivo (agora assíncrono devido à leitura do cabeçalho)
  const validateFile = useCallback(async (file: File): Promise<string | null> => {
    if (!ALLOWED_FILE_TYPES_MIME.includes(file.type)) {
      return 'Tipo de ficheiro inválido. Apenas JPG, PNG, ou WEBP são aceites.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `Ficheiro muito grande. O tamanho máximo é ${formatFileSize(MAX_FILE_SIZE)}.`;
    }

    // Validação por Magic Numbers
    try {
      const headerHex = await getFileHeaderHex(file);
      if (!isValidFileSignature(headerHex, file.type)) {
        console.warn(`Assinatura de ficheiro inválida para ${file.name} (MIME: ${file.type}, Header: ${headerHex})`);
        return 'O conteúdo do ficheiro não parece ser uma imagem válida ou o formato está corrompido.';
      }
    } catch (error) {
      console.error("Erro ao validar assinatura do ficheiro:", error);
      return 'Não foi possível verificar o conteúdo do ficheiro. Tente novamente.';
    }
    
    return null; // Sem erros de validação
  }, []);

  // Processar arquivo selecionado
  const handleFile = useCallback(async (file: File) => {
    setIsVerifying(true); // Inicia a verificação
    setUploadError(null); // Limpa erros anteriores
    
    // Revoga URL de objeto anterior, se existir
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null); // Limpa ficheiro anterior enquanto verifica o novo

    const validationError = await validateFile(file);
    
    if (validationError) {
      setUploadError(validationError);
      toast.error("Erro no Carregamento", { description: validationError });
      setIsVerifying(false); // Termina a verificação
      return;
    }
    
    // Se a validação passou
    const previewUrl = URL.createObjectURL(file);
    setUploadedFile({ file, preview: previewUrl });
    
    toast.success("Imagem Carregada", {
      description: `${file.name} (${formatFileSize(file.size)})`
    });
    setIsVerifying(false); // Termina a verificação
  }, [validateFile, uploadedFile?.preview]); // Adicionado uploadedFile?.preview para revogar corretamente

  // Handler para input de arquivo
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(e.target.files[0]);
    }
    // Limpa o valor do input para permitir o re-upload do mesmo ficheiro
    if (e.target) {
      e.target.value = '';
    }
  }, [handleFile]);

  // Handlers para drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isVerifying) setIsDragging(true); // Só permite drag se não estiver a verificar
  }, [isVerifying]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isVerifying) return; // Não processa se já estiver a verificar

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Itera sobre os ficheiros (embora geralmente seja um)
      const file = e.dataTransfer.files[0];
      if (file) {
         await handleFile(file);
      }
    }
  }, [handleFile, isVerifying]);

  // Remover arquivo
  const handleRemoveFile = useCallback(() => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
    setUploadError(null);
    setIsVerifying(false); // Reseta o estado de verificação
  }, [uploadedFile?.preview]);

  // Limpar URL objeto quando o componente que usa o hook for desmontado
  // ou quando uploadedFile.preview mudar (o que já é tratado em handleFile e handleRemoveFile)
  useEffect(() => {
    const currentPreview = uploadedFile?.preview;
    return () => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
        // console.log("Revogada URL de objeto no unmount:", currentPreview);
      }
    };
  }, [uploadedFile?.preview]);

  return {
    uploadedFile,
    uploadError,
    isDragging,
    isVerifying, // Retorna o novo estado
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    // handleFile, // Não é necessário expor handleFile diretamente se handleFileChange e handleDrop o usam
  };
}