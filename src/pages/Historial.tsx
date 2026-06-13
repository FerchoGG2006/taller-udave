import { useState } from 'react'
import { BuscarVehiculo } from '../components/vehiculos/BuscarVehiculo'
import { useHistorialOrdenes } from '../hooks/useOrdenes'
import { OrdenCard } from '../components/ordenes/OrdenCard'
import { Loader2 } from 'lucide-react'

export default function Historial() {
  const [placa, setPlaca] = useState<string | undefined>(undefined)
  const { data: ordenes, isLoading, isError, error } = useHistorialOrdenes(placa)

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Historial de Vehículos</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 max-w-2xl">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filtrar por Placa</h2>
        <BuscarVehiculo onBuscar={setPlaca} />
        {placa && (
          <button 
            onClick={() => setPlaca(undefined)}
            className="text-sm text-blue-600 mt-3 hover:underline"
          >
            Limpiar filtro y ver todas
          </button>
        )}
      </div>

      {isLoading && <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}
      {isError && <div className="p-4 bg-red-50 text-red-700 rounded-lg">Error: {(error as Error).message}</div>}

      {ordenes && (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              {placa ? `Historial para la placa: ${placa}` : 'Todas las órdenes históricas'}
            </h3>
          </div>
          
          {!ordenes.length ? (
            <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-500">No se encontraron órdenes para este filtro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ordenes.map(orden => (
                <OrdenCard key={orden.id} orden={orden} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
