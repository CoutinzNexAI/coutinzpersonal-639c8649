
import React, { useState, useRef, useCallback } from 'react';
import { toast } from "@/components/ui/sonner";
import { Upload, X, Image, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Define the accepted file types
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export interface UploadedFile {
  file: File;
  preview: string;
}

interface ImageUploadProps {
  onFileChange?: (file: UploadedFile | null) => void;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileChange, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Validate the file
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return 'Tipo de arquivo inválido. Aceito apenas JPG, PNG ou WEBP.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. O tamanho máximo é ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    
    return null;
  };

  // Handle file selection
  const handleFileSelection = useCallback((file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      toast.error("Erro no upload", {
        description: validationError
      });
      setUploadedFile(null);
      if (onFileChange) onFileChange(null);
      return;
    }
    
    setError(null);
    
    // Create a URL for the preview
    const previewUrl = URL.createObjectURL(file);
    const newUploadedFile = { file, preview: previewUrl };
    
    setUploadedFile(newUploadedFile);
    if (onFileChange) onFileChange(newUploadedFile);
    
    toast.success("Imagem carregada com sucesso", {
      description: `${file.name} (${formatFileSize(file.size)})`
    });
  }, [onFileChange]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  // Handle click on upload area
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  // Handle remove file
  const handleRemoveFile = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
    setError(null);
    if (onFileChange) onFileChange(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {!uploadedFile ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-2xl transition-all duration-200 p-8 flex flex-col items-center justify-center cursor-pointer bg-white/50 backdrop-blur-sm hover:border-primary",
            isDragging ? "border-primary bg-primary/5" : "border-muted",
            className
          )}
          onClick={handleUploadClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <p className="text-lg font-medium text-center mb-2">
            Arraste e solte sua foto aqui
          </p>
          <p className="text-muted-foreground text-center mb-4">
            ou clique para selecionar um arquivo
          </p>
          
          <p className="text-xs text-muted-foreground text-center">
            Formatos aceitos: JPG, PNG, WEBP (máx. 10MB)
          </p>
          
          {error && (
            <div className="mt-4 p-2 bg-destructive/10 text-destructive rounded-md text-sm flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-border bg-white/70 backdrop-blur-sm shadow-lg">
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <Button
              size="icon"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm h-9 w-9 rounded-full"
              onClick={handleUploadClick}
            >
              <Image className="h-4 w-4" />
            </Button>
            
            <Button
              size="icon"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm h-9 w-9 rounded-full"
              onClick={handleRemoveFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative aspect-video w-full overflow-hidden">
            <img
              src={uploadedFile.preview}
              alt="Imagem selecionada"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="p-4 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-1">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm font-medium truncate">
                {uploadedFile.file.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(uploadedFile.file.size)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
