import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { Layout } from './components/ui/Layout'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

const queryClient = new QueryClient()

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>
  }

  const isPublicRoute = location.pathname.startsWith('/cliente/') || location.pathname === '/registro-taller'

  // Si no hay sesión, no está en login, y no es ruta pública, redirigir a /login
  if (!session && location.pathname !== '/login' && !isPublicRoute) {
    return <Navigate to="/login" replace />
  }

  // Si hay sesión y está en login, redirigir al dashboard
  if (session && location.pathname === '/login') {
    return <Navigate to="/" replace />
  }

  return (
    <QueryClientProvider client={queryClient}>
      {session && !isPublicRoute ? (
        <Layout />
      ) : (
        <Outlet />
      )}
    </QueryClientProvider>
  )
}

export default App
