import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Sale from '@/lib/models/Sale';
import User from '@/lib/models/User';
import Category from '@/lib/models/Category';

export async function POST() {
  try {
    await dbConnect();

    // Crear categorías de ejemplo para retail/comida rápida
    const categoriasEjemplo = [
      {
        nombre: 'Bebidas',
        descripcion: 'Bebidas frías y calientes',
        activo: true
      },
      {
        nombre: 'Alimentos Procesados',
        descripcion: 'Snacks y alimentos empacados',
        activo: true
      },
      {
        nombre: 'Lácteos',
        descripcion: 'Productos lácteos y derivados',
        activo: true
      },
      {
        nombre: 'Condimentos y Salsas',
        descripcion: 'Salsas, condimentos y especias',
        activo: true
      },
      {
        nombre: 'Congelados',
        descripcion: 'Productos congelados listos para cocinar',
        activo: true
      },
      {
        nombre: 'Pan y Pastelería',
        descripcion: 'Pan, pasteles y productos de panadería',
        activo: true
      }
    ];

    // Insertar categorías si no existen
    for (const categoria of categoriasEjemplo) {
      const existe = await Category.findOne({ nombre: categoria.nombre });
      if (!existe) {
        await Category.create(categoria);
      }
    }

    console.log('Categorías de ejemplo creadas');

    // Crear productos de ejemplo para retail/comida rápida
    const productosEjemplo = [
      {
        nombre: 'Coca Cola 2L',
        descripcion: 'Bebida gaseosa clásica',
        precio: 8500,
        precioCompra: 6000,
        stock: 150,
        stockMinimo: 20,
        categoria: 'Bebidas',
        marca: 'Coca Cola',
        activo: true
      },
      {
        nombre: 'Papas Fritas Lay\'s 200g',
        descripcion: 'Snack de papas fritas crujientes',
        precio: 5200,
        precioCompra: 3800,
        stock: 120,
        stockMinimo: 15,
        categoria: 'Alimentos Procesados',
        marca: 'Lay\'s',
        activo: true
      },
      {
        nombre: 'Yogur Griego 500g',
        descripcion: 'Yogur griego natural cremoso',
        precio: 7800,
        precioCompra: 5500,
        stock: 80,
        stockMinimo: 10,
        categoria: 'Lácteos',
        marca: 'Danone',
        activo: true
      },
      {
        nombre: 'Salsa de Tomate DIFFER 4000gr',
        descripcion: 'Salsa de tomate para pizzas y pastas',
        precio: 58500,
        precioCompra: 45000,
        stock: 90,
        stockMinimo: 12,
        categoria: 'Condimentos y Salsas',
        marca: 'DIFFER',
        activo: true
      },
      {
        nombre: 'Alitas de Pollo Congeladas 1kg',
        descripcion: 'Alitas de pollo listas para freír',
        precio: 24500,
        precioCompra: 17000,
        stock: 110,
        stockMinimo: 18,
        categoria: 'Congelados',
        marca: 'Fripollo',
        activo: true
      }
    ];

    // Insertar productos
    const productosInsertados = await Product.insertMany(productosEjemplo);
    console.log(`Insertados ${productosInsertados.length} productos`);

    // Obtener un usuario vendedor para las ventas
    const vendedor = await User.findOne({ role: 'vendedor', activo: true });
    if (!vendedor) {
      return Response.json({ error: 'No hay vendedores activos' }, { status: 400 });
    }

    // Crear ventas de ejemplo
    const ventasEjemplo = [];
    const hoy = new Date();

    for (let i = 0; i < 10; i++) {
      const fechaVenta = new Date(hoy);
      fechaVenta.setDate(fechaVenta.getDate() - Math.floor(Math.random() * 30)); // Últimos 30 días

      const productosAleatorios = productosInsertados
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1); // 1-3 productos por venta

      const items = productosAleatorios.map(producto => ({
        producto: producto._id,
        nombreProducto: producto.nombre,
        cantidad: Math.floor(Math.random() * 3) + 1,
        precioUnitario: producto.precio,
        precioTotal: 0 // Se calculará automáticamente
      }));

      // Calcular totales
      const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
      const descuento = Math.random() < 0.3 ? Math.floor(subtotal * 0.1) : 0; // 30% de descuento
      const impuesto = Math.floor((subtotal - descuento) * 0.19); // IVA 19%
      const total = subtotal - descuento + impuesto;

      // Actualizar precioTotal de items
      items.forEach(item => {
        item.precioTotal = item.cantidad * item.precioUnitario;
      });

      const venta = {
        numeroFactura: `FAC-${String(1000 + i).padStart(4, '0')}`,
        cliente: Math.random() < 0.7 ? {
          nombre: `Cliente ${i + 1}`,
          cedula: `12345678${i}`,
          telefono: `30012345${i}`
        } : undefined,
        items,
        subtotal,
        descuento,
        impuesto,
        total,
        metodoPago: ['efectivo', 'tarjeta', 'transferencia'][Math.floor(Math.random() * 3)],
        estado: ['completada', 'pendiente', 'cancelada'][Math.floor(Math.random() * 3)],
        vendedor: vendedor._id,
        fechaVenta
      };

      ventasEjemplo.push(venta);
    }

    // Insertar ventas
    const ventasInsertadas = await Sale.insertMany(ventasEjemplo);
    console.log(`Insertadas ${ventasInsertadas.length} ventas`);

    return Response.json({
      message: 'Datos de ejemplo creados exitosamente',
      productos: productosInsertados.length,
      ventas: ventasInsertadas.length
    });

  } catch (error) {
    console.error('Error creando datos de ejemplo:', error);
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
