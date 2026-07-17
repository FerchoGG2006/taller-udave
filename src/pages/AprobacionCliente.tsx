import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  CheckCircle2, 
  AlertTriangle, 
  Car, 
  Calendar, 
  DollarSign, 
  Image as ImageIcon, 
  Loader2, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  User
} from 'lucide-react'

// Función helper para convertir DataURL (base64) a Blob
function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

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

  // Carousel State
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  // Signature States
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

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

  // Canvas Drawing Handlers
  const getMousePos = (e: any) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    
    // Soporte táctil y mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e: any) => {
    const pos = getMousePos(e)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      setIsDrawing(true)
      setIsCanvasEmpty(false)
    }
  }

  const draw = (e: any) => {
    if (!isDrawing) return
    const pos = getMousePos(e)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setIsCanvasEmpty(true)
      
      // Re-inicializar estilos de trazo
      ctx.strokeStyle = '#0f172a' // slate-900
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }

  // Inicializar estilos de canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#0f172a'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  }, [loading, error, orden])

  const toggleItem = (itemId: string) => {
    setItemsAprobados(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const handleAprobarPresupuesto = async () => {
    if (isCanvasEmpty) {
      alert("Por favor, estampa tu firma antes de enviar la autorización.")
      return
    }

    setGuardando(true)
    try {
      let signatureUrl = null

      // 1. Subir la firma a Supabase Storage
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png')
        const blob = dataURLtoBlob(dataUrl)
        
        const fileName = `firmas/${id}_${Date.now()}.png`
        const { error: uploadError } = await supabase.storage
          .from('taller-fotos')
          .upload(fileName, blob, {
            upsert: true,
            contentType: 'image/png'
          })

        if (uploadError) {
          console.warn("No se pudo guardar la firma en Storage (¿Falta crear el bucket?). Continuando sin firma en la nube...", uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('taller-fotos')
            .getPublicUrl(fileName)
          signatureUrl = publicUrl
        }
      }

      // 2. Actualizar cada item_orden en Supabase
      const promesasItems = items.map(item => {
        const aprobado = !!itemsAprobados[item.id]
        return supabase
          .from('items_orden')
          .update({ aprobado })
          .eq('id', item.id)
      })

      await Promise.all(promesasItems)

      // 3. Marcar la orden como aprobada por el cliente y pasarla a 'en_reparacion'
      const updateData: any = {
        aprobado_por_cliente: true,
        estado: 'en_reparacion'
      }
      
      if (signatureUrl) {
        updateData.cliente_firma_url = signatureUrl
      }

      const { error: errOrden } = await supabase
        .from('ordenes')
        .update(updateData)
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400 font-medium tracking-wide">Cargando presupuesto digital...</p>
      </div>
    )
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-500/10 text-red-500 rounded-full mb-4 border border-red-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white">Presupuesto no localizado</h1>
        <p className="text-sm text-slate-400 max-w-sm mt-2">{error || 'No pudimos localizar la orden de servicio solicitada.'}</p>
      </div>
    )
  }

  // Totales
  const totalAprobado = items.reduce((sum, item) => {
    return sum + (itemsAprobados[item.id] ? (parseFloat(item.precio) || 0) : 0)
  }, 0)

  const totalOriginal = items.reduce((sum, item) => sum + (parseFloat(item.precio) || 0), 0)

  const handlePrevPhoto = () => {
    setActivePhotoIndex(prev => (prev === 0 ? fotos.length - 1 : prev - 1))
  }

  const handleNextPhoto = () => {
    setActivePhotoIndex(prev => (prev === fotos.length - 1 ? 0 : prev + 1))
  }

  if (exito) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-3xl border border-slate-700/80 p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <h1 className="text-2xl font-black text-white">¡Presupuesto Autorizado!</h1>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Hemos registrado tu firma y aprobación. Nuestro equipo ha sido notificado y comenzará a trabajar en tu vehículo de inmediato.
          </p>
          
          <div className="mt-6 p-4 bg-slate-900/60 rounded-2xl border border-slate-700 text-left text-xs space-y-2">
            <p className="text-slate-400">Placa: <strong className="text-white uppercase font-bold">{orden.vehiculos?.placa}</strong></p>
            <p className="text-slate-400">Total Aprobado: <strong className="text-emerald-400 text-sm font-black">${totalAprobado.toLocaleString('es-CO')}</strong></p>
            <p className="text-slate-400">Estado de Orden: <strong className="text-indigo-400 font-bold">En Reparación 🛠️</strong></p>
          </div>
          
          <p className="text-xs text-slate-500 mt-8">Taller Udave — Valledupar, Colombia</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16 font-sans">
      {/* Cabecera / Banner */}
      <header className="bg-slate-950/80 border-b border-slate-800/80 sticky top-0 backdrop-blur-md z-40 px-4 py-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
            <div>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                Portal de Seguimiento
              </span>
              <h1 className="text-lg font-black tracking-tight text-white mt-0.5">Taller Udave</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Orden de Servicio</p>
            <p className="text-sm font-extrabold text-indigo-400">#{orden.order_number || '—'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* Ficha del Vehículo */}
        <section className="bg-slate-950/40 rounded-3xl border border-slate-800/80 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Car className="w-32 h-32" />
          </div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Car className="w-4 h-4 text-indigo-400" /> Ficha Técnica del Vehículo
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm relative z-10">
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/50">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Marca / Modelo</p>
              <p className="font-bold text-white mt-1">{orden.vehiculos?.marca} {orden.vehiculos?.modelo}</p>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/50">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Placa</p>
              <p className="font-extrabold text-indigo-400 text-base mt-0.5 uppercase tracking-wide">{orden.vehiculos?.placa}</p>
            </div>
            {orden.vehiculos?.anio && (
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/50">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Año modelo</p>
                <p className="font-semibold text-white mt-1">{orden.vehiculos?.anio}</p>
              </div>
            )}
            {orden.vehiculos?.color && (
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/50">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Color</p>
                <p className="font-semibold text-white mt-1 capitalize">{orden.vehiculos?.color}</p>
              </div>
            )}
          </div>
        </section>

        {/* Diagnóstico técnico */}
        {(orden.diagnosis || orden.observaciones) && (
          <section className="bg-slate-950/40 rounded-3xl border border-slate-800/80 p-5 backdrop-blur-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" /> Diagnóstico & Observaciones
            </h2>
            <div className="space-y-4 text-sm">
              {orden.observaciones && (
                <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Reportado por el Cliente</p>
                  <p className="text-slate-300 mt-1 italic leading-relaxed">"{orden.observaciones}"</p>
                </div>
              )}
              {orden.diagnosis && (
                <div className="bg-indigo-950/20 p-4 rounded-2xl border border-indigo-500/10">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Diagnóstico Técnico Autorizado</p>
                  <p className="text-slate-200 mt-2 font-medium leading-relaxed">
                    {orden.diagnosis}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Galería de Fotos del diagnóstico (Carrusel Interactivo Premium) */}
        {fotos && fotos.length > 0 && (
          <section className="bg-slate-950/40 rounded-3xl border border-slate-800/80 p-5 backdrop-blur-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" /> Galería de Inspección ({fotos.length})
            </h2>
            
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video group shadow-xl">
              <img 
                src={fotos[activePhotoIndex].url} 
                alt={`Inspección ${fotos[activePhotoIndex].tipo}`} 
                className="w-full h-full object-contain transition-all duration-500" 
              />
              
              {/* Degradado inferior */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
              
              {/* Tag del tipo */}
              <span className="absolute top-3 left-3 text-[10px] bg-slate-950/90 border border-slate-700 text-indigo-400 px-3 py-1 rounded-full capitalize font-bold tracking-wider">
                Etapa: {fotos[activePhotoIndex].tipo}
              </span>

              {/* Botón Prev */}
              {fotos.length > 1 && (
                <button 
                  onClick={handlePrevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full border border-slate-700/50 backdrop-blur-sm opacity-80 hover:opacity-100 transition-all"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Botón Next */}
              {fotos.length > 1 && (
                <button 
                  onClick={handleNextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full border border-slate-700/50 backdrop-blur-sm opacity-80 hover:opacity-100 transition-all"
                  aria-label="Siguiente foto"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Indicadores de Posición y thumbnails */}
            {fotos.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {fotos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === activePhotoIndex ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-700'}`}
                    aria-label={`Ir a foto ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Presupuesto interactivo */}
        <section className="bg-slate-950/40 rounded-3xl border border-slate-800/80 p-5 backdrop-blur-sm">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-400" /> Presupuesto Detallado
          </h2>

          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Por favor, aprueba o descarta individualmente los ítems del servicio técnico sugeridos a continuación:
          </p>

          {!items?.length ? (
            <div className="p-6 text-center text-slate-400 text-sm bg-slate-900/60 border border-slate-800 rounded-2xl">
              No hay ítems detallados para esta orden de servicio.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const aprobado = !!itemsAprobados[item.id]
                return (
                  <div 
                    key={item.id} 
                    onClick={() => toggleItem(item.id)}
                    className={`flex justify-between items-center p-4 border rounded-2xl cursor-pointer transition-all duration-200 select-none ${aprobado ? 'bg-indigo-500/10 border-indigo-500/80 shadow-md shadow-indigo-500/5' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center border transition-all ${aprobado ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-600 bg-slate-950'}`}>
                        {aprobado && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-snug">{item.descripcion}</p>
                      </div>
                    </div>
                    <div className="text-right pl-3">
                      <p className={`text-sm font-extrabold transition-colors ${aprobado ? 'text-indigo-400' : 'text-slate-300'}`}>
                        ${parseFloat(item.precio).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Suma Financiera */}
          {items && items.length > 0 && (
            <div className="mt-6 border-t border-slate-800 pt-5 space-y-3">
              <div className="flex justify-between text-xs text-slate-400 font-semibold px-1">
                <span>Total Presupuesto Completo:</span>
                <span className="text-slate-300">${totalOriginal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center text-sm bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                <span className="font-bold text-slate-300">Monto Aprobado:</span>
                <span className="text-lg font-black text-emerald-400">${totalAprobado.toLocaleString('es-CO')}</span>
              </div>
            </div>
          )}
        </section>

        {/* Firma Digital del Cliente */}
        {items && items.length > 0 && totalAprobado > 0 && (
          <section className="bg-slate-950/40 rounded-3xl border border-slate-800/80 p-5 backdrop-blur-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> Firma de Autorización
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dibuja tu firma en el recuadro a continuación para autorizar la reparación de los servicios aprobados:
            </p>

            <div className="border border-slate-700/85 rounded-2xl overflow-hidden bg-slate-950 relative">
              <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-800 bg-slate-900/50">
                <span className="text-xs font-semibold text-slate-400">Firma del Propietario</span>
                <button 
                  type="button" 
                  onClick={clearCanvas} 
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-350 transition-colors"
                >
                  Limpiar Firma
                </button>
              </div>
              <canvas
                ref={canvasRef}
                className="w-full h-44 cursor-crosshair touch-none bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                width={600}
                height={176}
              />
            </div>
            
            <div className="flex items-start gap-2.5 px-1 pt-1">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Al firmar y autorizar, aceptas la cotización de los servicios marcados. El taller registrará tu firma en la orden de servicio.
              </p>
            </div>
          </section>
        )}

        {/* Botón de envío */}
        <button
          onClick={handleAprobarPresupuesto}
          disabled={guardando || !items?.length || totalAprobado === 0 || isCanvasEmpty}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold py-4 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {guardando ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Enviar Autorización Firmada'
          )}
        </button>
      </main>

      <footer className="text-center text-xs text-slate-500 mt-12 px-4 space-y-1.5">
        <p>© 2026 Taller Udave. Todos los derechos reservados.</p>
        <p>Valledupar, Colombia • Si tienes dudas, contáctanos por WhatsApp al número del taller.</p>
      </footer>
    </div>
  )
}
