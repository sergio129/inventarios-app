import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import Client from '@/lib/models/Client';
import ClientPurchaseHistory from '@/lib/models/ClientPurchaseHistory';
import { authOptions } from '@/lib/auth';
import { getNowLocal } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const includeReturned = searchParams.get('includeReturned') === 'true';

    // Por defecto, excluir ventas devueltas (para el selector de devoluciones)
    const query = includeReturned ? {} : { estado: { $ne: 'devuelta' } };

    const sales = await Sale.find(query)
      .populate('vendedor', 'name email')
      .sort({ fechaCreacion: -1 });

    return NextResponse.json(sales);

  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { cliente, items, descuento, metodoPago, notas } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Debe incluir al menos un producto' }, { status: 400 });
    }

    await dbConnect();

    // Verificar stock disponible y calcular totales
    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.producto);
      if (!product) {
        return NextResponse.json({ error: `Producto ${item.nombreProducto} no encontrado` }, { status: 400 });
      }

      // Verificar que el producto permita este tipo de venta
      if (!product.puedeVenderComo(item.tipoVenta)) {
        return NextResponse.json({
          error: `El producto ${item.nombreProducto} no se puede vender como ${item.tipoVenta}`
        }, { status: 400 });
      }

      // Calcular unidades que se van a vender
      const unidadesRequeridas = item.tipoVenta === 'empaque'
        ? (product.unidadesPorEmpaque || 1) * item.cantidad
        : item.cantidad;

      // Verificar que hay suficiente stock
      if (product.stock < unidadesRequeridas) {
        const infoStock = product.getInfoStock();
        const stockDisponible = item.tipoVenta === 'empaque'
          ? Math.floor(product.stock / (product.unidadesPorEmpaque || 1))
          : product.stock;
        return NextResponse.json({
          error: `Stock insuficiente para ${item.nombreProducto}. Disponible: ${stockDisponible} ${item.tipoVenta}(s) (${infoStock.cajasCompletas} cajas + ${infoStock.unidadesSueltas} unidades)`
        }, { status: 400 });
      }

      // Usar el precio correcto según el tipo de venta
      const precioCorrecto = product.getPrecio(item.tipoVenta);

      // Recalcular precioTotal si es necesario
      const precioTotalCorrecto = precioCorrecto * item.cantidad;

      subtotal += precioTotalCorrecto;
    }

    // Generar número de factura único
    const fecha = new Date();
    const numeroFactura = `FAC-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    // Validar que el descuento no exceda el 50% de las ganancias totales
    let gananciaTotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.producto);
      if (product) {
        const precioVenta = item.tipoVenta === 'empaque'
          ? (product.precioCaja || product.precio)
          : product.precio;
        const precioCompra = item.tipoVenta === 'empaque'
          ? (product.precioCompraCaja || product.precioCompra)
          : product.precioCompra;
        
        const gananciaUnitaria = precioVenta - precioCompra;
        gananciaTotal += gananciaUnitaria * item.cantidad;
      }
    }

    // El descuento máximo permitido es el 50% de la ganancia total
    const descuentoMaximoEnDinero = (gananciaTotal * 50) / 100;
    const descuentoEnDinero = (subtotal * (descuento || 0)) / 100;

    if (descuentoEnDinero > descuentoMaximoEnDinero) {
      const descuentoMaximoEnPorcentaje = (descuentoMaximoEnDinero / subtotal) * 100;
      return NextResponse.json({
        error: `Descuento no permitido. El máximo descuento permitido es ${descuentoMaximoEnPorcentaje.toFixed(2)}% (basado en el 50% de las ganancias totales de los productos).`
      }, { status: 400 });
    }

    const discountAmount = (subtotal * (descuento || 0)) / 100;
    const total = subtotal - discountAmount;

    const sale = new Sale({
      numeroFactura,
      cliente,
      items,
      subtotal,
      descuento: descuento || 0,
      impuesto: 0, // Por ahora sin impuestos
      total,
      metodoPago: metodoPago || 'efectivo',
      estado: 'completada', // Cambiar a completada ya que se procesa inmediatamente
      vendedor: session.user.id,
      notas,
      fechaVenta: getNowLocal()
    });

    // Actualizar stock de productos
    for (const item of items) {
      const product = await Product.findById(item.producto);
      if (product) {
        try {
          // Usar el nuevo método venderUnidades que maneja cajas y unidades automáticamente
          const unidadesAVender = item.tipoVenta === 'empaque'
            ? (product.unidadesPorEmpaque || 1) * item.cantidad
            : item.cantidad;

          product.venderUnidades(unidadesAVender);
          await product.save();
        } catch (error) {
          return NextResponse.json({
            error: `Error actualizando stock de ${item.nombreProducto}: ${error instanceof Error ? error.message : 'Error desconocido'}`
          }, { status: 400 });
        }
      }
    }

    await sale.save();

    // Actualizar estadísticas del cliente y crear historial de compras
    if (cliente && cliente.cedula) {
      try {
        const cedulaNormalizada = cliente.cedula.toLowerCase().trim();
        
        // Actualizar cliente: incrementar totalCompras y establecer ultimaCompra
        await Client.findOneAndUpdate(
          { cedula: cedulaNormalizada },
          {
            $inc: { totalCompras: 1 },
            ultimaCompra: new Date()
          },
          { new: true }
        );

        // Crear registro de historial de compras
        const purchaseHistory = new ClientPurchaseHistory({
          cliente: {
            cedula: cedulaNormalizada,
            nombre: cliente.nombre || 'Sin nombre'
          },
          numeroFactura: sale.numeroFactura,
          items: sale.items,
          subtotal: sale.subtotal,
          descuento: sale.descuento,
          impuesto: sale.impuesto,
          total: sale.total,
          metodoPago: sale.metodoPago || 'No especificado',
          notas: sale.notas || ''
        });
        
        await purchaseHistory.save();
      } catch (clientError) {
        console.warn('Advertencia: Error actualizando cliente o creando historial:', clientError);
        // No lanzamos error aquí porque la venta ya se creó exitosamente
        // Solo registramos la advertencia
      }
    }

    return NextResponse.json(sale, { status: 201 });

  } catch (error) {
    console.error('Error creando venta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
