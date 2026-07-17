import { useState } from 'react'
import { useOrdenesActivas } from '../hooks/useOrdenes'
import { useActiveProfile } from '../hooks/useProfiles'
import { useDashboardStats } from '../hooks/useDashboard'
import { useComisionesPendientes } from '../hooks/useCommissions'
import { Navigate } from 'react-router-dom'
import { Wrench, CheckCircle2, Clock, DollarSign, Wallet, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { data: profile, isLoading: isLoadingProfile } = useActiveProfile()
  const { data: ordenes } = useOrdenesActivas()
  const { data: stats } = useDashboardStats()
  const { data: comisiones } = useComisionesPendientes()
  const [now] = useState(() => Date.now())

  if (isLoadingProfile) {
    return <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">Cargando dashboard...</div>
  }

  // Redirigir a mecánicos directamente a su lista de órdenes asignadas
  if (profile?.role === 'mechanic') {
    return <Navigate to="/ordenes" replace />
  }

  // Estadísticas del día
  const recibidas = ordenes?.filter(o => o.estado === 'recibido' || o.estado === 'diagnostico').length || 0
  const enReparacion = ordenes?.filter(o => o.estado === 'en_reparacion').length || 0
  const listas = ordenes?.filter(o => o.estado === 'listo').length || 0

  const totalComisionesPendientes = comisiones?.reduce((sum, item) => sum + (item.total_pending || 0), 0) || 0

  const esOwner = profile?.role === 'owner'

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
      <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Resumen General</h1>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-8">Estado operativo y financiero del taller</p>
      
      {/* Cards Operativos (Visibles para Owner y Receptionist) */}
      <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-5">Estado de Vehículos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="neumorphic-outset border-none p-6 rounded-[2rem] flex items-center transition-all duration-300 hover:scale-[1.015] group">
          <div className="p-4 neumorphic-inset rounded-2xl mr-5 text-indigo-500 border border-slate-200/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ingreso / Diagnóstico</p>
            <p className="text-4xl font-black text-slate-800 dark:text-white mt-1 tracking-tight">{recibidas}</p>
          </div>
        </div>

        <div className="neumorphic-outset border-none p-6 rounded-[2rem] flex items-center transition-all duration-300 hover:scale-[1.015] group">
          <div className="p-4 neumorphic-inset rounded-2xl mr-5 text-amber-500 border border-slate-200/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">En Reparación</p>
            <p className="text-4xl font-black text-slate-800 dark:text-white mt-1 tracking-tight">{enReparacion}</p>
          </div>
        </div>

        <div className="neumorphic-outset border-none p-6 rounded-[2rem] flex items-center transition-all duration-300 hover:scale-[1.015] group">
          <div className="p-4 neumorphic-inset rounded-2xl mr-5 text-emerald-500 border border-slate-200/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Listos para Entrega</p>
            <p className="text-4xl font-black text-slate-800 dark:text-white mt-1 tracking-tight">{listas}</p>
          </div>
        </div>
      </div>

      {/* Cards Financieros (EXCLUSIVOS de Owner) */}
      {esOwner && (
        <>
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-5">Métricas Financieras</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="neumorphic-outset border-none p-6 rounded-[2rem] flex items-center transition-all duration-300 hover:scale-[1.015] group">
              <div className="p-4 neumorphic-inset rounded-2xl mr-5 text-emerald-500 border border-slate-200/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Facturado Hoy</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  ${(stats?.revenue_today || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="neumorphic-outset border-none p-6 rounded-[2rem] flex items-center transition-all duration-300 hover:scale-[1.015] group">
              <div className="p-4 neumorphic-inset rounded-2xl mr-5 text-indigo-500 border border-slate-200/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pendiente en Taller</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  ${(stats?.pending_revenue || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="neumorphic-outset border-none p-6 rounded-[2rem] flex items-center justify-between transition-all duration-300 hover:scale-[1.015] group">
              <div className="flex items-center">
                <div className="p-4 neumorphic-inset rounded-2xl mr-5 text-red-500 border border-slate-200/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
                  <DollarSign className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Comisiones a Pagar</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                    ${totalComisionesPendientes.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              {totalComisionesPendientes > 0 && (
                <Link to="/comisiones" className="p-2.5 neumorphic-btn rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center border-none" title="Ver detalle de comisiones">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
          
          {/* Órdenes con más de 7 días estancadas */}
          {ordenes && ordenes.some(o => {
            const dias = Math.floor((now - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24))
            return o.estado !== 'listo' && o.estado !== 'entregado' && dias >= 7
          }) && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-3xl p-5 flex gap-4 items-start shadow-sm shadow-red-500/5">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-red-900 dark:text-red-400 text-sm">Alerta: Vehículos retrasados en taller</h4>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1 leading-relaxed">
                  Hay vehículos que llevan más de 7 días en taller sin completarse. Revísalos en la pestaña de Órdenes Activas.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
