import React from 'react';
import { motion } from 'framer-motion';

// Fallback icons if heroicons fail
const ChevronLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDoubleLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
  </svg>
);

const ChevronDoubleRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
  </svg>
);

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isLoading: boolean;
  onGoToPage: (page: number) => void;
  onGoToFirstPage: () => void;
  onGoToLastPage: () => void;
  onGoToNextPage: () => void;
  onGoToPreviousPage: () => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  isLoading,
  onGoToPage,
  onGoToFirstPage,
  onGoToLastPage,
  onGoToNextPage,
  onGoToPreviousPage
}) => {
  // Generate page numbers for desktop
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Show max 5 page numbers
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      if (currentPage <= 3) {
        // Show first pages
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show last pages
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show middle pages
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) {
    return null; // No pagination needed for single page
  }

  return (
    <motion.div 
      className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 sm:mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Mobile Pagination */}
      <div className="sm:hidden flex items-center justify-between w-full max-w-sm gap-4">
        {/* Previous Button */}
        <motion.button
          onClick={onGoToPreviousPage}
          disabled={!hasPrevPage || isLoading}
          className={`flex items-center justify-center px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            !hasPrevPage || isLoading
              ? 'bg-ghibli-sand/30 text-ghibli-stone cursor-not-allowed'
              : 'bg-ghibli-moss text-ghibli-cream hover:bg-ghibli-moss/90 active:scale-95'
          }`}
          whileHover={!hasPrevPage || isLoading ? {} : { scale: 1.05 }}
          whileTap={!hasPrevPage || isLoading ? {} : { scale: 0.95 }}
        >
                     <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </motion.button>

        {/* Page Indicator */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-ghibli-wood">
            Página {currentPage} de {totalPages}
          </span>
          <div className="w-16 h-1 bg-ghibli-sand/30 rounded-full mt-1">
            <div 
              className="h-full bg-gradient-to-r from-ghibli-moss to-ghibli-sky rounded-full transition-all duration-300"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            />
          </div>
        </div>

        {/* Next Button */}
        <motion.button
          onClick={onGoToNextPage}
          disabled={!hasNextPage || isLoading}
          className={`flex items-center justify-center px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            !hasNextPage || isLoading
              ? 'bg-ghibli-sand/30 text-ghibli-stone cursor-not-allowed'
              : 'bg-ghibli-moss text-ghibli-cream hover:bg-ghibli-moss/90 active:scale-95'
          }`}
          whileHover={!hasNextPage || isLoading ? {} : { scale: 1.05 }}
          whileTap={!hasNextPage || isLoading ? {} : { scale: 0.95 }}
        >
          Seguinte
                     <ChevronRight className="w-4 h-4 ml-1" />
        </motion.button>
      </div>

      {/* Desktop Pagination */}
      <div className="hidden sm:flex items-center gap-2">
        {/* First Page Button */}
        <motion.button
          onClick={onGoToFirstPage}
          disabled={currentPage === 1 || isLoading}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
            currentPage === 1 || isLoading
              ? 'bg-ghibli-sand/20 text-ghibli-stone cursor-not-allowed'
              : 'bg-white border border-ghibli-sand/30 text-ghibli-earth hover:bg-ghibli-moss hover:text-white'
          }`}
          whileHover={currentPage === 1 || isLoading ? {} : { scale: 1.1 }}
          whileTap={currentPage === 1 || isLoading ? {} : { scale: 0.9 }}
          title="Primeira página"
        >
                     <ChevronDoubleLeft className="w-5 h-5" />
         </motion.button>

         {/* Previous Button */}
         <motion.button
           onClick={onGoToPreviousPage}
           disabled={!hasPrevPage || isLoading}
           className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
             !hasPrevPage || isLoading
               ? 'bg-ghibli-sand/20 text-ghibli-stone cursor-not-allowed'
               : 'bg-white border border-ghibli-sand/30 text-ghibli-earth hover:bg-ghibli-moss hover:text-white'
           }`}
           whileHover={!hasPrevPage || isLoading ? {} : { scale: 1.1 }}
           whileTap={!hasPrevPage || isLoading ? {} : { scale: 0.9 }}
           title="Página anterior"
         >
           <ChevronLeft className="w-5 h-5" />
        </motion.button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, index) => (
            <motion.div key={index}>
              {pageNum === '...' ? (
                <span className="px-3 py-2 text-ghibli-earth">...</span>
              ) : (
                <motion.button
                  onClick={() => onGoToPage(pageNum as number)}
                  disabled={pageNum === currentPage || isLoading}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                    pageNum === currentPage
                      ? 'bg-gradient-to-r from-ghibli-moss to-ghibli-sky text-white shadow-lg'
                      : 'bg-white border border-ghibli-sand/30 text-ghibli-earth hover:bg-ghibli-sand/20'
                  }`}
                  whileHover={pageNum === currentPage || isLoading ? {} : { scale: 1.1 }}
                  whileTap={pageNum === currentPage || isLoading ? {} : { scale: 0.9 }}
                >
                  {pageNum}
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Next Button */}
        <motion.button
          onClick={onGoToNextPage}
          disabled={!hasNextPage || isLoading}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
            !hasNextPage || isLoading
              ? 'bg-ghibli-sand/20 text-ghibli-stone cursor-not-allowed'
              : 'bg-white border border-ghibli-sand/30 text-ghibli-earth hover:bg-ghibli-moss hover:text-white'
          }`}
          whileHover={!hasNextPage || isLoading ? {} : { scale: 1.1 }}
          whileTap={!hasNextPage || isLoading ? {} : { scale: 0.9 }}
          title="Próxima página"
        >
                     <ChevronRight className="w-5 h-5" />
         </motion.button>

         {/* Last Page Button */}
         <motion.button
           onClick={onGoToLastPage}
           disabled={currentPage === totalPages || isLoading}
           className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
             currentPage === totalPages || isLoading
               ? 'bg-ghibli-sand/20 text-ghibli-stone cursor-not-allowed'
               : 'bg-white border border-ghibli-sand/30 text-ghibli-earth hover:bg-ghibli-moss hover:text-white'
           }`}
           whileHover={currentPage === totalPages || isLoading ? {} : { scale: 1.1 }}
           whileTap={currentPage === totalPages || isLoading ? {} : { scale: 0.9 }}
           title="Última página"
         >
           <ChevronDoubleRight className="w-5 h-5" />
        </motion.button>
      </div>

             {/* Stats for Desktop */}
       <div className="hidden sm:block text-sm text-ghibli-earth">
         Página {currentPage} de {totalPages}
       </div>
    </motion.div>
  );
}; 