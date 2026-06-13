import { useState } from 'react'
import { BuscarVehiculo } from '../components/vehiculos/BuscarVehiculo'
import { ClienteForm } from '../components/clientes/ClienteForm'
import { VehiculoForm } from '../components/vehiculos/VehiculoForm'
import { NuevaOrdenForm } from '../components/ordenes/NuevaOrdenForm'
import { useVehiculoPorPlaca } from '../hooks/useVehiculos'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function NuevaOrden() {
  const [placaBuscada, setPlacaBuscada] = useState('')
  const [clienteIdNuevo, setClienteIdNuevo] = useState<string | null>(null)
  const [vehiculoIdSeleccionado, setVehiculoIdSeleccionado] = useState<string | null>(null)
  
  const { data: vehiculoExistente, isLoading, isError, error } = useVehiculoPorPlaca(placaBuscada)

  const handleBuscar = (placa: string) => {
    setPlacaBuscada(placa)
    setClienteIdNuevo(null)
    setVehiculoIdSeleccionado(null)
  }

  // Lógica de estado para decidir qué mostrar
  const mostrarFormCliente = placaBuscada && !isLoading && !vehiculoExistente && !clienteIdNuevo
  const mostrarFormVehiculo = placaBuscada && !isLoading && !vehiculoExistente && clienteIdNuevo && !vehiculoIdSeleccionado
  
  // El vehículo puede venir de la DB (existente) o de recién haberlo creado
  const vehiculoListoParaOrdenId = (vehiculoExistente && !vehiculoIdSeleccionado) 
    ? vehiculoExistente.id 
    : vehiculoIdSeleccionado

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Registrar Nueva Orden</h1>
      
      {/* Paso 1: Búsqueda */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">1. Identificar Vehículo</h2>
        <BuscarVehiculo onBuscar={handleBuscar} />
        
        {isLoading && <p className="text-blue-500 mt-4">Buscando en base de datos...</p>}
        {isError && <p className="text-red-500 mt-4">Error: {(error as Error).message}</p>}
        
        {vehiculoExistente && !vehiculoIdSeleccionado && (
          <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Vehículo encontrado</p>
              <p className="text-sm text-green-800 mt-1">
                Cliente: {vehiculoExistente.clientes?.nombre} ({vehiculoExistente.clientes?.telefono})<br/>
                Vehículo: {vehiculoExistente.marca} {vehiculoExistente.modelo}
              </p>
            </div>
          </div>
        )}

        {placaBuscada && !isLoading && !vehiculoExistente && !vehiculoIdSeleccionado && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-md border border-yellow-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              No se encontró la placa <strong>{placaBuscada}</strong>. Registraremos el cliente y el vehículo.
            </p>
          </div>
        )}
      </div>

      {/* Paso 2: Registro Cliente (Si no existe) */}
      {mostrarFormCliente && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">2. Registrar Cliente</h2>
          <ClienteForm onSuccess={setClienteIdNuevo} />
        </div>
      )}

      {/* Paso 3: Registro Vehículo (Si no existe) */}
      {mostrarFormVehiculo && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">3. Registrar Vehículo</h2>
          <VehiculoForm 
            clienteId={clienteIdNuevo} 
            placaPrellenada={placaBuscada} 
            onSuccess={setVehiculoIdSeleccionado} 
          />
        </div>
      )}

      {/* Paso 4: Creación de la Orden (Si ya tenemos vehículo identificado) */}
      {vehiculoListoParaOrdenId && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-blue-500">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Detalle de la Orden de Servicio</h2>
          <NuevaOrdenForm vehiculoId={vehiculoListoParaOrdenId} />
        </div>
      )}

    </div>
  )
}
