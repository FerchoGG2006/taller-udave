import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Login from './pages/Login.tsx'
import Dashboard from './pages/Dashboard.tsx'
import NuevaOrden from './pages/NuevaOrden.tsx'
import Ordenes from './pages/Ordenes.tsx'
import Historial from './pages/Historial.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/login', element: <Login /> },
      { path: '/nueva-orden', element: <NuevaOrden /> },
      { path: '/ordenes', element: <Ordenes /> },
      { path: '/historial', element: <Historial /> },
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
