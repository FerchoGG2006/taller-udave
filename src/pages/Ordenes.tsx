import { useOrdenesActivas } from '../hooks/useOrdenes'
import { OrdenCard } from '../components/ordenes/OrdenCard'
import { Loader2 } from 'lucide-react'

export default function Ordenes() {
  const { data: ordenes, isLoading, isError, error } = useOrdenesActivas()

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (isError) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">Error: {(error as Error).message}</div>

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Órdenes Activas</h1>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
          {ordenes?.length || 0} órdenes
        </span>
      </div>
      
      {!ordenes?.length ? (
        <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500">No hay órdenes activas en el taller.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ordenes.map(orden => (
            <OrdenCard key={orden.id} orden={orden} />
          ))}
        </div>
      )}
    </div>
  )
}
