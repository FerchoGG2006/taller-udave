import { useState } from 'react'
import { EstadoBadge } from './EstadoBadge'
import { Button } from '../ui/Button'
import { type EstadoOrden, type Orden } from '../../types'
import { useCambiarEstadoOrden } from '../../hooks/useOrdenes'
import { DetalleOrdenModal } from './DetalleOrdenModal'
import { Clipboard, Phone, User, Users, DollarSign, MessageSquare } from 'lucide-react'

const WEB_PORTAL_URL = import.meta.env.VITE_WEB_PORTAL_URL || 'https://taller-udave.web.app'

export function OrdenCard({ orden }: { orden: Orden & { vehiculos?: Record<string, any>, order_mechanics?: any[] } }) {
  const cambiarEstado = useCambiarEstadoOrden()
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const handleUpdateEstado = async (nuevoEstado: EstadoOrden) => {
    setLoading(true)
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado: nuevoEstado })
    } catch {
      alert("Error al actualizar estado")
    }
    setLoading(false)
  }

  const handleEnviarCliente = async () => {
    setLoading(true)
    try {
      // 1. Cambiar estado a esperando_aprobacion en la base de datos
      await cambiarEstado.mutateAsync({ id: orden.id, estado: 'esperando_aprobacion' })
      
      // 2. Construir mensaje de WhatsApp
      const clienteNombre = orden.vehiculos?.clientes?.nombre || 'Cliente'
      const clienteTelefono = orden.vehiculos?.clientes?.telefono || ''
      const vehiculoInfo = `${orden.vehiculos?.marca} ${orden.vehiculos?.modelo} (Placa: ${orden.vehiculos?.placa.toUpperCase()})`
      
      // Portal url para el cliente
      const portalUrl = `${WEB_PORTAL_URL}/cliente/orden/${orden.id}`
      const mensaje = `Hola ${clienteNombre}, te saludamos de *Taller Udave*. 🛠️\n\nEl diagnóstico de tu vehículo *${vehiculoInfo}* ya está listo.\n\nPuedes revisar el presupuesto detallado, ver las fotos y autorizar los trabajos en línea aquí:\n👉 ${portalUrl}\n\nQuedamos atentos a tus comentarios.`
      
      // Limpiar el teléfono para wa.me (debe incluir código del país, ej 57 para colombia, sin espacios ni +)
      const cleanPhone = clienteTelefono.replace(/[^0-9]/g, '')
      
      // Abrir enlace de whatsapp
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`
      window.open(whatsappUrl, '_blank')
    } catch (err: any) {
      alert("Error al procesar el envío: " + err.message)
    }
    setLoading(false)
  }

  // Lista de mecánicos asignados
  const nombresMecanicos = orden.order_mechanics
    ?.map((om: any) => om.profiles?.full_name)
    .filter(Boolean)
    .join(', ') || 'Sin asignar'

  // Sumar costos
  const totalEstimado = (orden.labor_cost || 0) + (orden.parts_cost || 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">{orden.vehiculos?.placa}</h3>
          <p className="text-xs text-gray-500 font-medium">{orden.vehiculos?.marca} {orden.vehiculos?.modelo}</p>
        </div>
        <EstadoBadge estado={orden.estado as EstadoOrden} />
      </div>

      <div className="text-sm text-gray-600 mb-4 flex-1 space-y-2 border-t border-gray-50 pt-3">
        <div className="flex items-center gap-2 text-xs">
          <User className="w-4 h-4 text-gray-400" />
          <span><strong>Cliente:</strong> {orden.vehiculos?.clientes?.nombre}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Phone className="w-4 h-4 text-gray-400" />
          <span><strong>Teléfono:</strong> {orden.vehiculos?.clientes?.telefono}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="truncate"><strong>Mecánicos:</strong> <span className="text-gray-500">{nombresMecanicos}</span></span>
        </div>

        {totalEstimado > 0 && (
          <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-lg border border-gray-150">
            <DollarSign className="w-4 h-4 text-green-600 font-black" />
            <span>Presupuesto: <strong className="text-gray-900">${totalEstimado.toLocaleString('es-CO')}</strong></span>
          </div>
        )}

        {orden.observaciones && (
          <div className="mt-3 p-2.5 bg-gray-50/50 rounded-lg text-xs text-gray-500 italic border border-gray-100">
            "{orden.observaciones}"
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 mt-auto flex flex-wrap gap-2">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-2 rounded-lg transition-colors"
        >
          <Clipboard className="w-3.5 h-3.5" /> Ficha de Trabajo
        </button>

        {orden.estado === 'recibido' && (
          <Button size="sm" onClick={() => handleUpdateEstado('diagnostico')} disabled={loading}>
            Iniciar Diagnóstico
          </Button>
        )}
        {orden.estado === 'diagnostico' && (
          <Button size="sm" onClick={handleEnviarCliente} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Enviar a Cliente
          </Button>
        )}
        {orden.estado === 'esperando_aprobacion' && (
          <Button size="sm" variant="secondary" onClick={() => handleUpdateEstado('en_reparacion')} disabled={loading}>
            Aprobación Manual
          </Button>
        )}
        {orden.estado === 'en_reparacion' && (
          <Button size="sm" onClick={() => handleUpdateEstado('listo')} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
            Marcar como Listo
          </Button>
        )}
        {orden.estado === 'listo' && (
          <Button size="sm" variant="secondary" onClick={() => handleUpdateEstado('entregado')} disabled={loading}>
            Entregar Vehículo
          </Button>
        )}
      </div>

      {/* Modal Detallado de Ficha y Diagnóstico */}
      {modalOpen && (
        <DetalleOrdenModal
          orden={orden}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
