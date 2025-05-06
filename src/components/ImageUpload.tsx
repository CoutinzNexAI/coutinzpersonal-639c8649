import React, { useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Check, AlertTriangle } from "lucide-react"; // Renomeado Image para ImageIcon
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useImageUpload, UploadedFile } from '@/hooks/useImageUpload'; // Assume que este hook existe e funciona

interface ImageUploadProps {
  // Callback para notificar o componente pai (GhibliHero) sobre a mudança de ficheiro
  onFileChange?: (file: UploadedFile | null) => void;
  // Permite passar classes adicionais para o container principal
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileChange, className }) => {
  // Usa o hook customizado para toda a lógica de upload
  const {
    uploadedFile,    // O ficheiro carregado (ou null)
    uploadError,     // Mensagem de erro (ou null)
    isDragging,      // Estado para indicar se um ficheiro está a ser arrastado sobre a área
    handleFileChange,// Handler para o input de ficheiro (seleção manual)
    handleDragOver,  // Handler para drag over
    handleDragLeave, // Handler para drag leave
    handleDrop,      // Handler para drop
    handleRemoveFile,// Handler para remover o ficheiro selecionado
  } = useImageUpload();

  // Ref para o input de ficheiro escondido
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para formatar o tamanho do ficheiro
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Efeito para chamar onFileChange sempre que uploadedFile mudar
  useEffect(() => {
    // Notifica o componente pai se a prop onFileChange foi passada
    if (onFileChange) {
      onFileChange(uploadedFile);
    }
    // A dependência é uploadedFile e onFileChange
  }, [uploadedFile, onFileChange]);

  // Função para abrir o seletor de ficheiros ao clicar na área
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Função para lidar com erro ao carregar a preview da imagem
  const handlePreviewError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Esconde a imagem quebrada e mostra uma mensagem ou placeholder
    event.currentTarget.style.display = 'none';
    // Poderia mostrar um placeholder SVG ou uma div de erro aqui
    console.error("Erro ao carregar preview da imagem");
    // Opcional: Adicionar um estado para mostrar uma mensagem de erro específica da preview
  };

  return (
    // Container principal com altura total
    <div className={cn("w-full h-full", className)}>
      {/* Input de ficheiro escondido */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp" // Formatos aceites
        onChange={handleFileChange}    // Chama o handler do hook
        className="hidden"
        aria-hidden="true" // Esconde do leitor de ecrã
      />

      {/* --- Estado SEM Ficheiro Carregado --- */}
      {!uploadedFile ? (
        // Área de Drag & Drop / Clique com altura total e acessibilidade
        <div
          className={cn(
            "border-2 border-dashed rounded-2xl transition-all duration-200 p-8 flex flex-col items-center justify-center cursor-pointer bg-white/50 backdrop-blur-sm h-full", // Garante altura total
            isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50", // Feedback visual drag/hover
            className // Permite classes externas
          )}
          onClick={handleUploadClick} // Abre seletor de ficheiro
          onDragOver={handleDragOver}  // Handlers de drag & drop
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button" // Semântica de botão
          tabIndex={0} // Permite foco via teclado
          aria-label="Área para carregar imagem. Clique ou arraste um ficheiro." // Descrição acessível
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleUploadClick(); } }} // Ativa com Enter/Espaço
        >
          {/* Ícone de Upload */}
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>

          {/* Textos */}
          <p className="text-lg font-medium text-center mb-2">
            Arraste e solte sua foto aqui
          </p>
          <p className="text-muted-foreground text-center mb-4">
            ou clique para selecionar um arquivo
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Formatos: JPG, PNG, WEBP (máx. 10MB) {/* Confirma se o limite é este */}
          </p>

          {/* Mensagem de Erro de Validação (do hook) */}
          {uploadError && (
            <div className="mt-4 p-2 bg-destructive/10 text-destructive rounded-md text-sm flex items-center text-center w-full justify-center">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      ) : (
        // --- Estado COM Ficheiro Carregado ---
        <div className="relative rounded-2xl overflow-hidden border border-border bg-white/70 backdrop-blur-sm shadow-lg h-full flex flex-col"> {/* Garante altura e layout coluna */}
          {/* Botões de Ação (Trocar / Remover) */}
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            {/* Botão Trocar Imagem */}
            <Button
              size="icon"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm h-9 w-9 rounded-full hover:bg-white"
              onClick={handleUploadClick} // Reutiliza a função para abrir o seletor
              aria-label="Trocar imagem" // Label acessível
            >
              <ImageIcon className="h-4 w-4" /> {/* Usando ImageIcon */}
            </Button>
            {/* Botão Remover Imagem */}
            <Button
              size="icon"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive"
              onClick={handleRemoveFile} // Chama handler do hook
              aria-label="Remover imagem" // Label acessível
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Pré-visualização da Imagem (ocupa espaço restante) */}
          <div className="relative aspect-video w-full overflow-hidden flex-grow bg-muted/30"> {/* Adicionado flex-grow e fundo */}
            <img
              src={uploadedFile.preview} // URL de pré-visualização gerada pelo hook
              alt="Pré-visualização da imagem selecionada"
              className="w-full h-full object-cover" // Mudado para object-contain para ver imagem inteira
              onError={handlePreviewError} // Handler para erro ao carregar preview
            />
            {/* TODO: Adicionar um placeholder/mensagem aqui caso a preview falhe */}
          </div>

          {/* Informação do Ficheiro (rodapé) */}
          <div className="p-3 bg-white/80 backdrop-blur-sm border-t border-border/50 flex-shrink-0"> {/* Evita que encolha */}
            <div className="flex items-center gap-2">
              {/* Ícone de Check */}
              <div className="rounded-full bg-primary/10 p-1 flex-shrink-0">
                <Check className="h-4 w-4 text-primary" />
              </div>
              {/* Nome do Ficheiro (truncado) */}
              <div className="text-sm font-medium truncate flex-grow min-w-0" title={uploadedFile.file.name}> {/* Adicionado min-w-0 */}
                {uploadedFile.file.name}
              </div>
              {/* Tamanho do Ficheiro */}
              <div className="text-xs text-muted-foreground flex-shrink-0">
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
