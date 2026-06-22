import { useState } from 'react'
import { useProfiles, useCrearPerfil, useActualizarPerfil, useActiveProfile } from '../hooks/useProfiles'
import { Navigate } from 'react-router-dom'
import { PlusCircle, Edit2, CheckCircle2, XCircle, Shield, Phone, Percent, Loader2 } from 'lucide-react'

export default function Personal() {
  const { data: activeUser } = useActiveProfile()
  const { data: profiles, isLoading: isLoadingProfiles, isError, error } = useProfiles()
  const crearPerfil = useCrearPerfil()
  const actualizarPerfil = useActualizarPerfil()

  // State para modales/formularios
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  
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

  const abrirEditar = (perfil: any) => {
    setEditando(perfil)
    setNombre(perfil.full_name)
    setTelefono(perfil.phone || '')
    setRol(perfil.role)
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
    } catch (err: any) {
      setFormError(err.message || "Ocurrió un error al guardar el perfil")
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personal del Taller</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona los accesos de recepcionistas y mecánicos del taller</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
        >
          <PlusCircle className="w-5 h-5" /> Registrar Empleado
        </button>
      </div>

      {isLoadingProfiles ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : isError ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">Error: {(error as Error).message}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles?.map((perfil) => (
            <div key={perfil.id} className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col justify-between ${!perfil.is_active ? 'border-gray-200 opacity-60' : 'border-gray-200'}`}>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{perfil.full_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Shield className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {perfil.role === 'owner' ? 'Dueño / Administrador' : perfil.role === 'receptionist' ? 'Recepcionista' : 'Mecánico'}
                      </span>
                    </div>
                  </div>
                  
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${perfil.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {perfil.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {perfil.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-sm text-gray-600 border-t border-gray-50 pt-3">
                  {perfil.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{perfil.phone}</span>
                    </div>
                  )}
                  {perfil.role === 'mechanic' && (
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-gray-400" />
                      <span>Comisión: <strong>{perfil.commission_percentage}%</strong></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => abrirEditar(perfil)}
                  disabled={perfil.role === 'owner'}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar Datos
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Formulario */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-100 p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editando ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Pedro Navaja"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono móvil</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 573001234567"
                />
              </div>

              {!editando && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico (Login)</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mecanico@tallerudave.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña de acceso</label>
                    <input
                      type="password"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol de Trabajo</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                  value={rol}
                  onChange={(e) => setRol(e.target.value as any)}
                >
                  <option value="mechanic">Mecánico</option>
                  <option value="receptionist">Recepcionista / Asesor</option>
                </select>
              </div>

              {rol === 'mechanic' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje de Comisión (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={comision}
                    onChange={(e) => setComision(e.target.value)}
                  />
                </div>
              )}

              {editando && (
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="activo"
                    className="rounded text-blue-600 focus:ring-blue-500"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                  />
                  <label htmlFor="activo" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Cuenta activa (Permite el ingreso)
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crearPerfil.isPending || actualizarPerfil.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center"
                >
                  {(crearPerfil.isPending || actualizarPerfil.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
