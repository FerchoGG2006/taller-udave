import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md p-10 bg-slate-900 shadow-[10px_10px_20px_rgba(0,0,0,0.55),-10px_-10px_20px_rgba(255,255,255,0.02)] rounded-[2.5rem] z-10 relative border-none">
        <div className="flex flex-col items-center mb-10">
          <div className="p-5 bg-slate-950/40 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.5)] rounded-2xl mb-5 border-none">
            <Wrench className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Taller Udave</h1>
          <p className="text-slate-500 font-semibold uppercase tracking-widest text-[10px] mt-2">Sistema de Gestión Digital</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl font-bold uppercase tracking-wider">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              className="mt-2 block w-full rounded-xl bg-slate-950 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.5)] text-slate-100 text-sm p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/20 border-none transition-all placeholder-slate-700 font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tallerudave.com"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="mt-2 block w-full rounded-xl bg-slate-950 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.5)] text-slate-100 text-sm p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/20 border-none transition-all placeholder-slate-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
 
          <Button 
            type="submit" 
            variant="neumorphic" 
            className="w-full mt-6 py-3.5 text-sm font-extrabold uppercase tracking-widest text-indigo-400"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
          
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-xs font-semibold mb-2">¿Aún no usas el sistema en tu negocio?</p>
            <Link 
              to="/registro-taller" 
              className="text-indigo-400 hover:text-indigo-300 text-sm font-bold transition-colors"
            >
              Registra tu Taller Gratis
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
