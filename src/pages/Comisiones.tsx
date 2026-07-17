import { useState, useRef } from 'react'
import { useComisionesPendientes, usePeriodosComision, usePagarComisiones } from '../hooks/useCommissions'
import { useActiveProfile } from '../hooks/useProfiles'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Navigate } from 'react-router-dom'
import type { PendingCommission, CommissionPeriod } from '../types'
import { 
  DollarSign, 
  Calendar, 
  List, 
  CheckCircle, 
  Loader2, 
  Award, 
  BarChart3, 
  Printer, 
  TrendingUp,
  X
} from 'lucide-react'

interface OrdenIncluida {
  id: string
  commission_amount: number
  commission_percentage: number
  ordenes: {
    id: string
    order_number: number
    labor_cost: number
    fecha_ingreso: string
    vehiculos: {
      placa: string
      marca: string
      modelo: string
    } | null
  }
}

interface OrdenReciboHistorial {
  id: string
  commission_amount: number
  commission_percentage: number
  assigned_at: string
  ordenes: {
    id: string
    order_number: number
    labor_cost: number
    fecha_ingreso: string
    vehiculos: {
      placa: string
      marca: string
      modelo: string
    } | null
  }
}

export default function Comisiones() {
  const { data: activeUser } = useActiveProfile()
  const { data: pendientes, isLoading: isLoadingPendientes } = useComisionesPendientes()
  const { data: periodos, isLoading: isLoadingPeriodos } = usePeriodosComision()
  const pagarComisiones = usePagarComisiones()

  // States
  const [mechanicSelect, setMechanicSelect] = useState<PendingCommission | null>(null)
  const [notasPago, setNotasPago] = useState('')
  const [errorPago, setErrorPago] = useState<string | null>(null)
  
  // State para ver/imprimir recibo histórico
  const [selectedReceipt, setSelectedReceipt] = useState<(CommissionPeriod & { profiles: { full_name: string } }) | null>(null)
  const printAreaRef = useRef<HTMLDivElement>(null)

  // Query para ver las órdenes incluidas en el pago del mecánico seleccionado
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
      return data as unknown as OrdenIncluida[]
    },
    enabled: !!mechanicSelect
  })

  // Query para cargar las órdenes asociadas a un recibo/periodo histórico de comisiones
  const { data: ordenesReciboHistorial, isLoading: isLoadingOrdenesRecibo } = useQuery({
    queryKey: ['order_mechanics', 'period', selectedReceipt?.mechanic_id, selectedReceipt?.period_start, selectedReceipt?.period_end],
    queryFn: async () => {
      if (!selectedReceipt) return []
      
      // Consultar las order_mechanics que fueron pagadas en el rango de este corte
      const { data, error } = await supabase
        .from('order_mechanics')
        .select(`
          id,
          commission_amount,
          commission_percentage,
          assigned_at,
          ordenes!inner(
            id,
            order_number,
            labor_cost,
            fecha_ingreso,
            vehiculos(placa, marca, modelo)
          )
        `)
        .eq('mechanic_id', selectedReceipt.mechanic_id)
        .eq('is_commission_paid', true)
        // Filtrar ordenes que cayeron en este rango aproximado
        .gte('assigned_at', selectedReceipt.period_start)
        .lte('assigned_at', selectedReceipt.period_end)

      if (error) throw new Error(error.message)
      return data as unknown as OrdenReciboHistorial[]
    },
    enabled: !!selectedReceipt
  })

  // Redirigir a dueños/owners
  if (activeUser && activeUser.role !== 'owner') {
    return <Navigate to="/" replace />
  }

  const abrirModalPago = (mecanico: PendingCommission) => {
    setMechanicSelect(mecanico)
    setNotasPago('')
    setErrorPago(null)
  }

  const handleConfirmarPago = async () => {
    if (!mechanicSelect || !activeUser) return
    setErrorPago(null)

    const totalLabor = ordenesIncluidas?.reduce((sum, item) => sum + (Number(item.ordenes?.labor_cost) || 0), 0) || 0

    try {
      await pagarComisiones.mutateAsync({
        mechanicId: mechanicSelect.mechanic_id,
        notes: notasPago,
        totalLabor,
        totalCommission: mechanicSelect.total_pending,
        paidBy: activeUser.id
      })
      setMechanicSelect(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al procesar el pago"
      setErrorPago(errorMessage)
    }
  }

  const handleImprimir = () => {
    const printContent = printAreaRef.current?.innerHTML
    if (printContent) {
      const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0')
      if (windowPrint) {
        windowPrint.document.write(`
          <html>
            <head>
              <title>Recibo de Comisión - Taller Udave</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                body { font-family: sans-serif; padding: 40px; color: #1e293b; }
                @media print {
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printContent}
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                }
              </script>
            </body>
          </html>
        `)
        windowPrint.document.close()
      }
    }
  }

  // Cálculos financieros globales para el Dashboard
  const totalComisionesPendientes = pendientes?.reduce((sum, item) => sum + (item.total_pending || 0), 0) || 0
  const totalComisionesPagadas = periodos?.reduce((sum, item) => sum + (item.total_commission || 0), 0) || 0

  // Máximo valor pendiente para escala del gráfico de barras SVG
  const maxPendingVal = Math.max(...(pendientes?.map(p => p.total_pending) || [1]))

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white/40 p-5 rounded-3xl backdrop-blur-sm border border-white/50 shadow-sm gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-sans">Módulo de Comisiones</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Cortes de pagos, saldos devengados y auditoría de mecánicos</p>
        </div>
      </div>

      {/* Grid: Tarjetas Financieras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl border border-amber-200/50 bg-amber-50/30 flex items-center shadow-sm">
          <div className="p-4 bg-amber-100/80 text-amber-700 rounded-2xl mr-5 shadow-inner">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Pendiente de Pago</p>
            <p className="text-2xl font-black text-gray-900 mt-1">${totalComisionesPendientes.toLocaleString('es-CO')}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-emerald-250/50 bg-emerald-50/20 flex items-center shadow-sm">
          <div className="p-4 bg-emerald-100/70 text-emerald-700 rounded-2xl mr-5 shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Histórico Pagado</p>
            <p className="text-2xl font-black text-gray-900 mt-1">${totalComisionesPagadas.toLocaleString('es-CO')}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-indigo-200/50 bg-indigo-50/20 flex items-center shadow-sm">
          <div className="p-4 bg-indigo-100/70 text-indigo-700 rounded-2xl mr-5 shadow-inner">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mecánicos Activos</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{pendientes?.length || 0} operarios</p>
          </div>
        </div>
      </div>

      {/* Grid: Gráfico SVG + Listado de Comisiones Activas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Gráfico de barras SVG (Comparativa de saldos pendientes por mecánico) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-450 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> Distribución de Saldos Pendientes
            </h3>
            
            {!pendientes?.length ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No hay datos disponibles para graficar.
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {pendientes.map((m) => {
                  const percentage = (m.total_pending / maxPendingVal) * 100
                  return (
                    <div key={m.mechanic_id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700">{m.mechanic_name}</span>
                        <span className="text-gray-900 font-extrabold">${m.total_pending.toLocaleString('es-CO')}</span>
                      </div>
                      <style>{`
                        #bar-${m.mechanic_id} {
                          width: ${Math.max(percentage, 5)}%;
                        }
                      `}</style>
                      <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200/50 flex">
                        <div 
                          id={`bar-${m.mechanic_id}`}
                          className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-700"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-4 leading-relaxed">
            * El gráfico muestra de forma proporcional el saldo adeudado a cada mecánico basándose en sus comisiones de mano de obra.
          </p>
        </div>

        {/* Saldos por Pagar List */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-450 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" /> Saldos por Liquidar
          </h2>

          {isLoadingPendientes ? (
            <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : !pendientes?.length ? (
            <p className="text-sm text-gray-500 text-center py-6">No hay comisiones acumuladas.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {pendientes.map((p) => (
                <div key={p.mechanic_id} className="p-3.5 border border-gray-150 rounded-xl hover:border-gray-300 transition-colors bg-slate-50/50 flex flex-col justify-between gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">{p.mechanic_name}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{p.pending_orders} órdenes por pagar</p>
                    </div>
                    <span className="text-sm font-black text-gray-900">${p.total_pending.toLocaleString('es-CO')}</span>
                  </div>
                  <button
                    onClick={() => abrirModalPago(p)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm"
                  >
                    Hacer Corte / Pago
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historial de Cortes de Pago */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <h2 className="text-sm font-bold text-gray-450 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" /> Historial de Cortes de Pago
        </h2>

        {isLoadingPeriodos ? (
          <div className="flex justify-center p-6"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : !periodos?.length ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            No se han registrado cortes de comisión anteriormente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Mecánico</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Corte / Período</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Mano de Obra</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Comisión</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {periodos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">{p.profiles?.full_name}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 text-xs">
                      {new Date(p.period_start).toLocaleDateString('es-CO')} - {new Date(p.period_end).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-medium text-gray-600">
                      ${(p.total_labor_value || 0).toLocaleString('es-CO')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-extrabold text-green-600">
                      ${(p.total_commission || 0).toLocaleString('es-CO')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-400 text-xs">
                      {new Date(p.paid_at || p.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                        title="Ver e Imprimir Comprobante"
                      >
                        <Printer className="w-3.5 h-3.5" /> Recibo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Pago / Detalle de Órdenes */}
      {mechanicSelect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Registrar Corte y Pago</h2>
                <p className="text-sm text-gray-500 mt-0.5">Mecánico: <strong className="text-gray-800">{mechanicSelect.mechanic_name}</strong></p>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Total Corte
                </span>
                <p className="text-xl font-extrabold text-green-600 mt-1">
                  ${mechanicSelect.total_pending.toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            {errorPago && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md mb-4 border border-red-100 font-medium">
                {errorPago}
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-450 uppercase tracking-wider mb-2 flex items-center gap-1">
                <List className="w-3.5 h-3.5" /> Órdenes que se liquidarán
              </h3>

              {isLoadingOrdenes ? (
                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : !ordenesIncluidas?.length ? (
                <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded border text-center">No se encontraron órdenes completadas para liquidar.</p>
              ) : (
                <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100 text-xs">
                  {ordenesIncluidas.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <p className="font-bold text-gray-900">Orden #{item.ordenes?.order_number} ({item.ordenes?.vehiculos?.placa})</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 animate-pulse">
                          MO: ${item.ordenes?.labor_cost?.toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${item.commission_amount?.toLocaleString('es-CO')}</p>
                        <p className="text-[9px] text-gray-400">({item.commission_percentage}%)</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Notas / Observaciones del pago</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                value={notasPago}
                onChange={(e) => setNotasPago(e.target.value)}
                placeholder="Ej: Pago realizado por transferencia, efectivo, etc."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setMechanicSelect(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-lg text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarPago}
                disabled={pagarComisiones.isPending || !ordenesIncluidas?.length}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
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

      {/* Recibo Imprimible Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col justify-between max-h-[90vh]">
            
            {/* Contenido Imprimible */}
            <div ref={printAreaRef} className="flex-1 overflow-y-auto pr-1">
              <div className="border border-gray-200 p-6 rounded-2xl bg-white space-y-6">
                
                {/* Cabecera del recibo */}
                <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Taller Udave</h2>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">Valledupar, Colombia • Nit: 12345678-9</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                      Corte de Comisión
                    </span>
                    <p className="text-[11px] text-gray-400 mt-2">Fecha Pago: {new Date(selectedReceipt.paid_at || selectedReceipt.created_at).toLocaleDateString('es-CO')}</p>
                  </div>
                </div>

                {/* Info del corte */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-gray-400 font-bold uppercase">Beneficiario (Mecánico)</p>
                    <p className="text-sm font-extrabold text-gray-800 mt-1">{selectedReceipt.profiles?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold uppercase">Período de Liquidación</p>
                    <p className="text-sm font-semibold text-gray-700 mt-1">
                      {new Date(selectedReceipt.period_start).toLocaleDateString('es-CO')} - {new Date(selectedReceipt.period_end).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>

                {/* Detalle de las órdenes liquidadas */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <List className="w-3.5 h-3.5" /> Detalle de Órdenes Incluidas
                  </h3>
                  
                  {isLoadingOrdenesRecibo ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
                  ) : !ordenesReciboHistorial?.length ? (
                    <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-lg text-center border">
                      No hay registros detallados vinculados a este corte (se liquidó saldo global).
                    </p>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden text-[11px]">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-bold text-gray-500">Orden / Vehículo</th>
                            <th className="px-4 py-2 text-right font-bold text-gray-500">Mano Obra</th>
                            <th className="px-4 py-2 text-right font-bold text-gray-500">Porcentaje</th>
                            <th className="px-4 py-2 text-right font-bold text-gray-500">Comisión</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                          {ordenesReciboHistorial.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2 font-semibold">
                                N° {item.ordenes?.order_number} ({item.ordenes?.vehiculos?.placa.toUpperCase()})
                              </td>
                              <td className="px-4 py-2 text-right">
                                ${(item.ordenes?.labor_cost || 0).toLocaleString('es-CO')}
                              </td>
                              <td className="px-4 py-2 text-right">{item.commission_percentage}%</td>
                              <td className="px-4 py-2 text-right font-bold text-green-600">
                                ${(item.commission_amount || 0).toLocaleString('es-CO')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Desglose totalizador */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500 font-semibold px-1">
                    <span>Total Facturado Mano de Obra:</span>
                    <span>${selectedReceipt.total_labor_value?.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm bg-green-50 p-4 rounded-xl border border-green-150">
                    <span className="font-extrabold text-green-800">Total Liquidado a Pagar:</span>
                    <span className="text-base font-black text-green-600">
                      ${selectedReceipt.total_commission?.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                {/* Notas */}
                {selectedReceipt.notes && (
                  <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <strong>Notas:</strong> {selectedReceipt.notes}
                  </div>
                )}

                {/* Firmas de conformidad para impresión */}
                <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                  <div className="space-y-1">
                    <div className="border-b border-gray-300 w-44 mx-auto h-8"></div>
                    <p className="font-bold text-gray-800">Firma Administrador</p>
                    <p className="text-[10px] text-gray-400">Taller Udave</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-b border-gray-300 w-44 mx-auto h-8"></div>
                    <p className="font-bold text-gray-800">Firma Recibido Mecánico</p>
                    <p className="text-[10px] text-gray-400">{selectedReceipt.profiles?.full_name}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 no-print">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> Cerrar Vista
              </button>
              <button
                type="button"
                onClick={handleImprimir}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Imprimir Comprobante
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
