import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, List, History, LogOut, DollarSign, Users, Sparkles } from 'lucide-react'
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
      <aside className="glass-dark flex flex-col w-64 h-screen px-4 py-8 z-10 relative">
        <div className="flex items-center justify-center mb-10">
          <Sparkles className="w-6 h-6 text-blue-400 mr-2 animate-pulse" />
          <h2 className="text-2xl font-black text-white tracking-tight">Taller Udave</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500 animate-pulse">
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
    <aside className="glass-dark flex flex-col w-64 h-screen px-4 py-8 overflow-y-auto text-gray-300 z-10 relative border-r-0 shadow-2xl">
      <div className="flex items-center justify-center mb-8 group cursor-default">
        <div className="flex flex-col items-center transition-transform group-hover:scale-105 duration-300">
          <div className="flex items-center">
             <Sparkles className="w-6 h-6 text-blue-500 mr-2 opacity-80" />
             <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Taller Udave</h2>
          </div>
          {profile && (
            <span className="text-[10px] uppercase tracking-widest bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full mt-3 font-bold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              {profile.role === 'owner' ? 'Dueño' : profile.role === 'receptionist' ? 'Asesor' : 'Mecánico'}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between flex-1 mt-4">
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl transition-all duration-300 group",
                  isActive 
                    ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-lg shadow-blue-900/40 border border-white/10 translate-x-1" 
                    : "hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110 text-gray-400 group-hover:text-gray-200")} />
                <span className="mx-4 font-medium tracking-wide text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 border-t border-gray-800/60 pt-6">
          {profile && (
            <div className="px-4 py-3 mb-4 rounded-xl bg-black/40 border border-gray-800/80 backdrop-blur-md shadow-inner">
              <p className="font-bold text-gray-200 truncate text-sm">{profile.full_name}</p>
              <p className="truncate text-xs text-gray-500 mt-0.5">{profile.phone || 'Sin teléfono'}</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="group flex items-center w-full px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-all duration-300 border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-400 transition-colors" />
            <span className="mx-4 font-medium text-sm tracking-wide">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
