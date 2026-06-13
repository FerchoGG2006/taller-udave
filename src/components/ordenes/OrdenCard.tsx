import { useState } from 'react'
import { EstadoBadge } from './EstadoBadge'
import { Button } from '../ui/Button'
import { type EstadoOrden, type Orden } from '../../types'
import { useCambiarEstadoOrden } from '../../hooks/useOrdenes'

export function OrdenCard({ orden }: { orden: Orden & { vehiculos?: Record<string, any> } }) {
  const cambiarEstado = useCambiarEstadoOrden()
  const [loading, setLoading] = useState(false)

  const handleUpdateEstado = async (nuevoEstado: EstadoOrden) => {
    setLoading(true)
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado: nuevoEstado })
    } catch {
      alert("Error al actualizar estado")
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 uppercase">{orden.vehiculos?.placa}</h3>
          <p className="text-sm text-gray-500">{orden.vehiculos?.marca} {orden.vehiculos?.modelo}</p>
        </div>
        <EstadoBadge estado={orden.estado as EstadoOrden} />
      </div>

      <div className="text-sm text-gray-600 mb-4 flex-1 space-y-1">
        <p><strong>Cliente:</strong> {orden.vehiculos?.clientes?.nombre}</p>
        <p><strong>Teléfono:</strong> {orden.vehiculos?.clientes?.telefono}</p>
        {orden.observaciones && (
          <p className="mt-2 text-gray-500 line-clamp-2"><em>"{orden.observaciones}"</em></p>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 mt-auto flex flex-wrap gap-2">
        {orden.estado === 'recibido' && (
          <Button size="sm" onClick={() => handleUpdateEstado('diagnostico')} disabled={loading}>Iniciar Diagnóstico</Button>
        )}
        {orden.estado === 'diagnostico' && (
          <Button size="sm" onClick={() => handleUpdateEstado('esperando_aprobacion')} disabled={loading}>Enviar a Cliente</Button>
        )}
        {orden.estado === 'esperando_aprobacion' && (
          <Button size="sm" variant="secondary" onClick={() => handleUpdateEstado('en_reparacion')} disabled={loading}>Aprobación Manual</Button>
        )}
        {orden.estado === 'en_reparacion' && (
          <Button size="sm" onClick={() => handleUpdateEstado('listo')} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">Marcar como Listo</Button>
        )}
        {orden.estado === 'listo' && (
          <Button size="sm" variant="secondary" onClick={() => handleUpdateEstado('entregado')} disabled={loading}>Entregar Vehículo</Button>
        )}
      </div>
    </div>
  )
}
