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
    // C = Calcular total
    {
      key: 'c',
      callback: () => {
        onCalculate?.();
      },
    },
    // P = Procesar pago
    {
      key: 'p',
      callback: () => {
        onPay?.();
      },
    },
    // D = Descuento
    {
      key: 'd',
      callback: () => {
        onApplyDiscount?.();
      },
    },
    // E = Cliente (buscar/seleccionar)
    {
      key: 'e',
      callback: () => {
        onSelectClient?.();
      },
    },
    // N = Nuevo cliente
    {
      key: 'n',
      callback: () => {
        onNewClient?.();
      },
    },
    // X = Eliminar último ítem
    {
      key: 'x',
      callback: () => {
        onDeleteLastItem?.();
      },
    },
    // CTRL + X = Limpiar carrito
    {
      key: 'x',
      ctrl: true,
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
