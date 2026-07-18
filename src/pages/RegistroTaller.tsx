import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, User, Mail, Lock, Loader2, Wrench } from 'lucide-react'

export default function RegistroTaller() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    nombreTaller: '',
    nombrePropietario: '',
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (form.password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres")
      }

      // 1. Crear el usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("No se pudo crear el usuario")

      // 2. Crear el Taller
      // Esto usará nuestra política "Permitir crear taller" FOR INSERT WITH CHECK (true)
      const { data: tallerData, error: tallerError } = await supabase
        .from('talleres')
        .insert({ nombre_negocio: form.nombreTaller })
        .select()
        .single()

      if (tallerError) throw tallerError

      // 3. Crear el perfil del Owner asociado al nuevo taller
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: form.nombrePropietario,
          role: 'owner',
          taller_id: tallerData.id,
          is_active: true
        })

      if (profileError) throw profileError

      // Éxito. Redirigir al inicio para login
      navigate('/')
      
    } catch (err: any) {
      setError(err.message || 'Error al registrar el taller')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-4">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Taller Udave
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Digitaliza y administra tu taller automotriz</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-xl border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-wider">Crea tu Cuenta de Taller</h2>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold border border-red-100 dark:border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre del Negocio</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-slate-100 font-medium"
                  placeholder="Ej: Talleres Martínez"
                  value={form.nombreTaller}
                  onChange={(e) => setForm({ ...form, nombreTaller: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre del Dueño</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-slate-100 font-medium"
                  placeholder="Tu nombre completo"
                  value={form.nombrePropietario}
                  onChange={(e) => setForm({ ...form, nombrePropietario: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Correo de Acceso</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-slate-100 font-medium"
                  placeholder="correo@taller.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Contraseña Segura</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-slate-100 font-medium"
                  placeholder="Min. 6 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrar mi Taller'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm font-medium text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/" className="text-indigo-600 font-bold hover:underline">Inicia sesión aquí</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
