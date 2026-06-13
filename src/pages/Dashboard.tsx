import { useOrdenesActivas } from '../hooks/useOrdenes'
import { Wrench, CheckCircle2, Clock } from 'lucide-react'

export default function Dashboard() {
  const { data: ordenes } = useOrdenesActivas()

  const recibidas = ordenes?.filter(o => o.estado === 'recibido' || o.estado === 'diagnostico').length || 0
  const enReparacion = ordenes?.filter(o => o.estado === 'en_reparacion').length || 0
  const listas = ordenes?.filter(o => o.estado === 'listo').length || 0

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Resumen del Taller</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
          <div className="p-4 bg-blue-100 rounded-full mr-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">En Diagnóstico / Ingreso</p>
            <p className="text-3xl font-bold text-gray-900">{recibidas}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
          <div className="p-4 bg-yellow-100 rounded-full mr-4">
            <Wrench className="w-8 h-8 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">En Reparación</p>
            <p className="text-3xl font-bold text-gray-900">{enReparacion}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
          <div className="p-4 bg-green-100 rounded-full mr-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Listos para Entrega</p>
            <p className="text-3xl font-bold text-gray-900">{listas}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
