import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

// Definindo tipos
export interface UploadedFile {
  file: File;
  preview: string;
}

// Constantes para validação
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useImageUpload() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Formatar tamanho do arquivo para exibição
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Validar arquivo
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Tipo de arquivo inválido. Aceito apenas JPG, PNG ou WEBP.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. O tamanho máximo é ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    
    return null;
  }, []);

  // Processar arquivo selecionado
  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setUploadError(validationError);
      setUploadedFile(null);
      setUploadedImageUrl(null);
      
      toast.error("Erro no upload", {
        description: validationError
      });
      
      return;
    }
    
    setUploadError(null);
    
    // Criar URL para preview
    const previewUrl = URL.createObjectURL(file);
    setUploadedImageUrl(previewUrl);
    setUploadedFile({ file, preview: previewUrl });
    
    toast.success("Imagem carregada com sucesso", {
      description: `${file.name} (${formatFileSize(file.size)})`
    });
  }, [validateFile]);

  // Handler para input de arquivo
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  // Handlers para drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  // Remover arquivo
  const handleRemoveFile = useCallback(() => {
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
    }
    
    setUploadedFile(null);
    setUploadedImageUrl(null);
    setUploadError(null);
  }, [uploadedImageUrl]);

  // Limpar URL objeto quando componente for desmontado ou URL mudar
  useEffect(() => {
    return () => {
      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl]);

  return {
    uploadedFile,
    uploadedImageUrl,
    uploadError,
    isDragging,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    handleFile
  };
} 