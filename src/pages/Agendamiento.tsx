import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Calendar as CalendarIcon, Clock, User, Car, Plus, X, Loader2, AlertCircle, CheckCircle, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'

interface CitaType {
  id: string
  fecha_cita: string
  estado: string
  motivo: string
  notas?: string
  vehiculos?: { placa: string; marca: string }
  clientes?: { nombre: string }
}

interface ClienteType {
  id: string
  nombre: string
}

interface VehiculoType {
  id: string
  placa: string
  cliente_id: string
}

export default function Agendamiento() {
  const [citas, setCitas] = useState<CitaType[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [clientes, setClientes] = useState<ClienteType[]>([])
  const [vehiculos, setVehiculos] = useState<VehiculoType[]>([])
  
  const [form, setForm] = useState({
    cliente_id: '',
    vehiculo_id: '',
    fecha_cita: '',
    hora_cita: '',
    motivo: '',
    notas: ''
  })

  const fetchData = async () => {
    try {
      const [resCitas, resClientes, resVehiculos] = await Promise.all([
        supabase.from('citas').select('*, vehiculos(placa, marca), clientes(nombre)').order('fecha_cita', { ascending: true }),
        supabase.from('clientes').select('id, nombre').order('nombre'),
        supabase.from('vehiculos').select('id, placa, cliente_id').order('placa')
      ])
      if (resCitas.data) setCitas(resCitas.data as unknown as CitaType[])
      if (resClientes.data) setClientes(resClientes.data as ClienteType[])
      if (resVehiculos.data) setVehiculos(resVehiculos.data as VehiculoType[])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line
    fetchData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Combinar fecha y hora
      const fechaDateTime = new Date(`${form.fecha_cita}T${form.hora_cita}`)
      const { error } = await supabase.from('citas').insert({
        cliente_id: form.cliente_id,
        vehiculo_id: form.vehiculo_id,
        fecha_cita: fechaDateTime.toISOString(),
        motivo: form.motivo,
        notas: form.notas,
        estado: 'programada'
      })
      if (error) throw error
      setModalOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Error guardando cita')
    } finally {
      setSaving(false)
    }
  }

  const actualizarEstadoCita = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase.from('citas').update({ estado: nuevoEstado }).eq('id', id)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Error actualizando la cita')
    }
  }

  const eliminarCita = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cita?')) return
    try {
      const { error } = await supabase.from('citas').delete().eq('id', id)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Error eliminando la cita')
    }
  }

  const vehiculosFiltrados = vehiculos.filter(v => v.cliente_id === form.cliente_id)

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
      {/* Cabecera Neumórfica */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-1 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-indigo-500" /> Agendamiento
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Gestión de citas y mantenimiento preventivo
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          variant="neumorphic"
          className="flex items-center gap-2 px-5 py-3 rounded-2xl"
        >
          <Plus className="w-5 h-5 text-indigo-500" /> Agendar Cita
        </Button>
      </div>

      {/* Lista de Citas (Vista rápida Neumórfica) */}
      <div className="neumorphic-outset p-6 rounded-[2rem] border-none">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Próximas Citas
        </h2>
        
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : citas.length === 0 ? (
          <div className="text-center py-12 text-slate-500 flex flex-col items-center">
            <AlertCircle className="w-12 h-12 mb-3 text-slate-400" />
            <p className="font-medium">No hay citas programadas actualmente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {citas.map(cita => {
              const fechaObj = new Date(cita.fecha_cita)
              return (
                <div key={cita.id} className="neumorphic-outset p-5 rounded-2xl flex flex-col gap-3 transition-transform hover:scale-[1.02]">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold px-3 py-1 rounded-full neumorphic-inset text-indigo-500 uppercase tracking-wider">
                      {fechaObj.toLocaleDateString()}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-900/5 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                      {fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" /> {cita.clientes?.nombre || 'Cliente Anónimo'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 mt-1">
                      <Car className="w-4 h-4 text-slate-400" /> {cita.vehiculos?.marca} - <span className="font-mono text-indigo-500">{cita.vehiculos?.placa}</span>
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 p-3 neumorphic-inset rounded-xl mb-3">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Motivo:</p>
                    <p className="italic text-xs">{cita.motivo}</p>
                  </div>
                  {/* Botones de Acción */}
                  <div className="flex gap-2 mt-auto border-t border-slate-200/40 dark:border-slate-700/40 pt-4">
                    {cita.estado !== 'completada' && (
                      <button 
                        onClick={() => actualizarEstadoCita(cita.id, 'completada')}
                        title="Marcar como completada"
                        className="flex-1 flex items-center justify-center gap-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl transition-colors shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Completar
                      </button>
                    )}
                    <button 
                      onClick={() => eliminarCita(cita.id)}
                      title="Eliminar cita"
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-red-500 hover:text-white hover:bg-red-500 py-2 rounded-xl transition-colors border border-red-500/20 hover:border-red-500 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Agendamiento */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 neumorphic-outset">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Nueva Cita</h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Programa una visita al taller</p>
              </div>
              <button onClick={() => setModalOpen(false)} title="Cerrar modal" aria-label="Cerrar modal" className="text-slate-400 hover:text-red-500 transition-colors p-2 neumorphic-inset rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cliente</label>
                <select
                  required
                  title="Seleccionar cliente"
                  className="w-full rounded-xl neumorphic-inset bg-transparent text-slate-800 dark:text-slate-100 p-3.5 outline-none border-none text-sm font-medium"
                  value={form.cliente_id}
                  onChange={(e) => setForm({...form, cliente_id: e.target.value, vehiculo_id: ''})}
                >
                  <option value="">Seleccione un cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id} className="bg-slate-800">{c.nombre}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vehículo</label>
                <select
                  required
                  disabled={!form.cliente_id}
                  title="Seleccionar vehículo"
                  className="w-full rounded-xl neumorphic-inset bg-transparent text-slate-800 dark:text-slate-100 p-3.5 outline-none border-none text-sm font-medium disabled:opacity-50"
                  value={form.vehiculo_id}
                  onChange={(e) => setForm({...form, vehiculo_id: e.target.value})}
                >
                  <option value="">Seleccione un vehículo...</option>
                  {vehiculosFiltrados.map(v => <option key={v.id} value={v.id} className="bg-slate-800">{v.placa}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha</label>
                  <input
                    type="date"
                    required
                    title="Fecha de la cita"
                    placeholder="Seleccionar fecha"
                    className="w-full rounded-xl neumorphic-inset bg-transparent text-slate-800 dark:text-slate-100 p-3.5 outline-none border-none text-sm font-medium"
                    value={form.fecha_cita}
                    onChange={(e) => setForm({...form, fecha_cita: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hora</label>
                  <input
                    type="time"
                    required
                    title="Hora de la cita"
                    placeholder="Seleccionar hora"
                    className="w-full rounded-xl neumorphic-inset bg-transparent text-slate-800 dark:text-slate-100 p-3.5 outline-none border-none text-sm font-medium"
                    value={form.hora_cita}
                    onChange={(e) => setForm({...form, hora_cita: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motivo de la Cita</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Revisión de frenos"
                  className="w-full rounded-xl neumorphic-inset bg-transparent text-slate-800 dark:text-slate-100 p-3.5 outline-none border-none text-sm font-medium"
                  value={form.motivo}
                  onChange={(e) => setForm({...form, motivo: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="button" variant="neumorphic" className="flex-1" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="neumorphic" className="flex-1 text-indigo-500" disabled={saving}>
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar Cita'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
