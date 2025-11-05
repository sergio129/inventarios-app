'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, Users, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any)?.role;
      if (userRole !== 'admin') {
        router.push('/unauthorized');
      }
    }
  }, [status, session, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  if ((session?.user as any)?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:w-64 md:bg-gray-900 md:overflow-y-auto md:flex md:flex-col">
        <div className="flex items-center justify-center h-16 flex-shrink-0 bg-gray-900 border-r border-gray-700">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/admin/config"
            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"
          >
            <Settings className="h-5 w-5" />
            <span>Configuración</span>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"
          >
            <Users className="h-5 w-5" />
            <span>Usuarios</span>
          </Link>
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <p className="truncate">{session?.user?.email}</p>
            <p className="text-gray-500">Administrador</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        {children}
      </div>
    </div>
  );
}
