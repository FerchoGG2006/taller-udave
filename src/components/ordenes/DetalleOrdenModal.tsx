import { useState, useEffect } from 'react'
import { useActualizarOrdenDetalles } from '../../hooks/useOrdenes'
import { useMecanicosActivos } from '../../hooks/useProfiles'
import { supabase } from '../../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Calendar, Clipboard, User, DollarSign, Image as ImageIcon, PlusCircle, Trash, Loader2 } from 'lucide-react'

interface DetalleOrdenModalProps {
  orden: any
  onClose: () => void
}

export function DetalleOrdenModal({ orden, onClose }: DetalleOrdenModalProps) {
  const queryClient = useQueryClient()
  const { data: mecanicos, isLoading: isLoadingMecanicos } = useMecanicosActivos()
  const actualizarDetalles = useActualizarOrdenDetalles()

  // Campos del formulario
  const [diagnostico, setDiagnostico] = useState(orden.diagnosis || '')
  const [costoManoObra, setCostoManoObra] = useState(String(orden.labor_cost || '0'))
  const [costoRepuestos, setCostoRepuestos] = useState(String(orden.parts_cost || '0'))
  const [fechaEntrega, setFechaEntrega] = useState(orden.fecha_entrega_estimada ? orden.fecha_entrega_estimada.split('T')[0] : '')
  const [notasInternas, setNotasInternas] = useState(orden.internal_notes || '')
  
  // Mecánicos seleccionados
  const [mecanicosSeleccionados, setMecanicosSeleccionados] = useState<string[]>([])

  // Nueva foto URL
  const [fotoUrl, setFotoUrl] = useState('')
  const [fotoTipo, setFotoTipo] = useState<'ingreso' | 'proceso' | 'entrega'>('ingreso')
  const [errorFoto, setErrorFoto] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Cargar mecánicos asignados actuales al abrir
  useEffect(() => {
    if (orden.order_mechanics) {
      const ids = orden.order_mechanics.map((om: any) => om.mechanic_id)
      setMecanicosSeleccionados(ids)
    }
  }, [orden])

  // Query para cargar las fotos de esta orden
  const { data: fotos, isLoading: isLoadingFotos } = useQuery({
    queryKey: ['fotos_orden', orden.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fotos_orden')
        .select('*')
        .eq('orden_id', orden.id)
      if (error) throw new Error(error.message)
      return data
    }
  })

  // Mutación para agregar foto
  const agregarFoto = useMutation({
    mutationFn: async ({ url, tipo }: { url: string, tipo: string }) => {
      const { data, error } = await supabase
        .from('fotos_orden')
        .insert({
          orden_id: orden.id,
          url,
          tipo
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos_orden', orden.id] })
      setFotoUrl('')
      setErrorFoto(null)
    }
  })

  // Mutación para eliminar foto
  const eliminarFoto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fotos_orden')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fotos_orden', orden.id] })
    }
  })

  const toggleMecanico = (id: string) => {
    if (mecanicosSeleccionados.includes(id)) {
      setMecanicosSeleccionados(mecanicosSeleccionados.filter(item => item !== id))
    } else {
      setMecanicosSeleccionados([...mecanicosSeleccionados, id])
    }
  }

  const handleAgregarFoto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fotoUrl.trim()) return
    setErrorFoto(null)
    try {
      await agregarFoto.mutateAsync({ url: fotoUrl, tipo: fotoTipo })
    } catch (err: any) {
      setErrorFoto(err.message || "Error al agregar foto")
    }
  }

  const handleGuardarDetalles = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await actualizarDetalles.mutateAsync({
        ordenId: orden.id,
        laborCost: parseFloat(costoManoObra) || 0,
        partsCost: parseFloat(costoRepuestos) || 0,
        diagnosis: diagnostico,
        estimatedDelivery: fechaEntrega ? new Date(fechaEntrega).toISOString() : undefined,
        internalNotes: notasInternas,
        mechanicIds: mecanicosSeleccionados
      })
      onClose()
    } catch (err) {
      alert("Error al guardar cambios: " + (err as Error).message)
    }
    setGuardando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Detalle y Diagnóstico — Orden #{orden.order_number || '—'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Vehículo: <strong className="text-gray-700 uppercase">{orden.vehiculos?.placa}</strong> ({orden.vehiculos?.marca} {orden.vehiculos?.modelo})
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda: Formulario de Diagnóstico y Costos */}
          <form onSubmit={handleGuardarDetalles} className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clipboard className="w-4 h-4" /> Datos de Trabajo
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Diagnóstico Técnico
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                placeholder="Describe el estado, piezas fallidas y reparaciones necesarias..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center gap-0.5">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Mano de Obra ($)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  value={costoManoObra}
                  onChange={(e) => setCostoManoObra(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center gap-0.5">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Repuestos / Piezas ($)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  value={costoRepuestos}
                  onChange={(e) => setCostoRepuestos(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" /> Entrega Estimada
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Notas Internas (Taller)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  value={notasInternas}
                  onChange={(e) => setNotasInternas(e.target.value)}
                  placeholder="Detalles no visibles al cliente..."
                />
              </div>
            </div>

            {/* Asignación de Mecánicos */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-2 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" /> Asignar Mecánicos
              </label>

              {isLoadingMecanicos ? (
                <div className="flex justify-center p-3"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
              ) : !mecanicos?.length ? (
                <p className="text-xs text-gray-500">No hay mecánicos activos registrados.</p>
              ) : (
                <div className="border border-gray-200 rounded-lg p-3 max-h-36 overflow-y-auto space-y-2 text-sm bg-gray-50/50">
                  {mecanicos.map((m) => (
                    <label key={m.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded text-blue-600 focus:ring-blue-500"
                        checked={mecanicosSeleccionados.includes(m.id)}
                        onChange={() => toggleMecanico(m.id)}
                      />
                      <span>{m.full_name} <span className="text-xs text-gray-400">({m.commission_percentage}%)</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Botón de Guardar */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                {guardando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Guardar Cambios de la Orden'
                )}
              </button>
            </div>
          </form>

          {/* Columna Derecha: Fotos de la Orden */}
          <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" /> Control de Fotos ({fotos?.length || 0})
              </h3>

              {/* Formulario para agregar Foto por URL */}
              <form onSubmit={handleAgregarFoto} className="flex gap-2 mb-4">
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="url"
                    required
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-xs"
                    value={fotoUrl}
                    onChange={(e) => setFotoUrl(e.target.value)}
                    placeholder="Enlace de la imagen (URL)..."
                  />
                  {errorFoto && <span className="text-[10px] text-red-500">{errorFoto}</span>}
                </div>
                <select
                  className="px-2.5 border border-gray-300 rounded-md text-xs bg-white outline-none"
                  value={fotoTipo}
                  onChange={(e) => setFotoTipo(e.target.value as any)}
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="proceso">Proceso</option>
                  <option value="entrega">Entrega</option>
                </select>
                <button
                  type="submit"
                  disabled={agregarFoto.isPending}
                  className="bg-gray-900 hover:bg-gray-800 text-white p-2 rounded-md hover:shadow-sm transition-colors"
                  aria-label="Agregar foto"
                  title="Agregar foto"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </form>

              {/* Lista de Fotos Cargadas */}
              {isLoadingFotos ? (
                <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : !fotos?.length ? (
                <div className="border-2 border-dashed border-gray-200 p-8 rounded-lg text-center text-gray-400 text-sm">
                  No hay fotos cargadas para esta orden.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1 border border-gray-50 rounded-lg">
                  {fotos.map((f) => (
                    <div key={f.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-video">
                      <img src={f.url} alt={`Foto de ${f.tipo}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => window.open(f.url, '_blank')}
                          className="bg-white/95 text-gray-800 text-[10px] px-2 py-0.5 rounded font-bold hover:bg-white"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarFoto.mutate(f.id)}
                          className="bg-red-600/95 text-white p-1 rounded hover:bg-red-600"
                          aria-label="Eliminar foto"
                          title="Eliminar foto"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 text-[9px] bg-gray-900/80 text-white px-1.5 py-0.5 rounded capitalize font-medium">
                        {f.tipo === 'ingreso' ? 'Ingreso' : f.tipo === 'proceso' ? 'Proceso' : 'Entrega'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumen del presupuesto */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mt-4">
              <div className="flex justify-between text-xs text-gray-500 font-semibold mb-1">
                <span>Mano de obra:</span>
                <span>${(parseFloat(costoManoObra) || 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-semibold mb-2">
                <span>Repuestos:</span>
                <span>${(parseFloat(costoRepuestos) || 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm font-black border-t border-gray-200 pt-2 text-gray-950">
                <span>Total Estimado:</span>
                <span>${((parseFloat(costoManoObra) || 0) + (parseFloat(costoRepuestos) || 0)).toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
