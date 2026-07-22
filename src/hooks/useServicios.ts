import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface ServicioItem {
  id: string
  taller_id: string
  codigo: string | null
  nombre: string
  descripcion: string | null
  precio: number
  tiempo_estimado_min: number | null
  is_active: boolean
}

export function useServicios() {
  const queryClient = useQueryClient()

  const serviciosQuery = useQuery({
    queryKey: ['servicios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_servicios')
        .select('*')
        .order('nombre')
      
      if (error) throw error
      return data as ServicioItem[]
    }
  })

  const addServicio = useMutation({
    mutationFn: async (nuevoItem: Omit<ServicioItem, 'id' | 'taller_id' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('catalogo_servicios')
        .insert([nuevoItem])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] })
    }
  })

  const updateServicio = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServicioItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('catalogo_servicios')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] })
    }
  })

  const deleteServicio = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catalogo_servicios')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] })
    }
  })

  return {
    servicios: serviciosQuery.data,
    isLoading: serviciosQuery.isLoading,
    error: serviciosQuery.error,
    addServicio,
    updateServicio,
    deleteServicio
  }
}
