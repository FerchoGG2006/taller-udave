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
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200/40 dark:border-slate-800/40 pb-3">Nuevo Cliente</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre Completo</label>
          <input
            id="nombre"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
            placeholder="Ej: Pedro Navaja"
          />
        </div>
        <div>
          <label htmlFor="telefono" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teléfono (WhatsApp)</label>
          <input
            id="telefono"
            type="text"
            required
            placeholder="573001234567"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="cedula" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cédula (Opcional)</label>
          <input
            id="cedula"
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
            placeholder="Ej: 12345678"
          />
        </div>
      </div>
      <Button type="submit" variant="neumorphic" disabled={crearCliente.isPending} className="px-6 rounded-xl">
        {crearCliente.isPending ? 'Guardando...' : 'Guardar Cliente'}
      </Button>
    </form>
  )
}
