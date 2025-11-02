import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    await dbConnect();

    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin ya existe', email: existingAdmin.email });
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

    return NextResponse.json({
      message: 'Admin creado exitosamente',
      email: admin.email,
      password: 'admin123'
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
