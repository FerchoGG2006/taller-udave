import { Wallet, Construction } from 'lucide-react'

export default function Caja() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center">
            <Wallet className="w-8 h-8 mr-3 text-purple-500" />
            Caja y POS
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Módulo de cobros, facturación y recibos
          </p>
        </div>
      </div>

      <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
        <Construction className="w-16 h-16 text-purple-400 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">Módulo en Construcción</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Estamos preparando el Punto de Venta para que puedas generar recibos PDF y llevar el control de caja diario.
        </p>
      </div>
    </div>
  )
}
