# Guía de Implementación de Atajos de Teclado

## Estructura Implementada

### Fase 1 ✅ COMPLETADA
- [x] Hook personalizado `useKeyboardShortcuts` para registrar atajos
- [x] Navegación modular con F2, F3, F4, F5, F6
- [x] ESC para cancelar diálogos
- [x] F1 para abrir modal de ayuda
- [x] Modal de ayuda interactivo

### Fase 2 ✅ COMPLETADA
- [x] Hook específico `useSalesShortcuts` para módulo de ventas
- [x] Atajos para acciones principales (C, P, D, E, N, X)
- [x] Métodos de pago con números (1, 2, 3, 4)
- [x] CTRL+F para enfocar búsqueda de productos
- [x] Modal de ayuda específico para ventas (ALT+H)
- [x] Integración en componente de ventas

### Fase 3 ✅ COMPLETADA
- [x] Hook `useAdvancedSalesShortcuts` para atajos avanzados
- [x] Modal de accesos rápidos (CTRL+ALT+K)
- [x] Descuentos rápidos con SHIFT+1-4
- [x] Acceso a clientes frecuentes
- [x] Acceso a reportes con CTRL+SHIFT+1-4
- [x] Integración completa en módulo de ventas

---

## Cómo Añadir Nuevos Atajos

### Método 1: Atajos Globales (en cualquier página)

Edita `src/lib/useKeyboardShortcuts.ts` en la función `useNavigationShortcuts()`:

```typescript
{
  key: 'F7',
  callback: () => {
    router.push('/printer-settings');
  },
},
```

### Método 2: Atajos Locales (solo en una página/componente)

En tu componente, importa y usa el hook:

```typescript
'use client';

import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';

export function MyComponent() {
  useKeyboardShortcuts([
    {
      key: 'c',
      callback: () => {
        alert('Tecla C presionada');
      },
    },
    {
      key: 's',
      ctrl: true, // CTRL+S
      callback: () => {
        console.log('Guardando...');
      },
    },
  ]);

  return <div>Mi componente</div>;
}
```

### Método 3: Con Modificadores (CTRL, SHIFT, ALT)

```typescript
{
  key: 'x',
  ctrl: true,
  shift: true,
  callback: () => {
    // CTRL + SHIFT + X
  },
}
```

---

## Propiedades del Shortcut

```typescript
interface Shortcut {
  key: string;        // 'Enter', 'F1', 'a', etc
  ctrl?: boolean;     // Si requiere CTRL
  shift?: boolean;    // Si requiere SHIFT
  alt?: boolean;      // Si requiere ALT
  callback: () => void;
}
```

---

## Archivos Modificados en Fase 1

1. **src/lib/useKeyboardShortcuts.ts** - Hook personalizado
2. **src/components/KeyboardShortcutsProvider.tsx** - Provider global
3. **src/components/KeyboardHelpModal.tsx** - Modal de ayuda
4. **src/app/layout.tsx** - Integración en layout raíz

---

## Archivos de Fase 2

### Nuevos Archivos:
1. **src/lib/useSalesShortcuts.ts** - Hook específico para atajos de ventas
2. **src/components/SalesKeyboardHelpModal.tsx** - Modal de ayuda para ventas

### Archivos Modificados:
1. **src/app/sales/page.tsx** - Integración de atajos y modal

---

## Archivos de Fase 3

### Nuevos Archivos:
1. **src/lib/useAdvancedSalesShortcuts.ts** - Hook para atajos avanzados
2. **src/components/AdvancedSalesModal.tsx** - Modal de accesos avanzados

### Archivos Modificados:
1. **src/app/sales/page.tsx** - Integración de modal y atajos avanzados
2. **src/components/SalesKeyboardHelpModal.tsx** - Información sobre Fase 3

Para implementar los atajos del módulo de ventas:

1. Crear un hook `useSalesShortcuts.ts` en `src/app/sales/hooks/`
2. Importarlo en el componente de ventas
3. Agregar atajos para:
   - Búsqueda de productos (CTRL+F)
   - Agregar cantidad (números + ENTER)
   - Calcular (C)
   - Pagar (P)
   - Descuento (D)
   - Cliente (E)

---

## Testing

Para probar los atajos:

1. Abre la app en navegador
2. Presiona F1 para ver el modal de ayuda
3. Presiona F2 para ir a Ventas
4. Presiona ESC en un diálogo para cerrarlo

---

## Arquitectura

```
useKeyboardShortcuts (hook)
    ↓
KeyboardShortcutsProvider (envoltura)
    ↓
layout.tsx (integración global)
    ↓
KeyboardHelpModal (interfaz de ayuda)
```

El sistema es modular y escalable. Se pueden agregar más atajos sin modificar la arquitectura base.
