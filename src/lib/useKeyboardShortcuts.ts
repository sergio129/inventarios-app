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
          // BLOQUEAR atajos de tecla simple (A-Z, 1-9) si estamos escribiendo en un input
          // EXCEPTO: letras simples (C, P, D, E, N, X) que son atajos de aplicación
          if (isInput && shortcut.key.length === 1 && !shortcut.ctrl && !shortcut.shift && !shortcut.alt) {
            const inputValue = (target as HTMLInputElement).value;
            
            // Bloquear NÚMEROS (1-9) completamente cuando hay input enfocado con contenido
            if (/^\d$/.test(shortcut.key) && inputValue) {
              continue;
            }

            // Bloquear letras SOLO si hay valor en el input Y no es un input vacío
            // (permitir atajos de aplicación como C, P, D, E, N, X incluso en inputs)
            const isApplicationHotkey = ['c', 'p', 'd', 'e', 'n', 'x'].includes(shortcut.key.toLowerCase());
            
            if (!isApplicationHotkey && inputValue) {
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
