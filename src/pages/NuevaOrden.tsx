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
    <div className="max-w-4xl mx-auto pb-12 px-4 md:px-0">
      <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Registrar Nueva Orden</h1>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-8">Ingreso de clientes, vehículos y apertura de órdenes</p>
      
      {/* Paso 1: Búsqueda */}
      <div className="neumorphic-outset p-7 rounded-[2rem] border-none mb-8">
        <h2 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200/40 dark:border-slate-800/40 pb-3 mb-5">1. Identificar Vehículo</h2>
        <BuscarVehiculo onBuscar={handleBuscar} />
        
        {isLoading && <p className="text-blue-500 mt-4 font-semibold text-sm animate-pulse">Buscando en base de datos...</p>}
        {isError && <p className="text-red-500 mt-4 font-semibold text-sm">Error: {(error as Error).message}</p>}
        
        {vehiculoExistente && !vehiculoIdSeleccionado && (
          <div className="mt-5 p-4 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 rounded-2xl flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-extrabold text-sm uppercase tracking-wider text-emerald-900 dark:text-emerald-300">Vehículo encontrado</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                Cliente: <strong className="text-emerald-900 dark:text-emerald-200">{vehiculoExistente.clientes?.nombre}</strong> ({vehiculoExistente.clientes?.telefono})<br/>
                Vehículo: <strong className="text-emerald-900 dark:text-emerald-200">{vehiculoExistente.marca} {vehiculoExistente.modelo}</strong> (Placa: {vehiculoExistente.placa})
              </p>
            </div>
          </div>
        )}

        {placaBuscada && !isLoading && !vehiculoExistente && !vehiculoIdSeleccionado && (
          <div className="mt-5 p-4 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs font-semibold leading-relaxed text-amber-700 dark:text-amber-400">
              No se encontró ningún vehículo con la placa <strong className="text-amber-900 dark:text-amber-200 uppercase tracking-widest">{placaBuscada}</strong>. A continuación registraremos el cliente y el vehículo.
            </p>
          </div>
        )}
      </div>

      {/* Paso 2: Registro Cliente (Si no existe) */}
      {mostrarFormCliente && (
        <div className="neumorphic-outset p-7 rounded-[2rem] border-none mb-8">
          <ClienteForm onSuccess={setClienteIdNuevo} />
        </div>
      )}

      {/* Paso 3: Registro Vehículo (Si no existe) */}
      {mostrarFormVehiculo && (
        <div className="neumorphic-outset p-7 rounded-[2rem] border-none mb-8">
          <VehiculoForm 
            clienteId={clienteIdNuevo!} 
            placaPrellenada={placaBuscada} 
            onSuccess={setVehiculoIdSeleccionado} 
          />
        </div>
      )}

      {/* Paso 4: Creación de la Orden (Si ya tenemos vehículo identificado) */}
      {vehiculoListoParaOrdenId && (
        <div className="neumorphic-outset p-7 rounded-[2rem] border-none">
          <NuevaOrdenForm vehiculoId={vehiculoListoParaOrdenId} />
        </div>
      )}
    </div>
  )
}
