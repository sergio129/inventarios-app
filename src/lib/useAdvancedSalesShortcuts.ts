'use client';

import { useKeyboardShortcuts } from './useKeyboardShortcuts';

interface AdvancedSalesShortcutsProps {
  onApplyQuickDiscount?: (percentage: number) => void;
  onOpenDailyReport?: () => void;
  onOpenWeeklyReport?: () => void;
  onOpenTopProducts?: () => void;
  onOpenClientAnalysis?: () => void;
  onOpenAdvancedModal?: () => void;
}

export function useAdvancedSalesShortcuts(props: AdvancedSalesShortcutsProps) {
  const {
    onApplyQuickDiscount,
    onOpenDailyReport,
    onOpenWeeklyReport,
    onOpenTopProducts,
    onOpenClientAnalysis,
    onOpenAdvancedModal,
  } = props;

  // Atajos avanzados para Fase 3
  useKeyboardShortcuts([
    // SHIFT + 1 = Descuento 5%
    {
      key: '1',
      shift: true,
      callback: () => {
        onApplyQuickDiscount?.(5);
      },
    },
    // SHIFT + 2 = Descuento 10%
    {
      key: '2',
      shift: true,
      callback: () => {
        onApplyQuickDiscount?.(10);
      },
    },
    // SHIFT + 3 = Descuento 15%
    {
      key: '3',
      shift: true,
      callback: () => {
        onApplyQuickDiscount?.(15);
      },
    },
    // SHIFT + 4 = Descuento 20%
    {
      key: '4',
      shift: true,
      callback: () => {
        onApplyQuickDiscount?.(20);
      },
    },
    // CTRL + SHIFT + 1 = Reporte diario
    {
      key: '1',
      ctrl: true,
      shift: true,
      callback: () => {
        onOpenDailyReport?.();
      },
    },
    // CTRL + SHIFT + 2 = Reporte semanal
    {
      key: '2',
      ctrl: true,
      shift: true,
      callback: () => {
        onOpenWeeklyReport?.();
      },
    },
    // CTRL + SHIFT + 3 = Top productos
    {
      key: '3',
      ctrl: true,
      shift: true,
      callback: () => {
        onOpenTopProducts?.();
      },
    },
    // CTRL + SHIFT + 4 = Análisis de clientes
    {
      key: '4',
      ctrl: true,
      shift: true,
      callback: () => {
        onOpenClientAnalysis?.();
      },
    },
    // CTRL + ALT + K = Abrir modal avanzado (manejado por el componente)
    // (Este atajo se maneja internamente en AdvancedSalesModal)
  ]);
}
