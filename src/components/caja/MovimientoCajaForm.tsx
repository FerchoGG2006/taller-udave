import { useState } from 'react'
import { Button } from '../ui/Button'
import { useCrearMovimiento } from '../../hooks/useCaja'
import type { TipoMovimientoCaja, MetodoPagoCaja } from '../../types'
import { X } from 'lucide-react'

interface MovimientoCajaFormProps {
  onClose: () => void
}

export function MovimientoCajaForm({ onClose }: MovimientoCajaFormProps) {
  const [tipo, setTipo] = useState<TipoMovimientoCaja>('ingreso')
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPagoCaja>('efectivo')
  const [concepto, setConcepto] = useState('')
  
  const crearMovimiento = useCrearMovimiento()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await crearMovimiento.mutateAsync({
        tipo,
        monto: parseFloat(monto),
        metodo_pago: metodoPago,
        concepto,
        fecha_movimiento: new Date().toISOString(), // Use current timestamp for precision
      })
      onClose()
    } catch (error) {
      alert("Error al registrar movimiento: " + (error as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-100 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 neumorphic-outset">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Nuevo Movimiento</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tipo de Movimiento</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTipo('ingreso')}
                className={`py-3 rounded-xl font-bold transition-all ${tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-600 border border-emerald-300 shadow-sm' : 'bg-transparent border border-slate-300 text-slate-500 hover:bg-slate-200'}`}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setTipo('egreso')}
                className={`py-3 rounded-xl font-bold transition-all ${tipo === 'egreso' ? 'bg-rose-100 text-rose-600 border border-rose-300 shadow-sm' : 'bg-transparent border border-slate-300 text-slate-500 hover:bg-slate-200'}`}
              >
                Egreso
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="monto" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
              <input
                id="monto"
                type="number"
                required
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="block w-full rounded-xl neumorphic-inset text-slate-800 text-lg font-bold p-3 pl-8 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="metodoPago" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Método de Pago</label>
            <select
              id="metodoPago"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as MetodoPagoCaja)}
              className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all cursor-pointer font-medium"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label htmlFor="concepto" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Concepto / Descripción</label>
            <textarea
              id="concepto"
              required
              rows={2}
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all resize-none"
              placeholder="Ej: Cobro de Orden #102..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crearMovimiento.isPending}>
              {crearMovimiento.isPending ? 'Registrando...' : 'Registrar Movimiento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
