import { useState } from 'react'
import { Button } from '../ui/Button'
import { PlusCircle, Trash2 } from 'lucide-react'
import { useCrearOrden } from '../../hooks/useOrdenes'
import { useNavigate } from 'react-router-dom'

interface NuevaOrdenFormProps {
  vehiculoId: string
}

interface Item {
  descripcion: string
  precio: string
}

export function NuevaOrdenForm({ vehiculoId }: NuevaOrdenFormProps) {
  const [observaciones, setObservaciones] = useState('')
  const [items, setItems] = useState<Item[]>([{ descripcion: '', precio: '' }])
  const crearOrden = useCrearOrden()
  const navigate = useNavigate()

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

    try {
      await crearOrden.mutateAsync({
        orden: {
          vehiculo_id: vehiculoId,
          observaciones,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200/40 dark:border-slate-800/40 pb-3 mb-4">Servicios Estimados</h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Descripción del servicio (Ej: Cambio de aceite)"
                className="flex-1 rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
                value={item.descripcion}
                onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                required={index === 0} // Al menos 1 requerido
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

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Observaciones al ingreso (Rayones, golpes, pertenencias)
        </label>
        <textarea
          rows={3}
          className="w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="El vehículo ingresa con golpe en puerta derecha..."
        />
      </div>

      <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
        <Button type="submit" variant="neumorphic" disabled={crearOrden.isPending} className="w-full sm:w-auto px-6 py-3 rounded-xl">
          {crearOrden.isPending ? 'Creando Orden...' : 'Crear Orden e Ingresar Vehículo'}
        </Button>
      </div>
    </form>
  )
}
