import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, List, History, LogOut, DollarSign, Users, Sparkles, CalendarDays, Package, Wrench, Wallet } from 'lucide-react'
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
      <aside className="glass flex flex-col w-64 h-screen px-4 py-8 z-10 relative">
        <div className="flex items-center justify-center mb-10">
          <Sparkles className="w-6 h-6 text-indigo-500 mr-2 animate-pulse" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Cargando...</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-slate-500 animate-pulse">
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
        { icon: CalendarDays, label: 'Citas', path: '/citas' },
        { icon: PlusCircle, label: 'Nueva Orden', path: '/nueva-orden' },
        { icon: List, label: 'Órdenes Activas', path: '/ordenes' },
        { icon: Package, label: 'Inventario', path: '/inventario' },
        { icon: Wrench, label: 'Servicios', path: '/servicios' },
        { icon: Wallet, label: 'Caja y POS', path: '/caja' },
        { icon: History, label: 'Historial', path: '/historial' },
        { icon: DollarSign, label: 'Comisiones', path: '/comisiones' },
        { icon: Users, label: 'Personal', path: '/personal' },
      )
    } else if (profile.role === 'receptionist') {
      menuItems.push(
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: CalendarDays, label: 'Citas', path: '/citas' },
        { icon: PlusCircle, label: 'Nueva Orden', path: '/nueva-orden' },
        { icon: List, label: 'Órdenes Activas', path: '/ordenes' },
        { icon: History, label: 'Historial', path: '/historial' },
      )
    } else if (profile.role === 'mechanic') {
      menuItems.push(
        { icon: LayoutDashboard, label: 'Panel Mecánico', path: '/panel-mecanico' },
      )
    }
  }

  return (
    <aside className="glass flex flex-col w-64 h-screen px-4 py-8 overflow-y-auto text-slate-600 z-10 relative border-r-0 shadow-[10px_0_20px_#cbd5e1]">
      <div className="flex items-center justify-center mb-8 group cursor-default">
        <div className="flex flex-col items-center transition-transform group-hover:scale-105 duration-300">
          <div className="flex items-center">
             <Sparkles className="w-6 h-6 text-indigo-500 mr-2 opacity-80" />
             <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight text-center leading-tight">
               {(profile as unknown as { talleres?: { nombre_negocio: string } })?.talleres?.nombre_negocio || 'TallerBoost'}
             </h2>
          </div>
          {profile && (
            <span className="text-[10px] uppercase tracking-widest bg-indigo-100 text-indigo-600 border border-indigo-200 px-3 py-1 rounded-full mt-3 font-bold shadow-sm">
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
                    : "hover:bg-white/60 hover:text-indigo-700 border border-transparent hover:border-white/80 hover:shadow-sm"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110 text-slate-400 group-hover:text-indigo-500")} />
                <span className="mx-4 font-medium tracking-wide text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 border-t border-slate-200 pt-6">
          {profile && (
            <div className="px-4 py-3 mb-4 rounded-xl neumorphic-inset">
              <p className="font-bold text-slate-800 truncate text-sm">{profile.full_name}</p>
              <p className="truncate text-xs text-slate-500 mt-0.5">{profile.phone || 'Sin teléfono'}</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="group flex items-center w-full px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-slate-600 transition-all duration-300 border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
            <span className="mx-4 font-medium text-sm tracking-wide">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
