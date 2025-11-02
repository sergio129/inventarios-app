import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mx-auto mb-6 h-16 w-16 bg-orange-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-2xl">IA</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenido a Inventarios-app
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Sistema de gestión de inventario para control de stock y ventas de comidas rápidas.</p>
        <div className="space-x-4">
          <Link href="/login">
            <Button className="bg-purple-600 hover:bg-purple-700">Iniciar Sesión</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">Registrarse</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
