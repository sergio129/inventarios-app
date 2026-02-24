import { Suspense } from 'react';
import { InventoryContent } from './inventory-content';

function InventoryLoading() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<InventoryLoading />}>
      <InventoryContent />
    </Suspense>
  );
}
