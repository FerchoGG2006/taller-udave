import { useState } from 'react'
import { RecepcionVehiculoForm } from '../components/ordenes/RecepcionVehiculoForm'
import { CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

const WEB_PORTAL_URL = import.meta.env.VITE_WEB_PORTAL_URL || 'https://taller-udave.web.app'

export default function NuevaOrden() {
  const [ordenCreada, setOrdenCreada] = useState<{
    id: string;
    clienteNombre: string;
    clienteTelefono: string;
    vehiculoInfo: string;
  } | null>(null)

  const navigate = useNavigate()

  const handleSuccess = (ordenId: string, clienteNombre: string, clienteTelefono: string, vehiculoInfo: string) => {
    setOrdenCreada({ id: ordenId, clienteNombre, clienteTelefono, vehiculoInfo })
  }

  const handleWhatsApp = () => {
    if (!ordenCreada) return
    const { id, clienteNombre, clienteTelefono, vehiculoInfo } = ordenCreada
    
    const portalUrl = `${WEB_PORTAL_URL}/cliente/orden/${id}`
    const mensaje = `Hola ${clienteNombre}, te saludamos de *Taller Udave*. 🛠️\n\nHemos registrado el ingreso de tu vehículo *${vehiculoInfo}*.\n\nPuedes revisar el reporte de recepción detallado (incluyendo fotos de inventario) en línea aquí:\n👉 ${portalUrl}\n\nEn breve estaremos iniciando el diagnóstico.`
    
    // Formatear el teléfono para quitar espacios o el símbolo más, aunque wa.me maneja bien el formato internacional si está correcto.
    const tel = clienteTelefono.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`
    
    window.open(whatsappUrl, '_blank')
  }

  if (ordenCreada) {
    return (
      <div className="max-w-3xl mx-auto pb-12 px-4 md:px-0">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center shadow-2xl border border-slate-100 dark:border-slate-800">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-4">¡Ingreso Registrado con Éxito!</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
            El vehículo <strong className="text-slate-700 dark:text-slate-300">{ordenCreada.vehiculoInfo}</strong> de <strong className="text-slate-700 dark:text-slate-300">{ordenCreada.clienteNombre}</strong> ha sido ingresado al sistema.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleWhatsApp}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-2xl w-full sm:w-auto transition-colors shadow-lg shadow-green-500/30"
            >
              <MessageSquare className="w-5 h-5" /> Enviar Reporte por WhatsApp
            </button>
            <Button 
              variant="neumorphic"
              onClick={() => navigate('/ordenes')}
              className="px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold w-full sm:w-auto"
            >
              Ir a Órdenes <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4 md:px-0">
      <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Recepción de Vehículos</h1>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-8">Ingreso de clientes, vehículos y apertura de órdenes en un solo paso</p>
      
      <RecepcionVehiculoForm onSuccess={handleSuccess} />
    </div>
  )
}
