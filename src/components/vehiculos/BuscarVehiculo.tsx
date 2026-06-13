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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 outline-none uppercase"
          placeholder="INGRESE PLACA (Ej: ABC123)"
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={placa.length < 5}>Buscar</Button>
    </form>
  )
}
