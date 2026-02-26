'use client';

import { useKeyboardShortcuts } from './useKeyboardShortcuts';

interface SalesShortcutsProps {
  onCalculate?: () => void;
  onPay?: () => void;
  onApplyDiscount?: () => void;
  onSelectClient?: () => void;
  onNewClient?: () => void;
  onDeleteLastItem?: () => void;
  onClearCart?: () => void;
  onPaymentMethod?: (method: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque') => void;
  onQuantityInput?: (quantity: number) => void;
  barcodeInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function useSalesShortcuts(props: SalesShortcutsProps) {
  const {
    onCalculate,
    onPay,
    onApplyDiscount,
    onSelectClient,
    onNewClient,
    onDeleteLastItem,
    onClearCart,
    onPaymentMethod,
    onQuantityInput,
    barcodeInputRef,
  } = props;

  // Atajos específicos para ventas
  useKeyboardShortcuts([
    // SHIFT + C = Calcular total
    {
      key: 'c',
      shift: true,
      callback: () => {
        onCalculate?.();
      },
    },
    // SHIFT + P = Procesar pago
    {
      key: 'p',
      shift: true,
      callback: () => {
        onPay?.();
      },
    },
    // SHIFT + D = Descuento
    {
      key: 'd',
      shift: true,
      callback: () => {
        onApplyDiscount?.();
      },
    },
    // SHIFT + E = Cliente (buscar/seleccionar)
    {
      key: 'e',
      shift: true,
      callback: () => {
        onSelectClient?.();
      },
    },
    // SHIFT + N = Nuevo cliente
    {
      key: 'n',
      shift: true,
      callback: () => {
        onNewClient?.();
      },
    },
    // SHIFT + X = Eliminar último ítem
    {
      key: 'x',
      shift: true,
      callback: () => {
        onDeleteLastItem?.();
      },
    },
    // CTRL + SHIFT + X = Limpiar carrito
    {
      key: 'x',
      ctrl: true,
      shift: true,
      callback: () => {
        onClearCart?.();
      },
    },
    // 1 = Efectivo
    {
      key: '1',
      alt: true,
      callback: () => {
        onPaymentMethod?.('efectivo');
      },
    },
    // 2 = Tarjeta
    {
      key: '2',
      alt: true,
      callback: () => {
        onPaymentMethod?.('tarjeta');
      },
    },
    // 3 = Transferencia
    {
      key: '3',
      alt: true,
      callback: () => {
        onPaymentMethod?.('transferencia');
      },
    },
    // 4 = Cheque
    {
      key: '4',
      alt: true,
      callback: () => {
        onPaymentMethod?.('cheque');
      },
    },
    // CTRL+F = Enfoque en búsqueda de productos
    {
      key: 'f',
      ctrl: true,
      callback: () => {
        if (barcodeInputRef?.current) {
          barcodeInputRef.current.focus();
          barcodeInputRef.current.select();
        }
      },
    },
  ]);
}
