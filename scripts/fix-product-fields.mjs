import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Por favor define la variable MONGODB_URI en .env.local');
}

// Esquema simplificado de Product
const ProductSchema = new mongoose.Schema({
  nombre: String,
  precio: Number,
  precioCaja: Number,
  precioCompra: Number,
  precioCompraCaja: Number,
  stock: Number,
  stockCajas: Number,
  unidadesPorCaja: Number,
  unidadesPorEmpaque: Number,
  stockUnidadesSueltas: Number,
  tipoVenta: String,
  precioPorUnidad: Number,
  precioPorEmpaque: Number,
  activo: Boolean
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function fixProductFields() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar todos los productos (activos e inactivos)
    const products = await Product.find({});
    console.log(`\n📦 Encontrados ${products.length} productos totales\n`);

    let fixed = 0;
    let skipped = 0;

    for (const product of products) {
      let needsUpdate = false;
      const updates = {};

      console.log(`\n🔍 Analizando: ${product.nombre}`);
      console.log(`   - Stock total: ${product.stock}`);
      console.log(`   - Cajas: ${product.stockCajas || 0}`);
      console.log(`   - Unidades por caja: ${product.unidadesPorCaja || 'NO DEFINIDO'}`);
      console.log(`   - Unidades por empaque: ${product.unidadesPorEmpaque || 'NO DEFINIDO'}`);
      console.log(`   - Unidades sueltas: ${product.stockUnidadesSueltas || 0}`);
      console.log(`   - Precio unitario: $${product.precio}`);
      console.log(`   - Precio caja: $${product.precioCaja || 'NO DEFINIDO'}`);
      console.log(`   - precioPorUnidad: $${product.precioPorUnidad || 'NO DEFINIDO'}`);
      console.log(`   - precioPorEmpaque: $${product.precioPorEmpaque || 'NO DEFINIDO'}`);

      // 1. Sincronizar unidadesPorEmpaque con unidadesPorCaja
      if (product.unidadesPorCaja && !product.unidadesPorEmpaque) {
        updates.unidadesPorEmpaque = product.unidadesPorCaja;
        needsUpdate = true;
        console.log(`   ✏️  Se agregará unidadesPorEmpaque = ${product.unidadesPorCaja}`);
      } else if (!product.unidadesPorCaja && product.unidadesPorEmpaque) {
        updates.unidadesPorCaja = product.unidadesPorEmpaque;
        needsUpdate = true;
        console.log(`   ✏️  Se agregará unidadesPorCaja = ${product.unidadesPorEmpaque}`);
      } else if (!product.unidadesPorCaja && !product.unidadesPorEmpaque) {
        // Si no tiene ninguno, usar 1 por defecto
        updates.unidadesPorCaja = 1;
        updates.unidadesPorEmpaque = 1;
        needsUpdate = true;
        console.log(`   ⚠️  No tiene unidades por caja definidas, se usará 1`);
      }

      // 2. Sincronizar precioPorUnidad con precio
      if (!product.precioPorUnidad && product.precio) {
        updates.precioPorUnidad = product.precio;
        needsUpdate = true;
        console.log(`   ✏️  Se agregará precioPorUnidad = $${product.precio}`);
      }

      // 3. Sincronizar precioPorEmpaque con precioCaja
      const unidadesPorEmpaque = product.unidadesPorEmpaque || product.unidadesPorCaja || updates.unidadesPorEmpaque || 1;
      if (!product.precioPorEmpaque) {
        if (product.precioCaja) {
          updates.precioPorEmpaque = product.precioCaja;
          console.log(`   ✏️  Se agregará precioPorEmpaque = $${product.precioCaja} (desde precioCaja)`);
        } else if (product.precio) {
          // Calcular precio por empaque: precio unitario * unidades por empaque
          updates.precioPorEmpaque = product.precio * unidadesPorEmpaque;
          console.log(`   ✏️  Se calculará precioPorEmpaque = $${product.precio} × ${unidadesPorEmpaque} = $${updates.precioPorEmpaque}`);
        }
        needsUpdate = true;
      }

      // 4. Establecer tipoVenta si no existe
      if (!product.tipoVenta) {
        updates.tipoVenta = 'ambos';
        needsUpdate = true;
        console.log(`   ✏️  Se agregará tipoVenta = 'ambos'`);
      }

      if (needsUpdate) {
        await Product.updateOne({ _id: product._id }, { $set: updates });
        fixed++;
        console.log(`   ✅ Producto actualizado`);
      } else {
        skipped++;
        console.log(`   ⏭️  Producto ya está correcto`);
      }
    }

    console.log(`\n\n📊 RESUMEN:`);
    console.log(`   ✅ Productos actualizados: ${fixed}`);
    console.log(`   ⏭️  Productos sin cambios: ${skipped}`);
    console.log(`   📦 Total procesados: ${products.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Desconectado de MongoDB');
  }
}

fixProductFields();
