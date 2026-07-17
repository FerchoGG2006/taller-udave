import { useState } from 'react'
import { useOrdenesActivas } from '../hooks/useOrdenes'
import { OrdenCard } from '../components/ordenes/OrdenCard'
import { Loader2, Inbox, Search, Filter, ArrowUpDown } from 'lucide-react'
import type { EstadoOrden } from '../types'

const ESTADOS: { value: EstadoOrden | 'todas'; label: string; color: string }[] = [
  { value: 'todas', label: 'Todas', color: 'bg-slate-100 text-slate-800' },
  { value: 'recibido', label: 'Recibido', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { value: 'diagnostico', label: 'Diagnóstico', color: 'bg-purple-50 text-purple-700 border border-purple-200' },
  { value: 'esperando_aprobacion', label: 'Esperando Aprobación', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'en_reparacion', label: 'En Reparación', color: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  { value: 'listo', label: 'Listo para Entrega', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
]

export default function Ordenes() {
  const { data: ordenes, isLoading, isError, error } = useOrdenesActivas()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEstado, setSelectedEstado] = useState<EstadoOrden | 'todas'>('todas')
  const [sortBy, setSortBy] = useState<'fecha-desc' | 'fecha-asc' | 'numero-desc' | 'numero-asc'>('fecha-desc')

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
        Error: {(error as Error).message}
      </div>
    )
  }

  // Filtrado de órdenes
  const filteredOrdenes = ordenes?.filter(orden => {
    // 1. Filtrar por estado
    if (selectedEstado !== 'todas' && orden.estado !== selectedEstado) {
      return false
    }

    // 2. Filtrar por texto
    const text = searchTerm.toLowerCase().trim()
    if (!text) return true

    const placa = orden.vehiculos?.placa?.toLowerCase() || ''
    const marca = orden.vehiculos?.marca?.toLowerCase() || ''
    const modelo = orden.vehiculos?.modelo?.toLowerCase() || ''
    const cliente = orden.vehiculos?.clientes?.nombre?.toLowerCase() || ''
    const numero = String(orden.order_number || '')

    return placa.includes(text) || 
           marca.includes(text) || 
           modelo.includes(text) || 
           cliente.includes(text) || 
           numero.includes(text)
  }) || []

  // Ordenamiento
  const sortedOrdenes = [...filteredOrdenes].sort((a, b) => {
    if (sortBy === 'fecha-desc') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (sortBy === 'fecha-asc') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    if (sortBy === 'numero-desc') {
      return (b.order_number || 0) - (a.order_number || 0)
    }
    if (sortBy === 'numero-asc') {
      return (a.order_number || 0) - (b.order_number || 0)
    }
    return 0
  })

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 neumorphic-outset border-none p-6 rounded-[2rem] gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Órdenes Activas</h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Gestión de vehículos en el taller</p>
        </div>
        <div className="flex items-center">
          <span className="neumorphic-inset border-none text-slate-700 dark:text-slate-350 text-xs font-extrabold px-5 py-2.5 rounded-full shadow-inner">
            {sortedOrdenes.length} de {ordenes?.length || 0} órdenes
          </span>
        </div>
      </div>

      {/* Barra de Filtros Neumórfica */}
      <div className="neumorphic-outset border-none p-5 rounded-[2rem] mb-8 space-y-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por placa, cliente, modelo u orden..."
              className="w-full pl-11 pr-4 py-3 neumorphic-inset border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-700 dark:text-white transition-all placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Select de Ordenamiento */}
          <div className="relative w-full md:w-60 flex items-center">
            <ArrowUpDown className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              title="Criterio de ordenamiento"
              className="w-full pl-11 pr-8 py-3 neumorphic-btn border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-700 dark:text-slate-300 cursor-pointer appearance-none bg-slate-100 dark:bg-slate-800"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'fecha-desc' | 'fecha-asc' | 'numero-desc' | 'numero-asc')}
            >
              <option value="fecha-desc">Ingreso: Más Reciente</option>
              <option value="fecha-asc">Ingreso: Más Antiguo</option>
              <option value="numero-desc">N° Orden: Mayor</option>
              <option value="numero-asc">N° Orden: Menor</option>
            </select>
          </div>
        </div>

        {/* Filtros de Estado tipo Botones Soft UI */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>
          <div className="flex gap-2.5">
            {ESTADOS.map((est) => {
              const activo = selectedEstado === est.value
              return (
                <button
                  key={est.value}
                  onClick={() => setSelectedEstado(est.value)}
                  className={`text-xs px-4 py-2.5 rounded-2xl font-bold transition-all duration-200 shrink-0 border-none ${
                    activo
                      ? 'neumorphic-inset text-indigo-600 dark:text-indigo-400 font-extrabold shadow-inner'
                      : 'neumorphic-btn text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {est.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Listado de Órdenes */}
      {!sortedOrdenes.length ? (
        <div className="neumorphic-outset border-none flex flex-col items-center justify-center p-16 text-center rounded-[2.5rem]">
          <div className="w-20 h-20 neumorphic-inset rounded-full flex items-center justify-center mb-5 border-none">
             <Inbox className="w-9 h-9 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Sin coincidencias</h3>
          <p className="text-slate-400 dark:text-slate-500 max-w-sm text-xs leading-relaxed">
            Ajusta los filtros de búsqueda o las opciones de estado para localizar la orden de servicio en el taller.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedOrdenes.map(orden => (
            <OrdenCard key={orden.id} orden={orden} />
          ))}
        </div>
      )}
    </div>
  )
}
