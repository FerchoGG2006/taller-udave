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

  // Si no hay sesión y no está en la página de login, redirigir a /login
  if (!session && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  // Si hay sesión y está en login, redirigir al dashboard
  if (session && location.pathname === '/login') {
    return <Navigate to="/" replace />
  }

  return (
    <QueryClientProvider client={queryClient}>
      {session ? (
        <Layout />
      ) : (
        <Outlet />
      )}
    </QueryClientProvider>
  )
}

export default App
