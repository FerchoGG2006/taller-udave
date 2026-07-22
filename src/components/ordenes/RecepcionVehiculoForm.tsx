import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/Button'
import { Camera, X, Car, User, PlusCircle, AlertTriangle, Fuel, Gauge, CheckSquare, Loader2 } from 'lucide-react'
import { useVehiculoPorPlaca, useCrearVehiculo } from '../../hooks/useVehiculos'
import { useCrearCliente } from '../../hooks/useClientes'
import { useCrearOrden } from '../../hooks/useOrdenes'
import { supabase } from '../../lib/supabase'
import type { ChecklistIngreso } from '../../types'

interface RecepcionVehiculoFormProps {
  onSuccess: (ordenId: string, clienteNombre: string, clienteTelefono: string, vehiculoInfo: string) => void
}

const INVENTARIO_ITEMS = [
  { id: 'gata', label: 'Gata Hidráulica / Mecánica' },
  { id: 'llanta_repuesto', label: 'Llanta de Repuesto' },
  { id: 'radio', label: 'Radio / Pantalla' },
  { id: 'antena', label: 'Antena' },
  { id: 'extintor', label: 'Extintor de Incendios' },
  { id: 'botiquin', label: 'Botiquín de Primeros Auxilios' },
  { id: 'cables', label: 'Cables Pasa-Corriente' },
  { id: 'triangulos', label: 'Triángulos de Seguridad' },
  { id: 'espejos', label: 'Espejos Laterales Ok' },
  { id: 'documentos', label: 'Documentos del Vehículo' }
]

type NivelGasolina = 'reserva' | '25%' | '50%' | '75%' | '100%'
const nivelesGasolina: NivelGasolina[] = ['reserva', '25%', '50%', '75%', '100%']

