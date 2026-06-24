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
    <div className="glass rounded-2xl p-6 flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{orden.vehiculos?.placa}</h3>
          <p className="text-sm text-gray-500 font-medium">{orden.vehiculos?.marca} {orden.vehiculos?.modelo}</p>
        </div>
        <EstadoBadge estado={orden.estado as EstadoOrden} />
      </div>

      <div className="text-sm text-gray-600 mb-5 flex-1 space-y-3 border-t border-gray-100/50 pt-4">
        <div className="flex items-center gap-2.5 text-xs">
          <div className="p-1.5 bg-gray-100 rounded-lg"><User className="w-4 h-4 text-gray-500" /></div>
          <span className="text-gray-700"><strong>Cliente:</strong> {orden.vehiculos?.clientes?.nombre}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <div className="p-1.5 bg-gray-100 rounded-lg"><Phone className="w-4 h-4 text-gray-500" /></div>
          <span className="text-gray-700"><strong>Teléfono:</strong> {orden.vehiculos?.clientes?.telefono}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <div className="p-1.5 bg-gray-100 rounded-lg"><Users className="w-4 h-4 text-gray-500" /></div>
          <span className="truncate text-gray-700"><strong>Mecánicos:</strong> <span className="text-gray-500">{nombresMecanicos}</span></span>
        </div>

        {totalEstimado > 0 && (
          <div className="flex items-center gap-2.5 text-xs bg-gradient-to-r from-emerald-50 to-green-50 p-2.5 rounded-xl border border-green-100/50 shadow-sm mt-4">
            <div className="p-1 bg-white rounded-md shadow-sm"><DollarSign className="w-4 h-4 text-green-600" /></div>
            <span className="font-medium text-green-800">Presupuesto: <strong className="text-green-900 text-sm">${totalEstimado.toLocaleString('es-CO')}</strong></span>
          </div>
        )}

        {orden.observaciones && (
          <div className="mt-4 p-3 bg-white/50 rounded-xl text-xs text-gray-600 italic border border-gray-100 shadow-sm">
            "{orden.observaciones}"
          </div>
        )}
      </div>

      <div className="pt-5 border-t border-gray-100/50 mt-auto flex flex-wrap gap-2.5">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2.5 rounded-xl transition-all hover:shadow-sm"
        >
          <Clipboard className="w-4 h-4" /> Ficha de Trabajo
        </button>

        {orden.estado === 'recibido' && (
          <Button size="sm" onClick={() => handleUpdateEstado('diagnostico')} disabled={loading} className="rounded-xl px-4 py-2">
            Iniciar Diagnóstico
          </Button>
        )}
        {orden.estado === 'diagnostico' && (
          <Button size="sm" onClick={handleEnviarCliente} disabled={loading} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center gap-1.5 shadow-md shadow-amber-500/20 rounded-xl px-4 py-2 border-0">
            <MessageSquare className="w-4 h-4" /> Enviar a Cliente
          </Button>
        )}
        {orden.estado === 'esperando_aprobacion' && (
          <Button size="sm" variant="secondary" onClick={() => handleUpdateEstado('en_reparacion')} disabled={loading} className="rounded-xl px-4 py-2">
            Aprobación Manual
          </Button>
        )}
        {orden.estado === 'en_reparacion' && (
          <Button size="sm" onClick={() => handleUpdateEstado('listo')} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-md shadow-green-500/20 rounded-xl px-4 py-2 border-0">
            Marcar como Listo
          </Button>
        )}
        {orden.estado === 'listo' && (
          <Button size="sm" variant="secondary" onClick={() => handleUpdateEstado('entregado')} disabled={loading} className="rounded-xl px-4 py-2">
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
