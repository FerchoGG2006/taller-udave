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
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200/40 dark:border-slate-800/40 pb-3">Nuevo Vehículo</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="placa_input" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Placa</label>
          <input
            id="placa_input"
            type="text"
            required
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all uppercase"
          />
        </div>
        <div>
          <label htmlFor="marca" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Marca</label>
          <input
            id="marca"
            type="text"
            required
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
            placeholder="Ej: Chevrolet"
          />
        </div>
        <div>
          <label htmlFor="modelo" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Modelo</label>
          <input
            id="modelo"
            type="text"
            required
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
            placeholder="Ej: Onix"
          />
        </div>
        <div>
          <label htmlFor="anio" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Año (Opcional)</label>
          <input
            id="anio"
            type="number"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
            placeholder="Ej: 2022"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="color" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Color (Opcional)</label>
          <input
            id="color"
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
            placeholder="Ej: Gris Plata"
          />
        </div>
      </div>
      <Button type="submit" variant="neumorphic" disabled={crearVehiculo.isPending} className="px-6 rounded-xl">
        {crearVehiculo.isPending ? 'Guardando...' : 'Guardar Vehículo'}
      </Button>
    </form>
  )
}
