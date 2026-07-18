import { useState } from 'react'
import { useProfiles, useCrearPerfil, useActualizarPerfil, useActiveProfile } from '../hooks/useProfiles'
import { Navigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PlusCircle, Edit2, CheckCircle2, XCircle, Shield, Phone, Percent, Loader2 } from 'lucide-react'
import type { Profile } from '../types'

export default function Personal() {
  const { data: activeUser } = useActiveProfile()
  const { data: profiles, isLoading: isLoadingProfiles, isError, error } = useProfiles()
  const crearPerfil = useCrearPerfil()
  const actualizarPerfil = useActualizarPerfil()

  // State para modales/formularios
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Profile | null>(null)
  
  // Campos del formulario
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<'receptionist' | 'mechanic'>('mechanic')
  const [comision, setComision] = useState('30')
  const [activo, setActivo] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  // Si no es el dueño, no permitir acceso
  if (activeUser && activeUser.role !== 'owner') {
    return <Navigate to="/" replace />
  }

  const abrirCrear = () => {
    setEditando(null)
    setNombre('')
    setTelefono('')
    setEmail('')
    setPassword('')
    setRol('mechanic')
    setComision('30')
    setActivo(true)
    setFormError(null)
    setModalAbierto(true)
  }

  const abrirEditar = (perfil: Profile) => {
    setEditando(perfil)
    setNombre(perfil.full_name)
    setTelefono(perfil.phone || '')
    setRol(perfil.role as 'receptionist' | 'mechanic')
    setComision(String(perfil.commission_percentage || 0))
    setActivo(perfil.is_active)
    setFormError(null)
    setModalAbierto(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!nombre.trim()) {
      setFormError("El nombre es requerido")
      return
    }

    try {
      if (editando) {
        await actualizarPerfil.mutateAsync({
          id: editando.id,
          full_name: nombre,
          phone: telefono,
          role: rol,
          commission_percentage: parseFloat(comision) || 0,
          is_active: activo
        })
      } else {
        if (!email.trim() || !password.trim()) {
          setFormError("Email y contraseña son requeridos para cuentas nuevas")
          return
        }
        if (password.length < 6) {
          setFormError("La contraseña debe tener al menos 6 caracteres")
          return
        }
        await crearPerfil.mutateAsync({
          email,
          password,
          full_name: nombre,
          role: rol,
          commission_percentage: parseFloat(comision) || 0,
          phone: telefono
        })
      }
      setModalAbierto(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Personal del Taller</h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Gestiona los accesos de recepcionistas y mecánicos del taller</p>
        </div>
        <Button
          onClick={abrirCrear}
          variant="neumorphic"
          className="flex items-center gap-2 px-5 py-3 rounded-2xl"
        >
          <PlusCircle className="w-5 h-5 text-indigo-500" /> Registrar Empleado
        </Button>
      </div>

      {isLoadingProfiles ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : isError ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">Error: {(error as Error).message}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles?.map((perfil) => (
            <div key={perfil.id} className={`neumorphic-outset p-6 rounded-[2rem] border-none flex flex-col justify-between transition-all duration-300 hover:scale-[1.015] ${!perfil.is_active ? 'opacity-60' : ''}`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{perfil.full_name}</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {perfil.role === 'owner' ? 'Dueño / Administrador' : perfil.role === 'receptionist' ? 'Recepcionista' : 'Mecánico'}
                      </span>
                    </div>
                  </div>
                  
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${perfil.is_active ? 'bg-emerald-500/10 text-emerald-650 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                    {perfil.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {perfil.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-xs font-semibold text-slate-650 dark:text-slate-400 border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
                  {perfil.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>{perfil.phone}</span>
                    </div>
                  )}
                  {perfil.role === 'mechanic' && (
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>Comisión: <strong className="text-slate-800 dark:text-white">{perfil.commission_percentage}%</strong></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/40 dark:border-slate-800/40 flex justify-end">
                <Button
                  onClick={() => abrirEditar(perfil)}
                  disabled={perfil.role === 'owner'}
                  variant="neumorphic"
                  size="sm"
                  className="rounded-xl text-xs py-1.5 px-4"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" /> Editar Datos
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Formulario */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-md rounded-[2rem] border-none p-7 shadow-2xl overflow-y-auto max-h-[90vh] neumorphic-outset">
            <h2 className="text-lg font-black text-slate-850 dark:text-white mb-6 uppercase tracking-widest border-b border-slate-200/40 dark:border-slate-800/40 pb-3">
              {editando ? 'Editar Empleado' : 'Registrar Empleado'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-2xl font-bold uppercase tracking-wider">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Pedro Navaja"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teléfono móvil</label>
                <input
                  type="text"
                  className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 573001234567"
                />
              </div>

              {!editando && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Correo Electrónico (Login)</label>
                    <input
                      type="email"
                      required
                      className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mecanico@tallerudave.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contraseña de acceso</label>
                    <input
                      type="password"
                      required
                      className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rol de Trabajo</label>
                <select
                  title="Rol de trabajo"
                  className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all bg-transparent cursor-pointer appearance-none font-medium"
                  value={rol}
                  onChange={(e) => setRol(e.target.value as 'mechanic' | 'receptionist')}
                >
                  <option value="mechanic" className="dark:bg-slate-900">Mecánico</option>
                  <option value="receptionist" className="dark:bg-slate-900">Recepcionista / Asesor</option>
                </select>
              </div>

              {rol === 'mechanic' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Porcentaje de Comisión (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    title="Porcentaje de comisión"
                    placeholder="Ej: 30"
                    className="mt-2 block w-full rounded-xl neumorphic-inset text-slate-800 dark:text-slate-100 text-sm p-3 outline-none focus:ring-2 focus:ring-blue-500/20 border-none transition-all font-bold"
                    value={comision}
                    onChange={(e) => setComision(e.target.value)}
                  />
                </div>
              )}

              {editando && (
                <div className="flex items-center gap-3 py-1">
                  <input
                    type="checkbox"
                    id="activo"
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                  />
                  <label htmlFor="activo" className="text-xs font-bold text-slate-650 dark:text-slate-450 uppercase tracking-wider cursor-pointer">
                    Cuenta activa (Permite el ingreso)
                  </label>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
                <Button
                  type="button"
                  variant="neumorphic"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 rounded-xl text-xs py-2.5"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="neumorphic"
                  disabled={crearPerfil.isPending || actualizarPerfil.isPending}
                  className="flex-1 rounded-xl text-xs py-2.5 text-blue-600 dark:text-blue-400"
                >
                  {(crearPerfil.isPending || actualizarPerfil.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
