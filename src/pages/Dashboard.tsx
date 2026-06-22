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

  if (isLoadingProfile) {
    return <div className="flex h-screen items-center justify-center">Cargando dashboard...</div>
  }

  // Redirigir a mecánicos directamentre a su lista de órdenes asignadas
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
    <div className="max-w-6xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Resumen General</h1>
      <p className="text-sm text-gray-500 mb-8">Estado operativo y financiero del taller el día de hoy</p>
      
      {/* Cards Operativos (Visibles para Owner y Receptionist) */}
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Estado de Vehículos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl mr-4 border border-blue-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ingreso / Diagnóstico</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{recibidas}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl mr-4 border border-amber-100">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">En Reparación</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{enReparacion}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl mr-4 border border-green-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Listos para Entrega</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{listas}</p>
          </div>
        </div>
      </div>

      {/* Cards Financieros (EXCLUSIVOS de Owner) */}
      {esOwner && (
        <>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Métricas Financieras (Mano de Obra)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
              <div className="p-4 bg-green-50 text-green-600 rounded-xl mr-4 border border-green-100">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Facturado Hoy</p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  ${(stats?.revenue_today || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-xl mr-4 border border-blue-100">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pendiente en Taller</p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  ${(stats?.pending_revenue || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-4 bg-red-50 text-red-600 rounded-xl mr-4 border border-red-100">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Comisiones por Pagar</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">
                    ${totalComisionesPendientes.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              {totalComisionesPendientes > 0 && (
                <Link to="/comisiones" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-950 transition-colors" title="Ver detalle de comisiones">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
          
          {/* Órdenes con más de 7 días estancadas */}
          {ordenes && ordenes.some(o => {
            const dias = Math.floor((Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24))
            return o.estado !== 'listo' && o.estado !== 'entregado' && dias >= 7
          }) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Atención: Vehículos retrasados en taller</h4>
                <p className="text-xs text-amber-800 mt-1">
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
