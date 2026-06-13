import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Orden, EstadoOrden } from '../types'

export function useOrdenesActivas() {
  return useQuery({
    queryKey: ['ordenes', 'activas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          *,
          vehiculos (
            placa, marca, modelo,
            clientes (nombre, telefono)
          )
        `)
        .neq('estado', 'entregado')
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(error.message)
      return data
    }
  })
}

export function useHistorialOrdenes(placa?: string) {
  return useQuery({
    queryKey: ['ordenes', 'historial', placa],
    queryFn: async () => {
      let query = supabase
        .from('ordenes')
        .select(`
          *,
          vehiculos!inner (
            placa, marca, modelo,
            clientes (nombre, telefono)
          )
        `)
        .order('created_at', { ascending: false })
        
      if (placa) {
        query = query.eq('vehiculos.placa', placa.toUpperCase())
      }
      
      const { data, error } = await query
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: placa === undefined || placa.length >= 5
  })
}

export function useCambiarEstadoOrden() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string, estado: EstadoOrden }) => {
      const { data, error } = await supabase
        .from('ordenes')
        .update({ estado })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data as Orden
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    }
  })
}

export function useCrearOrden() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orden, items }: { 
      orden: Omit<Orden, 'id' | 'created_at' | 'estado' | 'aprobado_por_cliente' | 'notificacion_enviada'>,
      items: { descripcion: string, precio: number }[]
    }) => {
      // 1. Crear Orden
      const { data: nuevaOrden, error: errorOrden } = await supabase
        .from('ordenes')
        .insert(orden)
        .select()
        .single()
        
      if (errorOrden) throw new Error(errorOrden.message)
      
      // 2. Crear Items
      if (items.length > 0) {
        const itemsAInsertar = items.map(item => ({
          ...item,
          orden_id: nuevaOrden.id
        }))
        
        const { error: errorItems } = await supabase
          .from('items_orden')
          .insert(itemsAInsertar)
          
        if (errorItems) throw new Error(errorItems.message)
      }
      
      return nuevaOrden
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    }
  })
}
