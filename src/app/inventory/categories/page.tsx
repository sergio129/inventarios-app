'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag, Plus, Search, Edit, Trash2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { FloatingCart } from '@/components/floating-cart-new';

interface Category {
  _id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fechaCreacion: string;
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [createForm, setCreateForm] = useState({
    nombre: '',
    descripcion: ''
  });
  const [editForm, setEditForm] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      router.push('/login');
      return;
    }

    // Solo administradores pueden acceder a categorías
    if ((session.user as { role?: string })?.role !== 'admin') {
      router.push('/inventory');
      return;
    }

    fetchCategories();
  }, [session, status, router]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        toast.error('Error al cargar categorías');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = useCallback(() => {
    let filtered = categories;

    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.descripcion && category.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(category =>
        statusFilter === 'active' ? category.activo : !category.activo
      );
    }

    setFilteredCategories(filtered);
  }, [categories, searchTerm, statusFilter]);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm, statusFilter, filterCategories]);

  const createCategory = async () => {
    if (!createForm.nombre.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        toast.success('Categoría creada exitosamente');
        setIsCreateDialogOpen(false);
        setCreateForm({ nombre: '', descripcion: '' });
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear categoría');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Error de conexión');
    }
  };

  const updateCategory = async () => {
    if (!editForm.nombre.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }

    if (!editingCategory) return;

    try {
      const response = await fetch(`/api/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success('Categoría actualizada exitosamente');
        setIsEditDialogOpen(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar categoría');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Error de conexión');
    }
  };

  const deleteCategory = async (category: Category) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.nombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${category._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Categoría eliminada exitosamente');
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar categoría');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Error de conexión');
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setEditForm({
      nombre: category.nombre,
      descripcion: category.descripcion || '',
      activo: category.activo
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <FloatingCart />
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/inventory')}
            className="border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Inventario
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2 mb-2">
              <Tag className="h-10 w-10 text-indigo-600" />
              Gestión de Categorías
            </h1>
            <p className="text-gray-600">Gestiona las categorías de productos</p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-lg px-6">
              <Plus className="h-5 w-5 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white rounded-xl">
            <DialogHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-xl -m-6 mb-6 p-6 pb-4">
              <DialogTitle className="text-white text-xl font-bold">Crear Nueva Categoría</DialogTitle>
              <DialogDescription className="text-indigo-100 mt-2">
                Agrega una nueva categoría para clasificar tus productos
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-nombre" className="text-sm font-bold text-gray-700">
                  Nombre *
                </Label>
                <Input
                  id="create-nombre"
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                  placeholder="Ej: Analgésicos, Antibióticos"
                  className="border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 hover:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-descripcion" className="text-sm font-bold text-gray-700">
                  Descripción
                </Label>
                <Input
                  id="create-descripcion"
                  value={createForm.descripcion}
                  onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
                  placeholder="Descripción opcional"
                  className="border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end border-t-2 border-gray-200 pt-4">
              <Button 
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </Button>
              <Button type="submit" onClick={createCategory} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-lg">
                ✓ Crear
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-0 shadow-lg bg-white rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-gray-200 py-5">
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            🔍 Búsqueda y Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm font-bold text-gray-700 mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-indigo-400" />
                <Input
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 hover:bg-white transition-all"
                />
              </div>
            </div>
            <div className="sm:w-[250px]">
              <Label className="text-sm font-bold text-gray-700 mb-2 block">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-2 border-gray-200 rounded-lg focus:border-blue-500 bg-gray-50 hover:bg-white transition-all font-medium">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">✓ Todas</SelectItem>
                  <SelectItem value="active">🟢 Activas</SelectItem>
                  <SelectItem value="inactive">🔴 Inactivas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card className="border-0 shadow-lg bg-white rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-gray-200 py-5">
          <CardTitle className="text-indigo-900 text-xl">📋 Categorías ({filteredCategories.length})</CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            Lista de categorías disponibles
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                  <TableHead className="font-bold text-gray-700 py-4 px-4">Nombre</TableHead>
                  <TableHead className="font-bold text-gray-700 py-4 px-4">Descripción</TableHead>
                  <TableHead className="font-bold text-gray-700 py-4 px-4">Estado</TableHead>
                  <TableHead className="font-bold text-gray-700 py-4 px-4">Fecha Creación</TableHead>
                  <TableHead className="text-right font-bold text-gray-700 py-4 px-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <TableCell className="font-bold text-gray-900 py-4 px-4">{category.nombre}</TableCell>
                    <TableCell className="text-gray-700 py-4 px-4">{category.descripcion || <span className="text-gray-400">-</span>}</TableCell>
                    <TableCell className="py-4 px-4">
                      <Badge className={category.activo ? "bg-green-100 text-green-800 font-bold" : "bg-red-100 text-red-800 font-bold"}>
                        {category.activo ? (
                          <>
                            <span className="mr-1">🟢</span>
                            Activa
                          </>
                        ) : (
                          <>
                            <span className="mr-1">🔴</span>
                            Inactiva
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-4 text-sm">
                      {new Date(category.fechaCreacion).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="text-right py-4 px-4">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => openEditDialog(category)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => deleteCategory(category)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No se encontraron categorías</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-xl">
          <DialogHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-xl -m-6 mb-6 p-6 pb-4">
            <DialogTitle className="text-white text-xl font-bold">Editar Categoría</DialogTitle>
            <DialogDescription className="text-indigo-100 mt-2">
              Modifica la información de la categoría
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre" className="text-sm font-bold text-gray-700">
                Nombre *
              </Label>
              <Input
                id="edit-nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                className="border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 hover:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descripcion" className="text-sm font-bold text-gray-700">
                Descripción
              </Label>
              <Input
                id="edit-descripcion"
                value={editForm.descripcion}
                onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                className="border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-activo" className="text-sm font-bold text-gray-700">
                Estado
              </Label>
              <Select
                value={editForm.activo ? 'active' : 'inactive'}
                onValueChange={(value) => setEditForm({ ...editForm, activo: value === 'active' })}
              >
                <SelectTrigger className="border-2 border-gray-200 rounded-lg focus:border-green-500 bg-gray-50 hover:bg-white transition-all font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">🟢 Activa</SelectItem>
                  <SelectItem value="inactive">🔴 Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 justify-end border-t-2 border-gray-200 pt-4">
            <Button 
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </Button>
            <Button type="submit" onClick={updateCategory} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-lg">
              ✓ Actualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
