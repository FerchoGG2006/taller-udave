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
        <h3 className="text-lg font-medium mb-2">Servicios Estimados</h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Descripción del servicio (Ej: Cambio de aceite)"
                className="flex-1 rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500"
                value={item.descripcion}
                onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                required={index === 0} // Al menos 1 requerido
              />
              <div className="relative w-32">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">$</span>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full rounded-md border-gray-300 shadow-sm border p-2 pl-6 focus:border-blue-500 focus:ring-blue-500"
                  value={item.precio}
                  onChange={(e) => updateItem(index, 'precio', e.target.value)}
                />
              </div>
              <button 
                type="button" 
                onClick={() => removeItem(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-md"
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
          variant="secondary" 
          onClick={addItem}
          className="mt-3 text-sm"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Añadir otro servicio
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones al ingreso (Rayones, golpes, pertenencias)
        </label>
        <textarea
          rows={3}
          className="w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="El vehículo ingresa con golpe en puerta derecha..."
        />
      </div>

      <div className="pt-4 border-t border-gray-200">
        <Button type="submit" disabled={crearOrden.isPending} className="w-full sm:w-auto">
          {crearOrden.isPending ? 'Creando Orden...' : 'Crear Orden e Ingresar Vehículo'}
        </Button>
      </div>
    </form>
  )
}
