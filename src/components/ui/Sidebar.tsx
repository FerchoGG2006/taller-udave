import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, List, History, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'

export function Sidebar() {
  const location = useLocation()
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: PlusCircle, label: 'Nueva Orden', path: '/nueva-orden' },
    { icon: List, label: 'Órdenes Activas', path: '/ordenes' },
    { icon: History, label: 'Historial', path: '/historial' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <aside className="flex flex-col w-64 h-screen px-4 py-8 overflow-y-auto bg-gray-900 border-r border-gray-800 text-gray-300">
      <div className="flex items-center justify-center mb-10">
        <h2 className="text-2xl font-bold text-white tracking-wider">Taller Udave</h2>
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
                    ? "bg-gray-800 text-white" 
                    : "hover:bg-gray-800 hover:text-gray-100"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="mx-4 font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 border-t border-gray-800 pt-4">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 mt-2 rounded-lg hover:bg-gray-800 hover:text-gray-100 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="mx-4 font-medium text-red-400">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
