import { useState } from 'react'
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, RefreshCcw, FileText } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { MovimientoCajaForm } from '../components/caja/MovimientoCajaForm'
import { useMovimientosPorFecha } from '../hooks/useCaja'

export default function Caja() {
  const [fechaActual, setFechaActual] = useState(new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)

  const { data: movimientos, isLoading, refetch } = useMovimientosPorFecha(fechaActual)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const ingresos = movimientos?.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + Number(m.monto), 0) || 0
  const egresos = movimientos?.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + Number(m.monto), 0) || 0
  const balance = ingresos - egresos

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
            <Wallet className="w-8 h-8 mr-3 text-purple-500" />
            Caja y POS
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Módulo de cobros, facturación y recibos diarios
          </p>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <input
            type="date"
            value={fechaActual}
            onChange={(e) => setFechaActual(e.target.value)}
            className="rounded-xl neumorphic-inset text-slate-700 text-sm p-3 font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-purple-500/20"
          />
          <Button 
            onClick={() => setShowModal(true)} 
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 px-5 shadow-lg shadow-purple-500/30 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neumorphic-outset rounded-[2rem] p-6 bg-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-16 h-16 text-slate-800" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Balance del Día</p>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">
            {formatCurrency(balance)}
          </h2>
          <div className={`mt-3 inline-flex items-center text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${balance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {balance >= 0 ? 'Positivo' : 'Negativo'}
          </div>
        </div>

        <div className="neumorphic-outset rounded-[2rem] p-6 bg-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Ingresos</p>
              <h2 className="text-3xl font-black text-emerald-600 tracking-tighter">
                {formatCurrency(ingresos)}
              </h2>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-inner">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="neumorphic-outset rounded-[2rem] p-6 bg-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Egresos</p>
              <h2 className="text-3xl font-black text-rose-600 tracking-tighter">
                {formatCurrency(egresos)}
              </h2>
            </div>
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shadow-inner">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="neumorphic-outset rounded-[2rem] p-8 bg-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest">
            Historial de Movimientos
          </h3>
          <button onClick={() => refetch()} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
            <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : !movimientos || movimientos.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay movimientos registrados para esta fecha.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200/60">
                  <th className="pb-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Hora</th>
                  <th className="pb-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Concepto</th>
                  <th className="pb-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Método</th>
                  <th className="pb-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500">Registrado por</th>
                  <th className="pb-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500 text-right">Monto</th>
                  <th className="pb-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {movimientos.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {formatTime(mov.fecha_movimiento)}
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-bold text-slate-800">{mov.concepto}</p>
                      {mov.ordenes && (
                        <p className="text-xs font-semibold text-purple-600 mt-1">
                          Orden #{mov.ordenes.order_number} {mov.ordenes.vehiculos && `• ${mov.ordenes.vehiculos.placa}`}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-600 uppercase">
                      {mov.metodo_pago}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-500">
                      {mov.profiles?.full_name || 'Desconocido'}
                    </td>
                    <td className={`py-4 px-4 text-sm font-black text-right whitespace-nowrap ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {mov.tipo === 'ingreso' ? '+' : '-'} {formatCurrency(Number(mov.monto))}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-lg hover:bg-blue-50" title="Imprimir Recibo">
                        <FileText className="w-5 h-5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <MovimientoCajaForm 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  )
}
