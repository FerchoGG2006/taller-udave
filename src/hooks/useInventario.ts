import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface InventarioItem {
  id: string
  taller_id: string
  codigo: string | null
  nombre: string
  descripcion: string | null
  categoria: string | null
  cantidad_stock: number
  stock_minimo: number
  precio_compra: number
  precio_venta: number
  is_active: boolean
}

export function useInventario() {
  const queryClient = useQueryClient()

  const inventarioQuery = useQuery({
    queryKey: ['inventario'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('nombre')
      
      if (error) throw error
      return data as InventarioItem[]
    }
  })

  const addInventario = useMutation({
    mutationFn: async (nuevoItem: Omit<InventarioItem, 'id' | 'taller_id' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('inventario')
        .insert([nuevoItem])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
    }
  })

  const updateInventario = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventarioItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventario')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
    }
  })

  const deleteInventario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventario')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
    }
  })

  return {
    inventario: inventarioQuery.data,
    isLoading: inventarioQuery.isLoading,
    error: inventarioQuery.error,
    addInventario,
    updateInventario,
    deleteInventario
  }
}
