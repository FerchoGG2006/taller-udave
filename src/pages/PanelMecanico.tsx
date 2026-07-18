import React from 'react'
import { useOrdenesActivas } from '../hooks/useOrdenes'
import { useActiveProfile } from '../hooks/useProfiles'
import { OrdenCard } from '../components/ordenes/OrdenCard'
import { Loader2, Wrench, Clock, CheckCircle2 } from 'lucide-react'

export default function PanelMecanico() {
  const { data: profile, isLoading: isLoadingProfile } = useActiveProfile()
  const { data: ordenes, isLoading: isLoadingOrdenes } = useOrdenesActivas()

  if (isLoadingProfile || isLoadingOrdenes) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Filtrar órdenes: solo en las que el mecánico está asignado
  const misOrdenes = ordenes?.filter(orden => 
    orden.mechanics?.some(m => m.id === profile?.id)
  ) || []

  // Estadísticas rápidas
  const enReparacion = misOrdenes.filter(o => o.estado === 'en_reparacion').length
  const esperando = misOrdenes.filter(o => o.estado === 'diagnostico' || o.estado === 'esperando_aprobacion').length
  const listas = misOrdenes.filter(o => o.estado === 'listo').length

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Mi Taller</h1>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
          Hola, {profile?.full_name}
        </p>
      </div>
      
      {/* Resumen de Trabajos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="neumorphic-outset border-none p-5 rounded-[2rem] flex items-center">
          <div className="p-3 neumorphic-inset rounded-2xl mr-4 text-indigo-500">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">En Reparación</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{enReparacion}</p>
          </div>
        </div>
        
        <div className="neumorphic-outset border-none p-5 rounded-[2rem] flex items-center">
          <div className="p-3 neumorphic-inset rounded-2xl mr-4 text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Diagnóstico / Espera</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{esperando}</p>
          </div>
        </div>

        <div className="neumorphic-outset border-none p-5 rounded-[2rem] flex items-center">
          <div className="p-3 neumorphic-inset rounded-2xl mr-4 text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Listos</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{listas}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Mis Trabajos Asignados</h2>
        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-500/20">
          {misOrdenes.length} Activos
        </span>
      </div>

      {misOrdenes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No tienes trabajos activos</h3>
          <p className="text-slate-500 mt-2">Disfruta tu café ☕</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {misOrdenes.map(orden => (
            <OrdenCard key={orden.id} orden={orden} />
          ))}
        </div>
      )}
    </div>
  )
}
