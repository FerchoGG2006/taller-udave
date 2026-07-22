import { useState } from 'react'
import { useHistorialOrdenes } from '../hooks/useOrdenes'
import { OrdenCard } from '../components/ordenes/OrdenCard'
import { Button } from '../components/ui/Button'
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
  const totalLabor = filteredOrdenes.reduce((sum, o) => sum + (Number(o.labor_cost) || 0), 0)
  const totalParts = filteredOrdenes.reduce((sum, o) => sum + (Number(o.parts_cost) || 0), 0)
  const totalFacturado = totalLabor + totalParts

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Historial de Servicios</h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Busca y audita todas las órdenes del taller</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="p-3.5 neumorphic-inset rounded-2xl text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
            {filteredOrdenes.length} órdenes encontradas
          </span>
        </div>
      </div>

      {/* Grid Superior: Buscador de Placa en DB + Métricas Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Buscador de Placa Primario (Filtro en Supabase) */}
        <div className="neumorphic-outset p-6 rounded-[2rem] border-none flex flex-col justify-between">
          <div>
            <h2 className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-500" /> Búsqueda Primaria por Placa
            </h2>
            <form onSubmit={handleBuscarPlaca} className="space-y-4">
              <input
                type="text"
                placeholder="Ej: ABC123"
                className="w-full px-4 py-3 neumorphic-inset text-slate-800 dark:text-slate-100 text-sm rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all font-bold uppercase tracking-widest text-center"
                value={placaBusqueda}
                onChange={(e) => setPlacaBusqueda(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="neumorphic"
                  className="flex-1 rounded-xl text-xs py-2.5"
                >
                  Buscar Placa
                </Button>
                {placaActiva && (
                  <Button
                    type="button"
                    variant="neumorphic"
                    onClick={handleLimpiarFiltroPlaca}
                    className="px-4 rounded-xl text-xs py-2.5 text-slate-500 hover:text-red-500"
                  >
                    Ver Todo
                  </Button>
                )}
              </div>
            </form>
          </div>
          {placaActiva && (
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold mt-4 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 text-center uppercase tracking-wider">
              Filtro activo: Placa "{placaActiva}"
            </p>
          )}
        </div>

        {/* Métricas Financieras del Listado Filtrado */}
        <div className="lg:col-span-2 neumorphic-outset p-6 rounded-[2rem] text-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900">
            <DollarSign className="w-28 h-28" />
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-indigo-500" /> Sumatoria de Facturación
            </h2>
            <span className="text-[9px] bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full font-bold border border-emerald-200 uppercase tracking-wider">
              Período Filtrado
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-slate-300/60 pt-5">
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Mano de Obra</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1.5">
                ${totalLabor.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Repuestos</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1.5">
                ${totalParts.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="border-l border-slate-300/60 pl-6">
              <p className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider">Total Facturado</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ${totalFacturado.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros del Cliente */}
      <div className="neumorphic-outset p-6 rounded-[2rem] border-none mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda por texto secundario */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Filtro rápido: cliente, marca, N° orden..."
              className="w-full pl-11 pr-4 py-3 neumorphic-inset text-slate-800 dark:text-slate-100 text-sm rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por estado */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <select
              title="Estado de la orden"
              className="w-full pl-11 pr-4 py-3 neumorphic-inset text-slate-800 dark:text-slate-100 text-sm rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all bg-transparent cursor-pointer appearance-none font-medium"
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value as EstadoOrden | 'todas')}
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value} className="dark:bg-slate-900">{e.label}</option>
              ))}
            </select>
          </div>

          {/* Selector de Rango de Fechas */}
          <div className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400 rounded-xl px-4 py-3 neumorphic-inset w-full">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              type="date"
              className="w-full bg-transparent outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Fecha Inicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
            <span className="text-slate-400">a</span>
            <input
              type="date"
              className="w-full bg-transparent outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Fecha Fin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
            {(fechaInicio || fechaFin) && (
              <button
                type="button"
                onClick={() => { setFechaInicio(''); setFechaFin('') }}
                className="text-red-500 font-bold hover:text-red-700 pl-1 shrink-0"
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
