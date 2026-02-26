'use client';

import { useNavigationShortcuts } from '@/lib/useKeyboardShortcuts';

export function KeyboardShortcutsProvider() {
  useNavigationShortcuts();

  return null; // Este componente no renderiza nada, solo proporciona la funcionalidad
}
