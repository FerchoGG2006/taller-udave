import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans text-slate-900 selection:bg-blue-500/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-10">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
