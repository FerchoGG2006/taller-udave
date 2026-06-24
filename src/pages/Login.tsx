import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Wrench } from 'lucide-react'

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
    <div className="flex h-screen items-center justify-center bg-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md p-10 glass-dark rounded-3xl z-10 relative border border-gray-700/50">
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl mb-5 shadow-inner border border-blue-500/30">
            <Wrench className="w-10 h-10 text-blue-400 drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Taller Udave</h1>
          <p className="text-gray-400 mt-2 text-sm">Ingresa al sistema de gestión premium</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              className="w-full px-5 py-3 bg-black/40 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-600 transition-all shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tallerudave.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full px-5 py-3 bg-black/40 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-600 transition-all shadow-inner"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full mt-4 py-3.5 text-base rounded-xl shadow-lg shadow-blue-900/30 border border-white/10" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </div>
    </div>
  )
}