export function RecepcionVehiculoForm({ onSuccess }: RecepcionVehiculoFormProps) {
  // --- Estados de Cliente ---
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cedula, setCedula] = useState('')

  // --- Estados de Vehículo ---
  const [placa, setPlaca] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [anio, setAnio] = useState('')
  const [color, setColor] = useState('')

  // --- Estados de Inspección ---
  const [kilometraje, setKilometraje] = useState('')
  const [nivelGasolina, setNivelGasolina] = useState<NivelGasolina>('50%')
  const [observaciones, setObservaciones] = useState('')
  const [elementos, setElementos] = useState<Record<string, boolean>>({
    gata: true, llanta_repuesto: true, radio: true, antena: true,
    extintor: true, botiquin: false, cables: false, triangulos: true,
    espejos: true, documentos: true
  })
  const [fotos, setFotos] = useState<File[]>([])
  
  // --- Estados de UI y Mutaciones ---
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: vehiculoExistente, isFetching: isSearchingPlaca } = useVehiculoPorPlaca(placa)
  const crearCliente = useCrearCliente()
  const crearVehiculo = useCrearVehiculo()
  const crearOrden = useCrearOrden()

  // Autocompletado si el vehículo existe
  useEffect(() => {
    if (vehiculoExistente) {
      setTimeout(() => {
        setNombre(vehiculoExistente.clientes?.nombre || '')
        setTelefono(vehiculoExistente.clientes?.telefono || '')
        setCedula(vehiculoExistente.clientes?.cedula || '')
        setMarca(vehiculoExistente.marca || '')
        setModelo(vehiculoExistente.modelo || '')
        setAnio(vehiculoExistente.anio?.toString() || '')
        setColor(vehiculoExistente.color || '')
      }, 0)
    }
  }, [vehiculoExistente])

  const toggleElemento = (id: string) => {
    setElementos(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      if (fotos.length + selectedFiles.length > 4) {
        alert("Máximo 4 fotos permitidas por orden.")
        return
      }
      setFotos(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFoto = (index: number) => {
    setFotos(fotos.filter((_, i) => i !== index))
  }

  const uploadFotos = async (vehiculoIdStr: string): Promise<string[]> => {
    const uploadedUrls: string[] = []
    if (fotos.length === 0) return uploadedUrls

    for (const foto of fotos) {
      const fileExt = foto.name.split('.').pop()
      const fileName = `${vehiculoIdStr}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error } = await supabase.storage.from('orden_fotos').upload(fileName, foto)
      if (error) throw new Error('Error al subir las fotos. Asegúrate de que el Storage Bucket está configurado.')
      
      const { data } = supabase.storage.from('orden_fotos').getPublicUrl(fileName)
      uploadedUrls.push(data.publicUrl)
    }
    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let vehiculoId = vehiculoExistente?.id
      const finalClienteNombre = nombre
      const finalClienteTelefono = telefono
      const finalVehiculoInfo = `${marca} ${modelo} (Placa: ${placa.toUpperCase()})`

      // 1. Crear Cliente y Vehículo si no existen
      if (!vehiculoId) {
        // @ts-expect-error Ignoring missing taller_id as it is handled by the backend/hooks
        const nuevoCliente = await crearCliente.mutateAsync({ nombre, telefono, cedula: cedula || undefined })
        // @ts-expect-error Ignoring missing taller_id as it is handled by the backend/hooks
        const nuevoVehiculo = await crearVehiculo.mutateAsync({
          cliente_id: nuevoCliente.id,
          placa: placa.toUpperCase(),
          marca,
          modelo,
          anio: anio ? parseInt(anio) : undefined,
          color
        })
        vehiculoId = nuevoVehiculo.id
      }

      // 2. Subir Fotos
      const fotosUrls = await uploadFotos(vehiculoId)

      // 3. Crear Orden
      const checklistIngreso: ChecklistIngreso = {
        kilometraje: kilometraje ? parseInt(kilometraje, 10) : undefined,
        nivel_gasolina: nivelGasolina,
        elementos,
        notas_danos: observaciones,
        fotos: fotosUrls
      }

      // No pasamos items para que la cotización se haga después
      const resultado = await crearOrden.mutateAsync({
        orden: {
          vehiculo_id: vehiculoId,
          observaciones, // Falla reportada
          checklist_ingreso: checklistIngreso,
          fecha_ingreso: new Date().toISOString()
        },
        items: [] 
      })

      // 4. Reportar Éxito
      onSuccess(resultado.id, finalClienteNombre, finalClienteTelefono, finalVehiculoInfo)

    } catch (error) {
      alert("Error al registrar el ingreso: " + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Datos del Vehículo */}
      <div className="neumorphic-outset p-6 md:p-8 rounded-[2rem] border-none">
        <h3 className="flex items-center gap-2 text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200/40 dark:border-slate-800/40 pb-3 mb-6">
          <Car className="w-5 h-5 text-indigo-500" /> Datos del Vehículo
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Placa *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 font-black tracking-widest text-lg p-3 outline-none uppercase"
                placeholder="ABC123"
              />
              {isSearchingPlaca && (
                <Loader2 className="absolute right-3 top-3.5 w-5 h-5 animate-spin text-indigo-500" />
              )}
            </div>
            {vehiculoExistente && <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">Vehículo Registrado</p>}
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Marca *</label>
              <input type="text" required value={marca} onChange={(e) => setMarca(e.target.value)} disabled={!!vehiculoExistente} className="w-full rounded-xl neumorphic-inset p-3 outline-none text-sm font-bold text-slate-700 disabled:opacity-60" placeholder="Ej: Toyota" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Modelo *</label>
              <input type="text" required value={modelo} onChange={(e) => setModelo(e.target.value)} disabled={!!vehiculoExistente} className="w-full rounded-xl neumorphic-inset p-3 outline-none text-sm font-bold text-slate-700 disabled:opacity-60" placeholder="Ej: Corolla" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Año</label>
            <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} disabled={!!vehiculoExistente} className="w-full rounded-xl neumorphic-inset p-3 outline-none text-sm font-bold text-slate-700 disabled:opacity-60" placeholder="Ej: 2018" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Color</label>
            <input type="text" value={color} onChange={(e) => setColor(e.target.value)} disabled={!!vehiculoExistente} className="w-full rounded-xl neumorphic-inset p-3 outline-none text-sm font-bold text-slate-700 disabled:opacity-60" placeholder="Ej: Rojo" />
          </div>
        </div>
      </div>

      {/* 2. Datos del Cliente */}
      <div className="neumorphic-outset p-6 md:p-8 rounded-[2rem] border-none">
        <h3 className="flex items-center gap-2 text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200/40 dark:border-slate-800/40 pb-3 mb-6">
          <User className="w-5 h-5 text-emerald-500" /> Datos del Cliente
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre Completo *</label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={!!vehiculoExistente} className="w-full rounded-xl neumorphic-inset p-3 outline-none text-sm font-bold text-slate-700 disabled:opacity-60" placeholder="Ej: Pedro Perez" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Teléfono (WhatsApp) *</label>
            <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} disabled={!!vehiculoExistente} className="w-full rounded-xl neumorphic-inset p-3 outline-none text-sm font-bold text-slate-700 disabled:opacity-60" placeholder="+57 300 0000000" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cédula o NIT (Opcional)</label>
            <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} disabled={!!vehiculoExistente} className="w-full rounded-xl neumorphic-inset p-3 outline-none text-sm font-bold text-slate-700 disabled:opacity-60" placeholder="123456789" />
          </div>
        </div>
      </div>

      {/* 3. Inspección de Ingreso */}
      <div className="neumorphic-outset p-6 md:p-8 rounded-[2rem] border-none">
        <h3 className="flex items-center gap-2 text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200/40 dark:border-slate-800/40 pb-3 mb-6">
          <CheckSquare className="w-5 h-5 text-amber-500" /> Inspección y Registro de Ingreso
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              <Gauge className="w-4 h-4 text-indigo-400" /> Kilometraje Actual
            </label>
            <input type="number" required value={kilometraje} onChange={(e) => setKilometraje(e.target.value)} className="w-full rounded-xl neumorphic-inset p-3 outline-none text-sm font-bold text-slate-700" placeholder="Ej: 85000" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              <Fuel className="w-4 h-4 text-amber-400" /> Nivel de Combustible
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-2xl neumorphic-inset">
              {nivelesGasolina.map((nivel) => (
                <button
                  key={nivel} type="button" onClick={() => setNivelGasolina(nivel)}
                  className={`py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${
                    nivelGasolina === nivel ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'
                  }`}
                >
                  {nivel === 'reserva' ? 'Res.' : nivel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Evidencia Fotográfica */}
        <div className="mb-8">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            <Camera className="w-4 h-4 text-purple-500" /> Evidencia Fotográfica (Max 4 fotos)
          </label>
          <div className="flex gap-4 items-start flex-wrap">
            {fotos.map((foto, index) => (
              <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-300">
                <img src={URL.createObjectURL(foto)} alt={`Foto ${index}`} className="object-cover w-full h-full" />
                <button type="button" onClick={() => removeFoto(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {fotos.length < 4 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-xl neumorphic-inset flex flex-col items-center justify-center text-slate-400 hover:text-purple-500 transition-colors">
                <PlusCircle className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold uppercase text-center leading-tight">Tomar /<br/>Subir Foto</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" multiple onChange={handleFileChange} />
          </div>
        </div>

        {/* Inventario Rápido */}
        <div className="mb-8">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">
            Checklist Rápido de Inventario
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {INVENTARIO_ITEMS.map((item) => {
              const checked = elementos[item.id] || false
              return (
                <button
                  key={item.id} type="button" onClick={() => toggleElemento(item.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-[10px] sm:text-xs font-bold text-left transition-all ${
                    checked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                    {checked && <CheckSquare className="w-3 h-3" />}
                  </div>
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Motivo de Ingreso / Daños */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Motivo de Ingreso / Daños Pre-existentes
          </label>
          <textarea
            required
            rows={4}
            className="w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-4 outline-none font-medium"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Describe por qué ingresa el vehículo y anota cualquier rayón, golpe o daño que ya tenga..."
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center gap-3"
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSubmitting ? 'Registrando...' : 'Registrar Ingreso'}
        </Button>
      </div>
    </form>
  )
}
