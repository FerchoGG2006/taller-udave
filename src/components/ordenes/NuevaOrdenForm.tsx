import { useState } from 'react'
import { Button } from '../ui/Button'
import { PlusCircle, Trash2, Gauge, Fuel, CheckSquare, ClipboardCheck, AlertTriangle } from 'lucide-react'
import { useCrearOrden } from '../../hooks/useOrdenes'
import { useNavigate } from 'react-router-dom'
import type { ChecklistIngreso } from '../../types'

interface NuevaOrdenFormProps {
  vehiculoId: string
}

interface Item {
  descripcion: string
  precio: string
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

export function NuevaOrdenForm({ vehiculoId }: NuevaOrdenFormProps) {
  const [observaciones, setObservaciones] = useState('')
  const [kilometraje, setKilometraje] = useState<string>('')
  const [nivelGasolina, setNivelGasolina] = useState<NivelGasolina>('50%')
  const [elementos, setElementos] = useState<Record<string, boolean>>({
    gata: true,
    llanta_repuesto: true,
    radio: true,
    antena: true,
    extintor: true,
    botiquin: false,
    cables: false,
    triangulos: true,
    espejos: true,
    documentos: true
  })
  
  const [items, setItems] = useState<Item[]>([{ descripcion: '', precio: '' }])
  const crearOrden = useCrearOrden()
  const navigate = useNavigate()

  const toggleElemento = (id: string) => {
    setElementos(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const addItem = () => setItems([...items, { descripcion: '', precio: '' }])
  
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof Item, value: string) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filtrar items vacíos y convertir precios
    const itemsLimpios = items
      .filter(item => item.descripcion.trim() !== '')
      .map(item => ({
        descripcion: item.descripcion,
        precio: parseFloat(item.precio) || 0
      }))

    const checklistIngreso: ChecklistIngreso = {
      kilometraje: kilometraje ? parseInt(kilometraje, 10) : undefined,
      nivel_gasolina: nivelGasolina,
      elementos,
      notas_danos: observaciones
    }

    try {
      await crearOrden.mutateAsync({
        orden: {
          vehiculo_id: vehiculoId,
          observaciones,
          checklist_ingreso: checklistIngreso,
          fecha_ingreso: new Date().toISOString()
        },
        items: itemsLimpios
      })
      
      // Redirigir al listado
      navigate('/ordenes')
    } catch (error) {
      alert("Error al crear la orden: " + (error as Error).message)
    }
  }

  const nivelesGasolina: NivelGasolina[] = ['reserva', '25%', '50%', '75%', '100%']

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Sección 1: Inspección e Inventario de Ingreso */}
      <div>
        <div className="flex items-center gap-2 border-b border-slate-200/40 dark:border-slate-800/40 pb-3 mb-6">
          <ClipboardCheck className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
            2. Inspección e Inventario de Recepción
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Kilometraje */}
          <div>
            <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              <Gauge className="w-4 h-4 text-indigo-400" />
              Kilometraje Actual (km)
            </label>
            <input
              type="number"
              placeholder="Ej: 85400"
              className="w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all font-semibold"
              value={kilometraje}
              onChange={(e) => setKilometraje(e.target.value)}
            />
          </div>

          {/* Nivel de Combustible */}
          <div>
            <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              <Fuel className="w-4 h-4 text-amber-400" />
              Nivel de Combustible
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-2xl neumorphic-inset">
              {nivelesGasolina.map((nivel) => {
                const isSelected = nivelGasolina === nivel
                return (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => setNivelGasolina(nivel)}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {nivel === 'reserva' ? 'Res.' : nivel}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Inventario de Accesorios / Objetos */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            Checklist de Accesorios y Pertenencias
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INVENTARIO_ITEMS.map((item) => {
              const checked = elementos[item.id] || false
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleElemento(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl text-xs font-semibold text-left transition-all border ${
                    checked
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100/50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-500'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                    checked 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'border-slate-400 dark:border-slate-600'
                  }`}>
                    {checked && <CheckSquare className="w-3.5 h-3.5" />}
                  </div>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Observaciones y Daños de Carrocería */}
        <div>
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Observaciones de Carrocería o Daños Previos
          </label>
          <textarea
            rows={3}
            className="w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Rayón superficial en puerta delantera derecha, abolladura leve en parachoques trasero..."
          />
        </div>
      </div>

      {/* Sección 2: Servicios Estimados */}
      <div>
        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest border-b border-slate-200/40 dark:border-slate-800/40 pb-3 mb-4">
          3. Servicios o Trabajos Solicitados
        </h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Descripción del servicio (Ej: Mantenimiento de frenos)"
                className="flex-1 rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
                value={item.descripcion}
                onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                required={index === 0}
              />
              <div className="relative w-36">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-450 dark:text-slate-500 font-extrabold text-sm">$</span>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 pl-8 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all font-bold"
                  value={item.precio}
                  onChange={(e) => updateItem(index, 'precio', e.target.value)}
                />
              </div>
              <button 
                type="button" 
                onClick={() => removeItem(index)}
                className="p-3 neumorphic-btn rounded-xl text-red-500 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center border-none"
                disabled={items.length === 1}
                aria-label="Eliminar servicio"
                title="Eliminar servicio"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        <Button 
          type="button" 
          variant="neumorphic" 
          onClick={addItem}
          className="mt-4 text-xs px-4 py-2.5 rounded-xl"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Añadir otro servicio
        </Button>
      </div>

      <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
        <Button type="submit" variant="neumorphic" disabled={crearOrden.isPending} className="w-full sm:w-auto px-6 py-3 rounded-xl">
          {crearOrden.isPending ? 'Creando Orden...' : 'Crear Orden e Ingresar Vehículo'}
        </Button>
      </div>
    </form>
  )
}
