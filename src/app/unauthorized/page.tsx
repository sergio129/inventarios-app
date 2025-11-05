'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
        <p className="text-gray-600 mb-8">
          No tienes permisos para acceder a esta área. Solo los administradores pueden acceder aquí.
        </p>

        <Link href="/dashboard">
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Home className="h-5 w-5" />
            Volver al Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
