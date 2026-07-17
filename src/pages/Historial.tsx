import { useState } from 'react'
import { useHistorialOrdenes } from '../hooks/useOrdenes'
import { OrdenCard } from '../components/ordenes/OrdenCard'
import { Loader2, Search, Calendar, DollarSign, Filter, ClipboardList } from 'lucide-react'
import type { EstadoOrden } from '../types'

const ESTADOS: { value: EstadoOrden | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todos los estados' },
  { value: 'recibido', label: 'Recibido' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'esperando_aprobacion', label: 'Esperando Aprobación' },
  { value: 'en_reparacion', label: 'En Reparación' },
  { value: 'listo', label: 'Listo para Entrega' },
  { value: 'entregado', label: 'Entregado (Cerrado)' },
]

export default function Historial() {
  const [placaBusqueda, setPlacaBusqueda] = useState('')
  const [placaActiva, setPlacaActiva] = useState<string | undefined>(undefined)
  const { data: ordenes, isLoading, isError, error } = useHistorialOrdenes(placaActiva)

  // Filtros del lado del cliente
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEstado, setSelectedEstado] = useState<EstadoOrden | 'todas'>('todas')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const handleBuscarPlaca = (e: React.FormEvent) => {
    e.preventDefault()
    if (placaBusqueda.trim().length >= 5) {
      setPlacaActiva(placaBusqueda.toUpperCase().trim())
    } else if (placaBusqueda.trim() === '') {
      setPlacaActiva(undefined)
    } else {
      alert('Por favor ingresa al menos 5 caracteres de la placa')
    }
  }

  const handleLimpiarFiltroPlaca = () => {
    setPlacaBusqueda('')
    setPlacaActiva(undefined)
  }

  // Filtrado de las órdenes obtenidas
  const filteredOrdenes = ordenes?.filter(orden => {
    // 1. Filtrar por estado
    if (selectedEstado !== 'todas' && orden.estado !== selectedEstado) {
      return false
    }

    // 2. Filtrar por rango de fechas
    if (fechaInicio) {
      const dateInicio = new Date(fechaInicio + 'T00:00:00')
      const orderDate = new Date(orden.created_at)
      if (orderDate < dateInicio) return false
    }
    if (fechaFin) {
      const dateFin = new Date(fechaFin + 'T23:59:59')
      const orderDate = new Date(orden.created_at)
      if (orderDate > dateFin) return false
    }

    // 3. Búsqueda de texto (cliente, modelo, orden)
    if (searchTerm.trim() !== '') {
      const text = searchTerm.toLowerCase().trim()
      const cliente = orden.vehiculos?.clientes?.nombre?.toLowerCase() || ''
      const placa = orden.vehiculos?.placa?.toLowerCase() || ''
      const marca = orden.vehiculos?.marca?.toLowerCase() || ''
      const modelo = orden.vehiculos?.modelo?.toLowerCase() || ''
      const numero = String(orden.order_number || '')
      
      return cliente.includes(text) || placa.includes(text) || marca.includes(text) || modelo.includes(text) || numero.includes(text)
    }

    return true
  }) || []

  // Calcular métricas financieras del conjunto filtrado
  const totalLabor = filteredOrdenes.reduce((sum, o) => sum + (parseFloat(o.labor_cost) || 0), 0)
  const totalParts = filteredOrdenes.reduce((sum, o) => sum + (parseFloat(o.parts_cost) || 0), 0)
  const totalFacturado = totalLabor + totalParts

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white/40 p-5 rounded-3xl backdrop-blur-sm border border-white/50 shadow-sm gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Historial de Servicios</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Busca y audita todas las órdenes del taller</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-slate-900 text-white text-xs font-black px-4 py-2 rounded-full shadow-md shadow-slate-900/10">
            {filteredOrdenes.length} órdenes encontradas
          </span>
        </div>
      </div>

      {/* Grid Superior: Buscador de Placa en DB + Métricas Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Buscador de Placa Primario (Filtro en Supabase) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Búsqueda Primaria por Placa
            </h2>
            <form onSubmit={handleBuscarPlaca} className="space-y-3">
              <input
                type="text"
                placeholder="Ej: ABC123"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all font-bold uppercase tracking-wider text-center"
                value={placaBusqueda}
                onChange={(e) => setPlacaBusqueda(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-sm"
                >
                  Buscar Placa
                </button>
                {placaActiva && (
                  <button
                    type="button"
                    onClick={handleLimpiarFiltroPlaca}
                    className="px-3 bg-gray-150 text-gray-700 font-bold py-2 rounded-xl text-xs hover:bg-gray-200 transition-colors"
                  >
                    Ver Todo
                  </button>
                )}
              </div>
            </form>
          </div>
          {placaActiva && (
            <p className="text-[11px] text-indigo-600 font-semibold mt-3 bg-indigo-50 p-2 rounded-lg border border-indigo-100/50 text-center">
              Filtro activo: Placa "{placaActiva}"
            </p>
          )}
        </div>

        {/* Métricas Financieras del Listado Filtrado */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <DollarSign className="w-28 h-28" />
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" /> Sumatoria de Facturación
            </h2>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
              Período Filtrado
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-slate-700/60 pt-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Mano de Obra</p>
              <p className="text-base font-extrabold text-white mt-1">
                ${totalLabor.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Repuestos</p>
              <p className="text-base font-extrabold text-white mt-1">
                ${totalParts.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="border-l border-slate-700/60 pl-4">
              <p className="text-[10px] text-emerald-400 uppercase font-bold">Total Facturado</p>
              <p className="text-lg font-black text-emerald-400 mt-1">
                ${totalFacturado.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros del Cliente */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Búsqueda por texto secundario */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filtro rápido: cliente, marca, N° orden..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por estado */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              title="Estado de la orden"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white cursor-pointer appearance-none"
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value as any)}
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          {/* Selector de Rango de Fechas */}
          <div className="flex gap-2 items-center text-xs text-gray-450 border border-gray-250 rounded-xl px-2 bg-white">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="date"
              className="w-full bg-transparent outline-none py-1 text-slate-700 cursor-pointer"
              title="Fecha Inicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
            <span className="text-gray-400">a</span>
            <input
              type="date"
              className="w-full bg-transparent outline-none py-1 text-slate-700 cursor-pointer"
              title="Fecha Fin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
            {(fechaInicio || fechaFin) && (
              <button
                type="button"
                onClick={() => { setFechaInicio(''); setFechaFin('') }}
                className="text-red-500 font-bold hover:text-red-700 pl-1"
                title="Limpiar fechas"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resultados de la búsqueda */}
      {isLoading && (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}
      
      {isError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          Error: {(error as Error).message}
        </div>
      )}

      {ordenes && !isLoading && (
        <>
          {!filteredOrdenes.length ? (
            <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-sm">No se encontraron órdenes que coincidan con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrdenes.map(orden => (
                <OrdenCard key={orden.id} orden={orden} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
