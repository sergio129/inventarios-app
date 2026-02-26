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
    // ALT + SHIFT + 1 = Descuento 5%
    {
      key: '1',
      alt: true,
      shift: true,
      callback: () => {
        onApplyQuickDiscount?.(5);
      },
    },
    // ALT + SHIFT + 2 = Descuento 10%
    {
      key: '2',
      alt: true,
      shift: true,
      callback: () => {
        onApplyQuickDiscount?.(10);
      },
    },
    // ALT + SHIFT + 3 = Descuento 15%
    {
      key: '3',
      alt: true,
      shift: true,
      callback: () => {
        onApplyQuickDiscount?.(15);
      },
    },
    // ALT + SHIFT + 4 = Descuento 20%
    {
      key: '4',
      alt: true,
      shift: true,
      callback: () => {
        onApplyQuickDiscount?.(20);
      },
    },
    // CTRL + ALT + 1 = Reporte diario
    {
      key: '1',
      ctrl: true,
      alt: true,
      callback: () => {
        onOpenDailyReport?.();
      },
    },
    // CTRL + ALT + 2 = Reporte semanal
    {
      key: '2',
      ctrl: true,
      alt: true,
      callback: () => {
        onOpenWeeklyReport?.();
      },
    },
    // CTRL + ALT + 3 = Top productos
    {
      key: '3',
      ctrl: true,
      alt: true,
      callback: () => {
        onOpenTopProducts?.();
      },
    },
    // CTRL + ALT + 4 = Análisis de clientes
    {
      key: '4',
      ctrl: true,
      alt: true,
      callback: () => {
        onOpenClientAnalysis?.();
      },
    },
    // CTRL + ALT + K = Abrir modal avanzado (manejado por el componente)
    // (Este atajo se maneja internamente en AdvancedSalesModal)
  ]);
}
