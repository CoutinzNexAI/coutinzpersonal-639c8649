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

// Assinaturas de ficheiro (Magic Numbers)
const FILE_SIGNATURES: { [key: string]: (string | undefined)[] } = {
  'image/jpeg': ['ffd8ff'], // JPG
  'image/png': ['89504e47'], // PNG
  'image/webp': [
    '52494646', // RIFF
    undefined, // qualquer coisa
    undefined, // qualquer coisa
    undefined, // qualquer coisa
    '57454250', // WEBP
  ],
};

// Função para ler os primeiros bytes de um ficheiro como string hexadecimal
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

// Função para validar a assinatura do ficheiro
// Função para validar a assinatura do ficheiro
const isValidFileSignature = (headerHex: string, mimeType: string): boolean => {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return false; // Tipo MIME não suportado para verificação de assinatura

  // Para WEBP, precisamos verificar a assinatura 'RIFF' no início e 'WEBP' no offset 8 do ficheiro
  if (mimeType === 'image/webp') {
    // Se headerHex tem 24 caracteres (12 bytes), 'WEBP' (signatures[4]) estará entre o caractere 16 e 24.
    // 'RIFF' (signatures[0]) estará no início.
    if (headerHex.length < 24) { // Garante que temos bytes suficientes para a verificação completa do WebP
        console.warn(`[isValidFileSignature] HeaderHex muito curto para WebP: ${headerHex.length} caracteres`);
        return false;
    }
    return headerHex.startsWith(signatures[0]!) &&      // Verifica 'RIFF' (bytes 0-3)
           headerHex.substring(16, 24) === signatures[4]; // Verifica 'WEBP' (bytes 8-11)
  }

  // Para outros tipos (JPG, PNG), as suas assinaturas estão nos primeiros bytes.
  // Certifique-se que headerHex é longo o suficiente para a assinatura mais longa aqui.
  // Ex: PNG '89504e47' tem 8 caracteres hex (4 bytes). JPG 'ffd8ff' tem 6 (3 bytes).
  // Como estamos a ler 12 bytes (24 caracteres hex), temos mais do que suficiente.
  return signatures.some(signature => signature && headerHex.startsWith(signature));
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