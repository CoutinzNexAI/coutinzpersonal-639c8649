import React, { useRef, useEffect, useState } from 'react';
import { Upload, X, Image as ImageIcon, Check, AlertTriangle, Loader2 } from "lucide-react"; // Adicionado Loader2
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import { useImageUpload, UploadedFile, MAX_FILE_SIZE } from '@/hooks/useImageUpload';

interface ImageUploadProps {
  onFileChange?: (file: UploadedFile | null) => void;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileChange, className }) => {
  const {
    uploadedFile,
    uploadError,
    isDragging,
    isVerifying, // Novo estado do hook
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
  } = useImageUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewError, setPreviewError] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  useEffect(() => {
    if (onFileChange) {
      onFileChange(uploadedFile);
    }
    // Resetar o erro de preview se o ficheiro mudar
    if (uploadedFile) {
        setPreviewError(false);
    }
  }, [uploadedFile, onFileChange]);

  const handleUploadClick = () => {
    if (fileInputRef.current && !isVerifying) { // Não permite clique se estiver a verificar
      fileInputRef.current.click();
    }
  };
  
  const handleLocalPreviewError = () => {
    setPreviewError(true);
    console.error("Erro ao carregar pré-visualização da imagem no componente.");
  };

  return (
    <div className={cn("w-full h-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        disabled={isVerifying} // Desabilita o input durante a verificação
      />

      {/* Estado de Verificação */}
      {isVerifying ? (
        <div className={cn(
            "border-2 border-dashed rounded-2xl transition-all duration-200 p-8 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm h-full text-ghibli-wood",
            className
        )}>
          <Loader2 className="h-10 w-10 animate-spin text-ghibli-moss mb-4" />
          <p className="text-lg font-medium text-center">A verificar ficheiro...</p>
          <p className="text-sm text-ghibli-earth text-center">Por favor, aguarde um momento.</p>
        </div>
      ) : !uploadedFile ? (
        // Estado SEM Ficheiro Carregado (ou após erro/remoção)
        <div
          className={cn(
            "border-2 border-dashed rounded-2xl transition-all duration-200 p-8 flex flex-col items-center justify-center cursor-pointer bg-white/50 backdrop-blur-sm h-full",
            isDragging ? "border-ghibli-moss bg-ghibli-sky/10" : "border-ghibli-stone/40 hover:border-ghibli-moss/70",
            uploadError && "border-destructive bg-destructive/5", // Estilo de erro
            className
          )}
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Área para carregar imagem. Clique ou arraste um ficheiro."
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleUploadClick(); } }}
        >
          {/* Aviso sobre qualidade da imagem */}
          <div className="w-full mb-4 p-3 bg-yellow-100/90 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-700 text-xs sm:text-sm font-medium">
              💡 Para melhores resultados, use fotos nítidas onde o rosto seja claramente visível
            </p>
          </div>

          <div className={cn(
            "mb-3 sm:mb-4 rounded-full p-3 sm:p-4 transition-colors",
            uploadError ? "bg-destructive/10" : "bg-ghibli-sky/10"
          )}>
            <Upload className={cn("h-7 w-7 sm:h-8 sm:h-8", uploadError ? "text-destructive" : "text-ghibli-sky")} />
          </div>
          <p className="text-md sm:text-lg font-medium text-center mb-1 sm:mb-2 text-ghibli-wood">
            Arraste e solte a sua foto aqui
          </p>
          <p className="text-ghibli-earth text-center mb-3 sm:mb-4 text-sm sm:text-base">
            ou clique para selecionar um ficheiro
          </p>
          <p className="text-xs text-ghibli-stone/80 text-center">
            Formatos: JPG, PNG, WEBP (máx. {formatFileSize(MAX_FILE_SIZE)})
          </p>
          
          {uploadError && (
            <div className="mt-3 p-2 bg-destructive/10 text-destructive rounded-md text-xs sm:text-sm flex items-center text-center w-full max-w-xs justify-center">
              <AlertTriangle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      ) : (
        // Estado COM Ficheiro Carregado
        <div className="relative rounded-2xl overflow-hidden border border-ghibli-sand/50 bg-ghibli-cream/50 backdrop-blur-sm shadow-lg h-full flex flex-col">
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex gap-1.5 sm:gap-2">
            <Button
              size="icon"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-white shadow-sm"
              onClick={handleUploadClick}
              aria-label="Trocar imagem"
              disabled={isVerifying}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-destructive/10 hover:text-destructive shadow-sm"
              onClick={handleRemoveFile}
              aria-label="Remover imagem"
              disabled={isVerifying}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative aspect-video w-full overflow-hidden flex-grow bg-slate-100">
            {previewError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-destructive/90 bg-destructive/5">
                <AlertTriangle className="h-7 w-7 sm:h-8 sm:h-8 mb-2" />
                <p className="text-xs sm:text-sm text-center">Não foi possível carregar a pré-visualização.</p>
              </div>
            ) : (
              <Image
                src={uploadedFile.preview}
                alt="Pré-visualização da imagem carregada"
                fill
                style={{ objectFit: "contain" }} // 'contain' para ver a imagem toda
                onError={handleLocalPreviewError}
                sizes="(max-width: 640px) 100vw, 50vw" // Ajuste conforme o layout
              />
            )}
          </div>

          <div className="p-2.5 sm:p-3 bg-white/70 backdrop-blur-sm border-t border-ghibli-sand/30 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-ghibli-moss/10 p-1 flex-shrink-0">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:h-4 text-ghibli-moss" />
              </div>
              <div className="text-xs sm:text-sm font-medium truncate flex-grow min-w-0 text-ghibli-wood" title={uploadedFile.file.name}>
                {uploadedFile.file.name}
              </div>
              <div className="text-[10px] sm:text-xs text-ghibli-earth flex-shrink-0">
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