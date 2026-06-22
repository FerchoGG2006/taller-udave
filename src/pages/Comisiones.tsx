import { useState } from 'react'
import { useComisionesPendientes, usePeriodosComision, usePagarComisiones } from '../hooks/useCommissions'
import { useActiveProfile } from '../hooks/useProfiles'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Navigate } from 'react-router-dom'
import { DollarSign, Calendar, List, CheckCircle, Loader2, Award, ClipboardList } from 'lucide-react'

export default function Comisiones() {
  const { data: activeUser } = useActiveProfile()
  const { data: pendientes, isLoading: isLoadingPendientes } = useComisionesPendientes()
  const { data: periodos, isLoading: isLoadingPeriodos } = usePeriodosComision()
  const pagarComisiones = usePagarComisiones()

  // State para el modal de pago
  const [mechanicSelect, setMechanicSelect] = useState<any>(null)
  const [notasPago, setNotasPago] = useState('')
  const [errorPago, setErrorPago] = useState<string | null>(null)

  // Si no es el dueño, no permitir acceso
  if (activeUser && activeUser.role !== 'owner') {
    return <Navigate to="/" replace />
  }

  // Query para ver las órdenes incluidas en el pago de comisiones del mecánico seleccionado
  const { data: ordenesIncluidas, isLoading: isLoadingOrdenes } = useQuery({
    queryKey: ['order_mechanics', 'unpaid', mechanicSelect?.mechanic_id],
    queryFn: async () => {
      if (!mechanicSelect) return []
      const { data, error } = await supabase
        .from('order_mechanics')
        .select(`
          id,
          commission_amount,
          commission_percentage,
          ordenes!inner(
            id,
            order_number,
            labor_cost,
            fecha_ingreso,
            vehiculos(placa, marca, modelo)
          )
        `)
        .eq('mechanic_id', mechanicSelect.mechanic_id)
        .eq('is_commission_paid', false)
        .eq('ordenes.estado', 'entregado')

      if (error) throw new Error(error.message)
      return data as any[]
    },
    enabled: !!mechanicSelect
  })

  const abrirModalPago = (mecanico: any) => {
    setMechanicSelect(mecanico)
    setNotasPago('')
    setErrorPago(null)
  }

  const handleConfirmarPago = async () => {
    if (!mechanicSelect || !activeUser) return
    setErrorPago(null)

    // Sumar el total de mano de obra de las órdenes incluidas
    const totalLabor = ordenesIncluidas?.reduce((sum, item) => sum + (parseFloat(item.ordenes?.labor_cost) || 0), 0) || 0

    try {
      await pagarComisiones.mutateAsync({
        mechanicId: mechanicSelect.mechanic_id,
        notes: notasPago,
        totalLabor,
        totalCommission: mechanicSelect.total_pending,
        paidBy: activeUser.id
      })
      setMechanicSelect(null)
    } catch (err: any) {
      setErrorPago(err.message || "Error al procesar el pago")
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Control de Comisiones</h1>
        <p className="text-sm text-gray-500 mt-1">Lleva el saldo de comisiones devengadas por los mecánicos y realiza los cortes de pago</p>
      </div>

      {/* Sección 1: Comisiones Pendientes */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-500" /> Saldos por Pagar
        </h2>

        {isLoadingPendientes ? (
          <div className="flex justify-center p-6"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : !pendientes?.length ? (
          <div className="bg-white p-8 text-center rounded-xl border border-gray-200">
            <p className="text-gray-500">No hay comisiones acumuladas pendientes de pago.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendientes.map((p) => (
              <div key={p.mechanic_id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{p.mechanic_name}</h3>
                      <p className="text-xs text-gray-500 mt-1 font-semibold flex items-center gap-1">
                        <ClipboardList className="w-3.5 h-3.5" /> {p.pending_orders} órdenes entregadas
                      </p>
                    </div>
                    <div className="p-2.5 bg-blue-50 rounded-full text-blue-600">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="my-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total Acumulado</p>
                    <p className="text-3xl font-black text-gray-950 mt-1">${p.total_pending.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</p>
                    {p.oldest_order_date && (
                      <p className="text-xs text-amber-600 font-medium mt-2">
                        Acumulando desde: {new Date(p.oldest_order_date).toLocaleDateString('es-CO')}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => abrirModalPago(p)}
                  className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm"
                >
                  Registrar Pago / Corte
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección 2: Historial de Cortes de Pago */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" /> Historial de Cortes de Pago
        </h2>

        {isLoadingPeriodos ? (
          <div className="flex justify-center p-6"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : !periodos?.length ? (
          <div className="bg-white p-8 text-center rounded-xl border border-gray-200">
            <p className="text-gray-500">No se han registrado cortes de comisión anteriormente.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mecánico</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Mano de Obra</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Comisión Pagada</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de Pago</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {periodos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{p.profiles?.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                        {new Date(p.period_start).toLocaleDateString('es-CO')} - {new Date(p.period_end).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-600">
                        ${(p.total_labor_value || 0).toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-green-600">
                        ${(p.total_commission || 0).toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(p.paid_at || p.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs truncate max-w-xs">{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Pago / Detalle de Órdenes */}
      {mechanicSelect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-100 p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Registrar Corte y Pago</h2>
                <p className="text-sm text-gray-500 mt-0.5">Mecánico: <strong className="text-gray-800">{mechanicSelect.mechanic_name}</strong></p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold">
                  Total Corte
                </span>
                <p className="text-xl font-extrabold text-green-600 mt-1">
                  ${mechanicSelect.total_pending.toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            {errorPago && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md mb-4 border border-red-100">
                {errorPago}
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <List className="w-3.5 h-3.5" /> Órdenes que se liquidarán
              </h3>

              {isLoadingOrdenes ? (
                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : !ordenesIncluidas?.length ? (
                <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded border text-center">No se encontraron órdenes completadas para liquidar.</p>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100 text-xs">
                  {ordenesIncluidas.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <p className="font-bold text-gray-900">Orden #{item.ordenes?.order_number} ({item.ordenes?.vehiculos?.placa})</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {item.ordenes?.vehiculos?.marca} {item.ordenes?.vehiculos?.modelo} • MO: ${item.ordenes?.labor_cost?.toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${item.commission_amount?.toLocaleString('es-CO')}</p>
                        <p className="text-[9px] text-gray-400">({item.commission_percentage}%)</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Observaciones del pago</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                value={notasPago}
                onChange={(e) => setNotasPago(e.target.value)}
                placeholder="Escribe detalles adicionales (ej: Pago en efectivo semana 24, transferencia Bancolombia)..."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setMechanicSelect(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleConfirmarPago}
                disabled={pagarComisiones.isPending || !ordenesIncluidas?.length}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                {pagarComisiones.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Confirmar Pago
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
