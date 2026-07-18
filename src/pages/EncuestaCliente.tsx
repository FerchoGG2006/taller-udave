import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Star, MessageSquare, CheckCircle, Sparkles, Loader2 } from 'lucide-react'

export default function EncuestaCliente() {
  const { id: ordenId } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orden, setOrden] = useState<any>(null)
  
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comentarios, setComentarios] = useState('')
  const [success, setSuccess] = useState(false)
  const [alreadyVoted, setAlreadyVoted] = useState(false)

  const verificarEncuesta = async () => {
    try {
      // 1. Verificar si ya votó
      const { data: encuestaExistente } = await supabase
        .from('encuestas_satisfaccion')
        .select('id')
        .eq('orden_id', ordenId)
        .maybeSingle()

      if (encuestaExistente) {
        setAlreadyVoted(true)
        setLoading(false)
        return
      }

      // 2. Traer info de la orden
      const { data: ordenData, error } = await supabase
        .from('ordenes')
        .select('*, vehiculos(marca, modelo, placa, clientes(nombre))')
        .eq('id', ordenId)
        .single()

      if (error) throw error
      setOrden(ordenData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ordenId) {
      verificarEncuesta()
    }
  }, [ordenId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return alert('Por favor, selecciona una calificación.')
    
    setSubmitting(true)
    try {
      const { error } = await supabase.from('encuestas_satisfaccion').insert({
        orden_id: ordenId,
        calificacion_estrellas: rating,
        comentarios: comentarios
      })
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      console.error(err)
      alert('Error al enviar la encuesta. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (alreadyVoted || success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="neumorphic-outset border-none p-10 rounded-[2.5rem] max-w-md w-full text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-6 animate-fade-in">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">¡Gracias por tu opinión!</h2>
          <p className="text-slate-500 text-sm">
            {success ? 'Hemos recibido tu encuesta exitosamente.' : 'Ya habías llenado la encuesta para esta orden.'} Tu feedback nos ayuda a mejorar.
          </p>
        </div>
      </div>
    )
  }

  if (!orden) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="neumorphic-outset border-none p-8 rounded-3xl text-center">
          <h2 className="text-xl font-bold text-red-500">Orden no encontrada</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 selection:bg-indigo-500/30 font-sans text-slate-800 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-xl animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-indigo-500 mr-2" />
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Taller Udave</h1>
          </div>
          <h2 className="text-xl font-bold text-slate-600">Encuesta de Satisfacción</h2>
        </div>

        {/* Card Principal Neumórfica */}
        <div className="neumorphic-outset border-none p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
          {/* Decoración sutil de fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="mb-8 bg-white/50 p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <p className="text-sm text-slate-500 mb-1">Hola <span className="font-bold text-slate-700">{orden.vehiculos?.clientes?.nombre}</span>,</p>
              <p className="text-sm text-slate-600">
                Nos encantaría saber cómo fue tu experiencia con el mantenimiento de tu 
                <span className="font-bold mx-1 text-indigo-600">{orden.vehiculos?.marca} {orden.vehiculos?.modelo}</span> 
                (<span className="font-mono text-xs bg-slate-200 px-1 rounded">{orden.vehiculos?.placa}</span>).
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Estrellas */}
              <div className="text-center">
                <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-4">
                  ¿Cómo calificarías nuestro servicio?
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="transition-transform hover:scale-110 focus:outline-none"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      title={`Calificar con ${star} estrellas`}
                    >
                      <Star 
                        className={`w-12 h-12 transition-colors duration-200 ${
                          (hoverRating || rating) >= star 
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
                            : 'text-slate-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comentarios */}
              <div>
                <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  Déjanos tus comentarios (opcional)
                </label>
                <textarea
                  className="w-full h-32 p-4 neumorphic-inset border-none rounded-2xl outline-none resize-none text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                  placeholder="¿Qué podemos mejorar?"
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="w-full flex items-center justify-center p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enviar Calificación'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
