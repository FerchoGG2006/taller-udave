import { type EstadoOrden } from '../../types'
import { cn } from '../../lib/utils'

export function EstadoBadge({ estado }: { estado: EstadoOrden }) {
  const configs: Record<EstadoOrden, { label: string, className: string }> = {
    recibido: { label: 'Recibido', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    diagnostico: { label: 'En Diagnóstico', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    esperando_aprobacion: { label: 'Esperando Aprobación', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    en_reparacion: { label: 'En Reparación', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    listo: { label: 'Listo', className: 'bg-green-100 text-green-800 border-green-200' },
    entregado: { label: 'Entregado', className: 'bg-gray-800 text-gray-100 border-gray-900' }
  }

  const config = configs[estado] || configs.recibido

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", config.className)}>
      {config.label}
    </span>
  )
}
