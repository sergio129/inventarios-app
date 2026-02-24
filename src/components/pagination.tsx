'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaginationProps {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export default function Pagination({
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const delta = 1;
    const range: (number | string)[] = [];
    const left = currentPage - delta;
    const right = currentPage + delta + 1;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }

    return range;
  };

  return (
    <div className="flex flex-col gap-4 mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center flex-wrap gap-4">
        {/* Información del rango */}
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{startItem}</span> a{' '}
          <span className="font-medium">{endItem}</span> de{' '}
          <span className="font-medium">{totalItems}</span> productos
        </div>

        {/* Selector de items por página */}
        <div className="flex items-center gap-2">
          <label htmlFor="items-per-page" className="text-sm text-gray-600">
            Items por página:
          </label>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(parseInt(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Controles de navegación */}
      <div className="flex justify-center items-center gap-2 flex-wrap">
        {/* Botón Anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        {/* Números de página */}
        <div className="flex gap-1">
          {getPageNumbers().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-2 py-1 text-gray-400">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page as number)}
                  className="min-w-[36px]"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Botón Siguiente */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="gap-1"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Información adicional */}
      <div className="text-center text-sm text-gray-600">
        Página <span className="font-medium">{currentPage}</span> de{' '}
        <span className="font-medium">{totalPages}</span>
      </div>
    </div>
  );
}
