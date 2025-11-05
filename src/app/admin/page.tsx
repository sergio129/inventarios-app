'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Settings, Users, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const { data: session } = useSession();

  const adminOptions = [
    {
      title: 'Configuración de Empresa',
      description: 'Personaliza el nombre, logo, colores y etiquetas de tu empresa',
      icon: Settings,
      href: '/admin/config',
      color: 'bg-blue-500',
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administra los usuarios y permisos de acceso',
      icon: Users,
      href: '/admin/users',
      color: 'bg-purple-500',
    },
    {
      title: 'Reportes',
      description: 'Genera reportes detallados del sistema',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-2">Bienvenido, {session?.user?.email}</p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Link key={option.href} href={option.href}>
                <div className="h-full bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer border border-gray-200 hover:border-gray-300">
                  <div className={`${option.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.title}</h3>
                  <p className="text-gray-600 text-sm">{option.description}</p>
                  <div className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Ir →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sistema de Gestión Integral</h2>
          <p className="text-gray-700 mb-4">
            Este panel administrativo te permite personalizar completamente tu aplicación de inventario.
            Desde aquí puedes:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-sm font-bold mr-3 flex-shrink-0">✓</span>
              <span>Cambiar el nombre y logo de tu empresa</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-sm font-bold mr-3 flex-shrink-0">✓</span>
              <span>Personalizar colores y temas</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-sm font-bold mr-3 flex-shrink-0">✓</span>
              <span>Modificar todas las etiquetas y textos</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-sm font-bold mr-3 flex-shrink-0">✓</span>
              <span>Gestionar usuarios y permisos</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
