import { useState } from 'react'
import { EstadoBadge } from './EstadoBadge'
import { type EstadoOrden, type Orden, type Vehiculo, type Cliente, type OrderMechanic } from '../../types'
import { useCambiarEstadoOrden } from '../../hooks/useOrdenes'
import { DetalleOrdenModal } from './DetalleOrdenModal'
import { Clipboard, Phone, User, Users, DollarSign, MessageSquare } from 'lucide-react'

const WEB_PORTAL_URL = import.meta.env.VITE_WEB_PORTAL_URL || 'https://taller-udave.web.app'

export function OrdenCard({ orden }: { 
  orden: Orden & { 
    vehiculos?: Vehiculo & { 
      clientes?: Cliente 
    }, 
    order_mechanics?: (OrderMechanic & { 
      profiles?: { 
        full_name?: string 
      } | null
    })[] 
  } 
}) {
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      alert("Error al procesar el envío: " + errorMessage)
    }
    setLoading(false)
  }

  // Lista de mecánicos asignados
  const nombresMecanicos = orden.order_mechanics
    ?.map((om) => om.profiles?.full_name)
    .filter(Boolean)
    .join(', ') || 'Sin asignar'

  // Sumar costos
  const totalEstimado = (orden.labor_cost || 0) + (orden.parts_cost || 0)

  return (
    <div className="neumorphic-outset border-none rounded-[2rem] p-6 flex flex-col h-full transition-all duration-350 hover:scale-[1.015] group">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{orden.vehiculos?.placa}</h3>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">{orden.vehiculos?.marca} {orden.vehiculos?.modelo}</p>
        </div>
        <EstadoBadge estado={orden.estado as EstadoOrden} />
      </div>

      <div className="text-sm text-slate-600 dark:text-slate-400 mb-5 flex-1 space-y-3 pt-4">
        <div className="flex items-center gap-3 text-xs">
          <div className="p-2 neumorphic-inset border-none rounded-xl text-slate-500 shrink-0 shadow-inner">
            <User className="w-4 h-4" />
          </div>
          <span className="text-slate-700 dark:text-slate-350">
            <strong>Cliente:</strong> {orden.vehiculos?.clientes?.nombre}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 neumorphic-inset border-none rounded-xl text-slate-500 shrink-0 shadow-inner">
              <Phone className="w-4 h-4" />
            </div>
            <span className="text-slate-700 dark:text-slate-350">
              <strong>Teléfono:</strong> {orden.vehiculos?.clientes?.telefono}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const telefono = orden.vehiculos?.clientes?.telefono || '';
              const cleanPhone = telefono.replace(/[^0-9]/g, '');
              const mensaje = `Hola ${orden.vehiculos?.clientes?.nombre}, te escribimos de *Taller Udave*. 🛠️\n\n¿En qué podemos ayudarte con tu ${orden.vehiculos?.marca} ${orden.vehiculos?.modelo} (Placa: ${orden.vehiculos?.placa.toUpperCase()})?`;
              window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`, '_blank');
            }}
            className="flex items-center justify-center p-2 rounded-full bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:scale-110 transition-transform cursor-pointer"
            title="Contactar por WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="p-2 neumorphic-inset border-none rounded-xl text-slate-500 shrink-0 shadow-inner">
            <Users className="w-4 h-4" />
          </div>
          <span className="truncate text-slate-700 dark:text-slate-350">
            <strong>Mecánicos:</strong> <span className="text-slate-500">{nombresMecanicos}</span>
          </span>
        </div>

        {totalEstimado > 0 && (
          <div className="flex items-center gap-3 text-xs bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/10 shadow-sm mt-4">
            <div className="p-1.5 neumorphic-inset border-none rounded-lg text-emerald-600"><DollarSign className="w-4 h-4" /></div>
            <span className="font-semibold text-emerald-800 dark:text-emerald-400">Presupuesto: <strong className="text-emerald-700 dark:text-emerald-400 text-sm font-black">${totalEstimado.toLocaleString('es-CO')}</strong></span>
          </div>
        )}

        {orden.observaciones && (
          <div className="mt-4 p-4 neumorphic-inset border-none rounded-2xl text-xs text-slate-500 italic leading-relaxed shadow-inner">
            "{orden.observaciones}"
          </div>
        )}
      </div>

      <div className="pt-5 border-t border-slate-200/50 dark:border-slate-700/50 mt-auto flex flex-wrap gap-2.5">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 neumorphic-btn border-none px-4 py-2.5 rounded-2xl"
        >
          <Clipboard className="w-4 h-4" /> Ficha de Trabajo
        </button>

        {orden.estado === 'recibido' && (
          <button 
            onClick={() => handleUpdateEstado('diagnostico')} 
            disabled={loading} 
            className="text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 px-4 py-2.5 rounded-2xl shadow-md transition-all active:scale-[0.98]"
          >
            Iniciar Diagnóstico
          </button>
        )}
        {orden.estado === 'diagnostico' && (
          <button 
            onClick={handleEnviarCliente} 
            disabled={loading} 
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center gap-1.5 shadow-md shadow-amber-500/20 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all active:scale-[0.98]"
          >
            <MessageSquare className="w-4 h-4" /> Enviar a Cliente
          </button>
        )}
        {orden.estado === 'esperando_aprobacion' && (
          <button 
            onClick={() => handleUpdateEstado('en_reparacion')} 
            disabled={loading} 
            className="text-xs font-bold text-slate-700 dark:text-slate-300 neumorphic-btn border-none px-4 py-2.5 rounded-2xl"
          >
            Aprobación Manual
          </button>
        )}
        {orden.estado === 'en_reparacion' && (
          <button 
            onClick={() => handleUpdateEstado('listo')} 
            disabled={loading} 
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-md shadow-green-500/20 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all active:scale-[0.98]"
          >
            Marcar como Listo
          </button>
        )}
        {orden.estado === 'listo' && (
          <button 
            onClick={() => handleUpdateEstado('entregado')} 
            disabled={loading} 
            className="text-xs font-bold text-slate-700 dark:text-slate-300 neumorphic-btn border-none px-4 py-2.5 rounded-2xl"
          >
            Entregar Vehículo
          </button>
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
