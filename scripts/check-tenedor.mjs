import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Por favor define la variable MONGODB_URI en .env.local');
}

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function checkTenedor() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const product = await Product.findOne({ nombre: /TENEDOR MARPLAST/i });
    
    if (!product) {
      console.log('❌ Producto TENEDOR MARPLAST no encontrado');
      return;
    }

    console.log('📦 TENEDOR MARPLAST - Estado actual:\n');
    console.log('   Stock:');
    console.log(`      - Total unidades: ${product.stock}`);
    console.log(`      - Cajas completas: ${product.stockCajas || 0}`);
    console.log(`      - Unidades sueltas: ${product.stockUnidadesSueltas || 0}`);
    console.log(`      - Unidades por caja: ${product.unidadesPorCaja || 'NO DEFINIDO'}`);
    console.log(`      - Unidades por empaque: ${product.unidadesPorEmpaque || 'NO DEFINIDO'}`);
    console.log('\n   Precios:');
    console.log(`      - precio (base): $${product.precio}`);
    console.log(`      - precioCaja: $${product.precioCaja || 'NO DEFINIDO'}`);
    console.log(`      - precioPorUnidad: $${product.precioPorUnidad || 'NO DEFINIDO'}`);
    console.log(`      - precioPorEmpaque: $${product.precioPorEmpaque || 'NO DEFINIDO'}`);
    console.log('\n   Configuración:');
    console.log(`      - tipoVenta: ${product.tipoVenta || 'NO DEFINIDO'}`);
    console.log(`      - activo: ${product.activo}`);

    console.log('\n\n🧪 SIMULACIÓN DE VENTA:\n');
    const unidadesPorCaja = product.unidadesPorEmpaque || product.unidadesPorCaja || 1;
    console.log(`   Si vendes 1 caja:`);
    console.log(`      - Se deberían descontar: 1 × ${unidadesPorCaja} = ${unidadesPorCaja} unidades`);
    console.log(`      - Stock quedaría en: ${product.stock} - ${unidadesPorCaja} = ${product.stock - unidadesPorCaja} unidades`);
    
    console.log(`\n   Si vendes 1 unidad:`);
    console.log(`      - Se debería descontar: 1 unidad`);
    console.log(`      - Stock quedaría en: ${product.stock} - 1 = ${product.stock - 1} unidades`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

checkTenedor();
