import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle2, AlertTriangle, Car, Calendar, DollarSign, Image as ImageIcon, Loader2, Check } from 'lucide-react'

export default function AprobacionCliente() {
  const { id } = useParams<{ id: string }>()
  
  // States
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orden, setOrden] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [fotos, setFotos] = useState<any[]>([])
  
  // Checkbox de aprobación local
  const [itemsAprobados, setItemsAprobados] = useState<Record<string, boolean>>({})
  const [exito, setExito] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargarDatos() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        // 1. Cargar Orden con vehículo y cliente (lectura anónima permitida por RLS)
        const { data: ordenData, error: errOrden } = await supabase
          .from('ordenes')
          .select(`
            *,
            vehiculos (
              placa, marca, modelo, color, anio,
              clientes (nombre, telefono)
            )
          `)
          .eq('id', id)
          .single()

        if (errOrden) throw new Error(errOrden.message)
        if (!ordenData) throw new Error("Orden no encontrada")
        setOrden(ordenData)

        // 2. Cargar items de la orden
        const { data: itemsData, error: errItems } = await supabase
          .from('items_orden')
          .select('*')
          .eq('orden_id', id)

        if (errItems) throw new Error(errItems.message)
        setItems(itemsData || [])

        // Inicializar checkboxes (los que ya estén aprobados en DB)
        const checkMap: Record<string, boolean> = {}
        itemsData?.forEach(item => {
          checkMap[item.id] = item.aprobado
        })
        setItemsAprobados(checkMap)

        // 3. Cargar fotos
        const { data: fotosData, error: errFotos } = await supabase
          .from('fotos_orden')
          .select('*')
          .eq('orden_id', id)
        
        if (errFotos) throw new Error(errFotos.message)
        setFotos(fotosData || [])

      } catch (err: any) {
        setError(err.message || "No se pudo cargar la información del presupuesto")
      }
      setLoading(false)
    }

    cargarDatos()
  }, [id])

  const toggleItem = (itemId: string) => {
    setItemsAprobados(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const handleAprobarPresupuesto = async () => {
    setGuardando(true)
    try {
      // 1. Actualizar cada item_orden en Supabase
      const promesasItems = items.map(item => {
        const aprobado = !!itemsAprobados[item.id]
        return supabase
          .from('items_orden')
          .update({ aprobado })
          .eq('id', item.id)
      })

      await Promise.all(promesasItems)

      // 2. Marcar la orden como aprobada por el cliente y pasarla a 'en_reparacion'
      const { error: errOrden } = await supabase
        .from('ordenes')
        .update({
          aprobado_por_cliente: true,
          estado: 'en_reparacion'
        })
        .eq('id', id)

      if (errOrden) throw new Error(errOrden.message)

      setExito(true)
    } catch (err: any) {
      alert("Error al guardar la aprobación: " + err.message)
    }
    setGuardando(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm text-slate-500 font-medium">Cargando presupuesto...</p>
      </div>
    )
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="p-3 bg-red-150 text-red-600 rounded-full mb-3">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">Ocurrió un inconveniente</h1>
        <p className="text-sm text-slate-500 max-w-sm mt-1">{error || 'No pudimos localizar esta orden de servicio'}</p>
      </div>
    )
  }

  // Sumar total aprobado
  const totalAprobado = items.reduce((sum, item) => {
    return sum + (itemsAprobados[item.id] ? (parseFloat(item.precio) || 0) : 0)
  }, 0)

  // Total original completo
  const totalOriginal = items.reduce((sum, item) => sum + (parseFloat(item.precio) || 0), 0)

  if (exito) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-green-150">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">¡Presupuesto Aprobado!</h1>
          <p className="text-sm text-slate-600 mt-2.5">
            Hemos recibido tu autorización. Los mecánicos en el taller iniciarán las labores de inmediato para tener tu vehículo listo lo antes posible.
          </p>
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-150 text-left text-xs space-y-1.5">
            <p className="text-slate-500">Vehículo: <strong className="text-slate-800 uppercase">{orden.vehiculos?.placa}</strong></p>
            <p className="text-slate-500">Monto Aprobado: <strong className="text-green-600">${totalAprobado.toLocaleString('es-CO')}</strong></p>
          </div>
          <p className="text-xs text-slate-400 mt-6">Taller Udave — Pasión por el servicio</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      {/* Cabecera / Banner */}
      <header className="bg-slate-900 text-white py-6 px-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Presupuesto Digital
            </span>
            <h1 className="text-xl font-black tracking-tight mt-1">Taller Udave</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Orden de Servicio</p>
            <p className="text-sm font-extrabold text-indigo-400">#{orden.order_number || '—'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* Ficha del Vehículo */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Car className="w-4 h-4" /> Datos de tu Vehículo
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Marca / Modelo</p>
              <p className="font-bold text-slate-900 mt-0.5">{orden.vehiculos?.marca} {orden.vehiculos?.modelo}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Placa</p>
              <p className="font-bold text-slate-900 mt-0.5 uppercase">{orden.vehiculos?.placa}</p>
            </div>
            {orden.vehiculos?.anio && (
              <div>
                <p className="text-xs text-slate-400">Año modelo</p>
                <p className="font-medium text-slate-900 mt-0.5">{orden.vehiculos?.anio}</p>
              </div>
            )}
            {orden.vehiculos?.color && (
              <div>
                <p className="text-xs text-slate-400">Color</p>
                <p className="font-medium text-slate-900 mt-0.5 capitalize">{orden.vehiculos?.color}</p>
              </div>
            )}
          </div>
        </section>

        {/* Diagnóstico técnico */}
        {(orden.diagnosis || orden.observaciones) && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Reporte de Ingreso y Diagnóstico
            </h2>
            <div className="space-y-3 text-sm">
              {orden.observaciones && (
                <div>
                  <p className="text-xs text-slate-400">Observaciones del Cliente</p>
                  <p className="text-slate-700 mt-0.5 italic">"{orden.observaciones}"</p>
                </div>
              )}
              {orden.diagnosis && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-400 font-bold">Diagnóstico del Mecánico</p>
                  <p className="text-slate-800 mt-1 font-medium bg-indigo-50/30 p-3 rounded-lg border border-indigo-100/55 leading-relaxed">
                    {orden.diagnosis}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Galería de Fotos del diagnóstico */}
        {fotos && fotos.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> Fotos de Inspección ({fotos.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {fotos.map((f) => (
                <div key={f.id} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-video group cursor-pointer" onClick={() => window.open(f.url, '_blank')}>
                  <img src={f.url} alt={`Inspección ${f.tipo}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-355" />
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-slate-950/80 text-white px-2 py-0.5 rounded capitalize font-semibold">
                    {f.tipo}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Presupuesto interactivo */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" /> Detalle del Presupuesto
          </h2>

          <p className="text-xs text-slate-500 mb-4">
            Selecciona los servicios que deseas autorizar. El taller solo realizará los trabajos que selecciones.
          </p>

          {!items?.length ? (
            <div className="p-4 text-center text-slate-500 text-sm bg-slate-50 border border-slate-100 rounded-xl">
              No hay ítems detallados para esta orden. Por favor, comunícate con el taller.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => toggleItem(item.id)}
                  className={`flex justify-between items-center p-3.5 border rounded-xl cursor-pointer transition-all ${itemsAprobados[item.id] ? 'bg-indigo-50/40 border-indigo-400 hover:border-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${itemsAprobados[item.id] ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-350'}`}>
                      {itemsAprobados[item.id] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-snug">{item.descripcion}</p>
                    </div>
                  </div>
                  <div className="text-right pl-3">
                    <p className="text-sm font-black text-slate-950">${parseFloat(item.precio).toLocaleString('es-CO', { minimumFractionDigits: 0 })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suma Financiera */}
          {items && items.length > 0 && (
            <div className="mt-6 border-t border-slate-150 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Total Presupuesto Completo:</span>
                <span>${totalOriginal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-950 bg-slate-55 p-3 rounded-xl border border-slate-200">
                <span>Total Aprobado:</span>
                <span className="text-green-600">${totalAprobado.toLocaleString('es-CO')}</span>
              </div>
            </div>
          )}
        </section>

        {/* Botón de envío */}
        <button
          onClick={handleAprobarPresupuesto}
          disabled={guardando || !items?.length || totalAprobado === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold py-3.5 rounded-2xl text-sm transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {guardando ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Autorizar Trabajos y Presupuesto'
          )}
        </button>
      </main>

      <footer className="text-center text-xs text-slate-400 mt-12 px-4">
        <p>© 2026 Taller Udave. Todos los derechos reservados.</p>
        <p className="mt-1">Si tienes dudas sobre el diagnóstico, contáctanos por WhatsApp al número del taller.</p>
      </footer>
    </div>
  )
}
