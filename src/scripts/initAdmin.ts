import dbConnect from '../lib/mongodb';
import User from '../lib/models/User';
import bcrypt from 'bcryptjs';

async function initAdmin() {
  try {
    await dbConnect();

    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('Admin ya existe:', existingAdmin.email);
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 12);

    const admin = new User({
      name: 'Administrador',
      email: 'admin@inventariosapp.com',
      password: hashedPassword,
      role: 'admin',
      activo: true,
      fecha_activacion: new Date(),
    });

    await admin.save();

    console.log('Admin creado exitosamente:', admin.email);
    console.log('Contraseña: admin123');
  } catch (error) {
    console.error('Error creando admin:', error);
  } finally {
    process.exit();
  }
}

initAdmin();
