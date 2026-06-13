import { useState } from 'react'
import { Button } from '../ui/Button'
import { useCrearVehiculo } from '../../hooks/useVehiculos'

interface VehiculoFormProps {
  clienteId: string
  placaPrellenada?: string
  onSuccess: (vehiculoId: string) => void
}

export function VehiculoForm({ clienteId, placaPrellenada = '', onSuccess }: VehiculoFormProps) {
  const [placa, setPlaca] = useState(placaPrellenada)
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [anio, setAnio] = useState('')
  const [color, setColor] = useState('')
  
  const crearVehiculo = useCrearVehiculo()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const vehiculo = await crearVehiculo.mutateAsync({
        cliente_id: clienteId,
        placa,
        marca,
        modelo,
        anio: anio ? parseInt(anio) : undefined,
        color: color || undefined
      })
      onSuccess(vehiculo.id)
    } catch (error) {
      alert("Error al crear vehículo: " + (error as Error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium">Nuevo Vehículo</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="placa_input" className="block text-sm font-medium text-gray-700">Placa</label>
          <input
            id="placa_input"
            type="text"
            required
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500 uppercase"
          />
        </div>
        <div>
          <label htmlFor="marca" className="block text-sm font-medium text-gray-700">Marca</label>
          <input
            id="marca"
            type="text"
            required
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">Modelo</label>
          <input
            id="modelo"
            type="text"
            required
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="anio" className="block text-sm font-medium text-gray-700">Año (Opcional)</label>
          <input
            id="anio"
            type="number"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color (Opcional)</label>
          <input
            id="color"
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
      <Button type="submit" disabled={crearVehiculo.isPending}>
        {crearVehiculo.isPending ? 'Guardando...' : 'Guardar Vehículo'}
      </Button>
    </form>
  )
}
