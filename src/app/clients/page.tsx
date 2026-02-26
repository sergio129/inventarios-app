'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, User, Search, Mail, Phone, History } from 'lucide-react';
import { ClientPurchaseHistory } from '@/components/client-purchase-history';
import { toast } from 'sonner';

interface Client {
  _id?: string;
  nombre: string;
  cedula: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  estado?: 'activo' | 'inactivo';
  totalCompras?: number;
  ultimaCompra?: Date;
  createdAt?: Date;
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      router.push('/login');
      return;
    }

    fetchClients();
  }, [session, status, router]);

  const fetchClients = async () => {
    try {
      // Obtener todos los clientes del API con parámetro all=true
      const response = await fetch('/api/clients?all=true');
      if (response.ok) {
        const data = await response.json();
        const clients = Array.isArray(data) ? data : [];
        setClients(clients);
      } else {
        toast.error('Error al cargar clientes');
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error de conexión');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cedula?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefono?.includes(searchTerm)
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.cedula.trim()) {
      toast.error('Nombre y cédula son requeridos');
      return;
    }

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          cedula: formData.cedula,
          telefono: formData.telefono,
          email: formData.email,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
        }),
      });

      if (response.ok) {
        toast.success('Cliente guardado exitosamente');
        setFormData({
          nombre: '',
          cedula: '',
          email: '',
          telefono: '',
          direccion: '',
          ciudad: '',
        });
        setIsDialogOpen(false);
        fetchClients();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar cliente');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Error de conexión');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !session.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 -z-10" />

      <div className="container mx-auto px-6 py-8 relative">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Clientes
                  </h1>
                  <p className="text-gray-600 text-lg">Gestión de clientes y compras</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white transition-all duration-200 shadow-md">
                    <Plus className="h-4 w-4" />
                    Nuevo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                    <DialogDescription>
                      Ingresa los datos del cliente. Nombre y cédula son requeridos.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddClient} className="space-y-4">
                    <div>
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        placeholder="Nombre completo"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cedula">Cédula/RUC *</Label>
                      <Input
                        id="cedula"
                        name="cedula"
                        placeholder="Cédula o RUC"
                        value={formData.cedula}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        placeholder="Número de teléfono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion">Dirección</Label>
                      <Input
                        id="direccion"
                        name="direccion"
                        placeholder="Dirección completa"
                        value={formData.direccion}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <Input
                        id="ciudad"
                        name="ciudad"
                        placeholder="Ciudad"
                        value={formData.ciudad}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Guardar Cliente
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                onClick={() => router.push('/sales')}
                variant="outline"
                className="flex items-center gap-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </div>
          </div>
        </div>

        {/* Clientes List */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Lista de Clientes
            </CardTitle>
            <CardDescription className="text-gray-600">
              Total: {clients.length} clientes registrados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, cédula, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredClients.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Nombre</TableHead>
                      <TableHead className="font-semibold">Cédula</TableHead>
                      <TableHead className="font-semibold">Teléfono</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold text-center">Compras</TableHead>
                      <TableHead className="font-semibold">Última Compra</TableHead>
                      <TableHead className="font-semibold text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.cedula} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-semibold text-gray-900">
                          {client.nombre}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-gray-600">
                          {client.cedula}
                        </TableCell>
                        <TableCell className="text-sm">
                          {client.telefono ? (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {client.telefono}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {client.email ? (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="truncate max-w-xs">{client.email}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {client.totalCompras || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {client.ultimaCompra
                            ? new Date(client.ultimaCompra).toLocaleDateString()
                            : <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedClientForHistory(client);
                              setIsHistoryOpen(true);
                            }}
                            className="flex items-center gap-1 mx-auto"
                            title="Ver historial de compras"
                          >
                            <History className="h-4 w-4" />
                            Historial
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">
                  {searchTerm
                    ? 'No se encontraron clientes'
                    : 'No hay clientes registrados'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Historial de Compras */}
      {selectedClientForHistory && (
        <ClientPurchaseHistory
          cedula={selectedClientForHistory.cedula}
          isOpen={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          clientName={selectedClientForHistory.nombre}
        />
      )}
    </div>
  );
}
