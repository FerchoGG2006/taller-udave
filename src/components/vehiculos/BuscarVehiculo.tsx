import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '../ui/Button'

interface BuscarVehiculoProps {
  onBuscar: (placa: string) => void
}

export function BuscarVehiculo({ onBuscar }: BuscarVehiculoProps) {
  const [placa, setPlaca] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (placa.trim().length >= 5) {
      onBuscar(placa.trim().toUpperCase())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        </div>
        <input
          type="text"
          className="w-full pl-11 pr-4 py-3 neumorphic-inset text-slate-800 dark:text-slate-100 text-sm rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 uppercase tracking-widest font-extrabold text-center border-none transition-all"
          placeholder="INGRESE PLACA (Ej: ABC123)"
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
          required
          title="Placa del Vehículo"
        />
      </div>
      <Button type="submit" variant="neumorphic" disabled={placa.length < 5} className="px-6 rounded-2xl">
        Buscar
      </Button>
    </form>
  )
}
