'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';
import { memo } from 'react';

interface Product {
  _id: string;
  nombre: string;
  precioCompra: number;
  precioCompraCaja: number;
  precio: number;
  precioCaja: number;
  stockCajas: number;
  unidadesPorCaja: number;
  stockUnidadesSueltas: number;
  stock: number;
}

interface InventoryDashboardProps {
  products: Product[];
}

export const InventoryDashboard = memo(function InventoryDashboard({ products }: InventoryDashboardProps) {
  // Calcular totales
  const calculateTotals = () => {
    let totalInvested = 0;
    let totalSalesValue = 0;

    products.forEach((product) => {
      // Calcular el valor invertido (precioCompra * cantidad total)
      const totalUnits = product.stockCajas * (product.unidadesPorCaja || 1) + (product.stockUnidadesSueltas || 0);
      const unitCost = product.precioCompra || 0;
      totalInvested += unitCost * totalUnits;

      // Calcular el valor de venta potencial (precio * cantidad total)
      const unitPrice = product.precio || 0;
      totalSalesValue += unitPrice * totalUnits;
    });

    return { totalInvested, totalSalesValue };
  };

  const { totalInvested, totalSalesValue } = calculateTotals();
  const potentialProfit = totalSalesValue - totalInvested;
  const profitMargin = totalInvested > 0 ? ((potentialProfit / totalInvested) * 100).toFixed(2) : '0.00';

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: Total Invertido */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 to-transparent pointer-events-none" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              Capital Invertido
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600 text-xs mt-1">
            Valor total de compra del inventario actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-4xl font-bold bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                En <span className="font-semibold text-gray-900">{products.length}</span> productos activos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Valor de Venta Potencial */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-600/10 to-transparent pointer-events-none" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Valor de Venta
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600 text-xs mt-1">
            Valor potencial de venta del inventario actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-4xl font-bold bg-linear-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                {formatCurrency(totalSalesValue)}
              </p>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                A precio de venta actual
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Ganancia Potencial */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-purple-600/10 to-transparent pointer-events-none" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className={`p-2 rounded-lg shadow-lg ${potentialProfit >= 0 ? 'bg-linear-to-br from-purple-500 to-purple-600' : 'bg-linear-to-br from-red-500 to-red-600'}`}>
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              Ganancia Potencial
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600 text-xs mt-1">
            Diferencia entre venta e inversión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className={`text-4xl font-bold ${potentialProfit >= 0 ? 'bg-linear-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent' : 'text-red-600'}`}>
                {formatCurrency(potentialProfit)}
              </p>
            </div>
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Margen: <span className={`font-semibold ${potentialProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>{profitMargin}%</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default InventoryDashboard;
