import { useOrdenesActivas } from '../hooks/useOrdenes'
import { OrdenCard } from '../components/ordenes/OrdenCard'
import { Loader2, Inbox } from 'lucide-react'

export default function Ordenes() {
  const { data: ordenes, isLoading, isError, error } = useOrdenesActivas()

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500/80" /></div>
  if (isError) return <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">Error: {(error as Error).message}</div>

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8 bg-white/40 p-4 rounded-2xl backdrop-blur-sm border border-white/50 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Órdenes Activas</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Gestión de vehículos en el taller</p>
        </div>
        <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md shadow-blue-500/20">
          {ordenes?.length || 0} órdenes
        </span>
      </div>
      
      {!ordenes?.length ? (
        <div className="glass flex flex-col items-center justify-center p-16 text-center rounded-3xl">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
             <Inbox className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay órdenes activas</h3>
          <p className="text-gray-500 max-w-sm">Actualmente no hay vehículos en proceso. Puedes crear una nueva orden desde el menú lateral.</p>
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
