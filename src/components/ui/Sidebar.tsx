import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, List, History, LogOut, DollarSign, Users } from 'lucide-react'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { useActiveProfile } from '../../hooks/useProfiles'

export function Sidebar() {
  const location = useLocation()
  const { data: profile, isLoading } = useActiveProfile()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // Si está cargando el perfil, mostrar un estado de carga simple
  if (isLoading) {
    return (
      <aside className="flex flex-col w-64 h-screen px-4 py-8 bg-gray-900 border-r border-gray-800 text-gray-300">
        <div className="flex items-center justify-center mb-10">
          <h2 className="text-2xl font-bold text-white tracking-wider">Taller Udave</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          Cargando perfil...
        </div>
      </aside>
    )
  }

  // Generar ítems del menú según el rol
  const menuItems = []
  
  if (profile) {
    if (profile.role === 'owner') {
      menuItems.push(
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: PlusCircle, label: 'Nueva Orden', path: '/nueva-orden' },
        { icon: List, label: 'Órdenes Activas', path: '/ordenes' },
        { icon: History, label: 'Historial', path: '/historial' },
        { icon: DollarSign, label: 'Comisiones', path: '/comisiones' },
        { icon: Users, label: 'Personal', path: '/personal' },
      )
    } else if (profile.role === 'receptionist') {
      menuItems.push(
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: PlusCircle, label: 'Nueva Orden', path: '/nueva-orden' },
        { icon: List, label: 'Órdenes Activas', path: '/ordenes' },
        { icon: History, label: 'Historial', path: '/historial' },
      )
    } else if (profile.role === 'mechanic') {
      menuItems.push(
        { icon: List, label: 'Mis Órdenes', path: '/ordenes' },
      )
    }
  }

  return (
    <aside className="flex flex-col w-64 h-screen px-4 py-8 overflow-y-auto bg-gray-900 border-r border-gray-800 text-gray-300">
      <div className="flex items-center justify-center mb-6">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold text-white tracking-wider">Taller Udave</h2>
          {profile && (
            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full mt-2 font-medium capitalize">
              {profile.role === 'owner' ? 'Dueño' : profile.role === 'receptionist' ? 'Asesor' : 'Mecánico'}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between flex-1 mt-6">
        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 mt-2 rounded-lg transition-colors",
                  isActive 
                    ? "bg-gray-800 text-white border border-gray-700" 
                    : "hover:bg-gray-800/50 hover:text-gray-100"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="mx-4 font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 border-t border-gray-800 pt-4">
          {profile && (
            <div className="px-4 py-2 mb-4 text-xs text-gray-500 border border-gray-800 rounded-lg bg-gray-950/20">
              <p className="font-semibold text-gray-400 truncate">{profile.full_name}</p>
              <p className="truncate text-[10px]">{profile.phone || 'Sin teléfono'}</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 mt-2 rounded-lg hover:bg-red-950/20 hover:text-red-400 text-gray-400 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="mx-4 font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
