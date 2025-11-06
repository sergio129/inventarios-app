'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Phone, Search, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ClientData {
  cedula: string;
  nombre: string;
  telefono: string;
  email?: string;
  ultimaCompra?: Date;
  totalCompras?: number;
}

interface QuickClientInputProps {
  onClientSelect: (client: ClientData) => void;
  currentClient?: ClientData;
}

export function QuickClientInput({ onClientSelect, currentClient }: QuickClientInputProps) {
  const [cedula, setCedula] = useState(currentClient?.cedula ?? '');
  const [nombre, setNombre] = useState(currentClient?.nombre ?? '');
  const [telefono, setTelefono] = useState(currentClient?.telefono ?? '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ClientData[]>([]);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [esNuevoCliente, setEsNuevoCliente] = useState(false);
  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);

  // Sincronizar cuando currentClient cambia
  useEffect(() => {
    if (currentClient) {
      setCedula(currentClient.cedula ?? '');
      setNombre(currentClient.nombre ?? '');
      setTelefono(currentClient.telefono ?? '');
      setClienteEncontrado(true);
      setEsNuevoCliente(false);
    }
  }, [currentClient?.cedula, currentClient?.nombre, currentClient?.telefono]);

  // Buscar clientes por cédula
  const searchClients = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      setClienteEncontrado(false);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/clients?search=${searchTerm}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
        // No marcar como encontrado si no hay resultados
      }
    } catch (error) {
      console.error('Error searching clients:', error);
    }
  }, []);

  // Buscar cuando cambia la cédula
  useEffect(() => {
    if (cedula && cedula.length >= 2) {
      searchClients(cedula);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [cedula, searchClients]);

  // Seleccionar cliente existente
  const selectSuggestion = (client: ClientData) => {
    setCedula(client.cedula);
    setNombre(client.nombre);
    setTelefono(client.telefono);
    setShowSuggestions(false);
    setClienteEncontrado(true);
    setEsNuevoCliente(false);
    setMostrarFormularioNuevo(false);
    onClientSelect(client);
    toast.success(`Cliente: ${client.nombre}`);
  };

  // Confirmar nuevo cliente (pendiente de guardar en BD)
  const confirmarNuevoCliente = () => {
    if (!cedula || !nombre) {
      toast.error('Cédula y nombre son requeridos');
      return;
    }

    const newClient: ClientData = {
      cedula,
      nombre,
      telefono: telefono || ''
    };

    setEsNuevoCliente(true);
    setClienteEncontrado(true);
    setMostrarFormularioNuevo(false);
    setShowSuggestions(false);
    onClientSelect(newClient);
    toast.success(`Cliente temporal: ${nombre} (se guardará al finalizar la compra)`);
  };

  // Limpiar cliente
  const clearClient = () => {
    setCedula('');
    setNombre('');
    setTelefono('');
    setSuggestions([]);
    setShowSuggestions(false);
    setClienteEncontrado(false);
    setEsNuevoCliente(false);
    setMostrarFormularioNuevo(false);
    onClientSelect({ cedula: '', nombre: '', telefono: '' });
  };

  return (
    <div className="space-y-3">
      {/* Entrada principal de cédula */}
      <div className="relative">
        <div className="absolute left-3 top-3.5 text-indigo-400">
          <Search className="h-5 w-5" />
        </div>
        <Input
          placeholder="Cédula o nombre del cliente..."
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          className="pl-10 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 hover:bg-white transition-all text-base"
          onFocus={() => cedula.length >= 2 && setShowSuggestions(true)}
        />
        {cedula && (
          <button
            onClick={clearClient}
            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Sugerencias de clientes encontrados */}
      {showSuggestions && cedula.length >= 2 && (
        <div className="bg-white border-2 border-indigo-200 rounded-lg shadow-lg p-2 space-y-1 max-h-48 overflow-y-auto z-50">
          {suggestions.length > 0 ? (
            // Mostrar clientes encontrados
            suggestions.map((client) => (
              <button
                key={client.cedula}
                onClick={() => selectSuggestion(client)}
                className="w-full text-left p-2 hover:bg-indigo-50 rounded transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{client.nombre}</div>
                    <div className="text-sm text-gray-600">Cédula: {client.cedula}</div>
                    {client.telefono && (
                      <div className="text-xs text-gray-500">{client.telefono}</div>
                    )}
                  </div>
                  {client.totalCompras && (
                    <Badge variant="secondary" className="ml-2">
                      {client.totalCompras} compras
                    </Badge>
                  )}
                </div>
              </button>
            ))
          ) : (
            // Si no hay resultados, mostrar opción de crear
            <button
              onClick={() => setMostrarFormularioNuevo(true)}
              className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100 rounded transition-colors border border-amber-200"
            >
              <div className="flex items-center gap-2 text-amber-700 font-semibold">
                <AlertCircle className="h-4 w-4" />
                <div>
                  <div>Cliente no encontrado</div>
                  <div className="text-xs font-normal text-amber-600">
                    Clic para crear nuevo cliente con cédula: {cedula}
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Formulario para nuevo cliente */}
      {mostrarFormularioNuevo && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 space-y-3">
          <div className="font-semibold text-blue-900 text-sm">
            Información del Cliente Nuevo
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Nombre completo del cliente"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Teléfono <span className="text-gray-400">(opcional)</span>
            </label>
            <Input
              placeholder="Número de teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={confirmarNuevoCliente}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Confirmar
            </Button>
            <Button
              onClick={() => {
                setMostrarFormularioNuevo(false);
                setNombre('');
                setTelefono('');
              }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Mostrar cliente seleccionado */}
      {clienteEncontrado && nombre && cedula && (
        <div className={`border-2 p-4 rounded-lg space-y-2 ${
          esNuevoCliente
            ? 'bg-blue-50 border-blue-300'
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                <span className="font-bold text-gray-900 text-lg">{nombre}</span>
                {esNuevoCliente && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    Nuevo (pendiente)
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-700 ml-7">
                <span className="font-semibold">Cédula:</span> <span className="font-mono">{cedula}</span>
              </div>
              {telefono && (
                <div className="text-sm text-gray-700 ml-7 flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{telefono}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
