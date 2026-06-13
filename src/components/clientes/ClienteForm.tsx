import { useState } from 'react'
import { Button } from '../ui/Button'
import { useCrearCliente } from '../../hooks/useClientes'

interface ClienteFormProps {
  onSuccess: (clienteId: string) => void
}

export function ClienteForm({ onSuccess }: ClienteFormProps) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cedula, setCedula] = useState('')
  const crearCliente = useCrearCliente()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const cliente = await crearCliente.mutateAsync({
        nombre,
        telefono,
        cedula: cedula || undefined
      })
      onSuccess(cliente.id)
    } catch (error) {
      alert("Error al crear cliente: " + (error as Error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium">Nuevo Cliente</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
          <input
            id="nombre"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono (WhatsApp)</label>
          <input
            id="telefono"
            type="text"
            required
            placeholder="573001234567"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="cedula" className="block text-sm font-medium text-gray-700">Cédula (Opcional)</label>
          <input
            id="cedula"
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
      <Button type="submit" disabled={crearCliente.isPending}>
        {crearCliente.isPending ? 'Guardando...' : 'Guardar Cliente'}
      </Button>
    </form>
  )
}
