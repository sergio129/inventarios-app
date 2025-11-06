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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/inventory')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Inventario
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="h-8 w-8 text-blue-600" />
              Categorías
            </h1>
            <p className="text-gray-600">Gestiona las categorías de productos</p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Categoría</DialogTitle>
              <DialogDescription>
                Agrega una nueva categoría para clasificar tus productos
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-nombre" className="text-right">
                  Nombre *
                </Label>
                <Input
                  id="create-nombre"
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                  className="col-span-3"
                  placeholder="Ej: Analgésicos, Antibióticos"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-descripcion" className="text-right">
                  Descripción
                </Label>
                <Input
                  id="create-descripcion"
                  value={createForm.descripcion}
                  onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
                  className="col-span-3"
                  placeholder="Descripción opcional de la categoría"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={createCategory} className="bg-blue-600 hover:bg-blue-700">
                Crear Categoría
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías ({filteredCategories.length})</CardTitle>
          <CardDescription>
            Lista completa de categorías disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category._id}>
                  <TableCell className="font-medium">{category.nombre}</TableCell>
                  <TableCell>{category.descripcion || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={category.activo ? "default" : "secondary"}>
                      {category.activo ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activa
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactiva
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(category.fechaCreacion).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCategory(category)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCategories.length === 0 && (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron categorías</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica la información de la categoría
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-nombre" className="text-right">
                Nombre *
              </Label>
              <Input
                id="edit-nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-descripcion" className="text-right">
                Descripción
              </Label>
              <Input
                id="edit-descripcion"
                value={editForm.descripcion}
                onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-activo" className="text-right">
                Estado
              </Label>
              <Select
                value={editForm.activo ? 'active' : 'inactive'}
                onValueChange={(value) => setEditForm({ ...editForm, activo: value === 'active' })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="inactive">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={updateCategory} className="bg-blue-600 hover:bg-blue-700">
              Actualizar Categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
