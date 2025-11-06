'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import InventoryManagement from '@/components/inventory-management';

export default function InventoryManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      router.push('/login');
      return;
    }

    // Solo administradores pueden acceder
    if ((session.user as { role?: string })?.role !== 'admin') {
      router.push('/inventory');
      return;
    }
  }, [session, status, router]);

  // Mostrar loading mientras se verifica el acceso
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Solo mostrar el contenido si es admin
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return null;
  }

  return <InventoryManagement />;
}