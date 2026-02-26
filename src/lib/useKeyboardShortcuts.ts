'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // No ejecutar si el usuario está escribiendo en un input o textarea
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      for (const shortcut of shortcuts) {
        const isKeyMatch =
          event.key.toLowerCase() === shortcut.key.toLowerCase() ||
          event.code.toLowerCase() === shortcut.key.toLowerCase();

        const isCtrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const isShiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const isAltMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (isKeyMatch && isCtrlMatch && isShiftMatch && isAltMatch) {
          // Permitir atajos sin modificadores incluso en inputs (son atajos de aplicación, no de escritura)
          // Solo bloquear numeros de código de barras (aquellos que están en el input de lectura de código)
          const inputId = (target as HTMLInputElement).id;
          if (isInput && shortcut.key.length === 1 && !shortcut.ctrl && !shortcut.shift && !shortcut.alt) {
            // Si el input está vacio o es para búsqueda, permitir el atajo
            const inputValue = (target as HTMLInputElement).value;
            const isSearchInput = (target as HTMLInputElement).placeholder?.includes('Buscar') || 
                                 (target as HTMLInputElement).placeholder?.includes('buscar');
            
            // Si es un input de búsqueda o está vacío, permitir el atajo
            if (!isSearchInput && inputValue.length > 0) {
              continue;
            }
          }

          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, router]);
}

// Hook específico para navegación
export function useNavigationShortcuts() {
  const router = useRouter();

  useKeyboardShortcuts([
    {
      key: 'F2',
      callback: () => {
        router.push('/sales');
      },
    },
    {
      key: 'F3',
      callback: () => {
        router.push('/devolutions');
      },
    },
    {
      key: 'F4',
      callback: () => {
        router.push('/inventory');
      },
    },
    {
      key: 'F5',
      callback: () => {
        router.push('/reports');
      },
    },
    {
      key: 'F6',
      callback: () => {
        router.push('/clients');
      },
    },
  ]);
}

// Parseador para detectar atajos comunes
export function registerGlobalShortcuts() {
  return [
    {
      key: 'Escape',
      callback: () => {
        // Cierra diálogos y modales
        const dialogs = document.querySelectorAll('[role="dialog"]');
        if (dialogs.length > 0) {
          const closeButton = dialogs[dialogs.length - 1].querySelector('[aria-label="Close"]');
          if (closeButton instanceof HTMLElement) {
            closeButton.click();
          }
        }
      },
    },
  ];
}
