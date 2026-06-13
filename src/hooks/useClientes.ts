import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Cliente } from '../types'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre')
      
      if (error) throw new Error(error.message)
      return data as Cliente[]
    }
  })
}

export function useCrearCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (nuevoCliente: Omit<Cliente, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('clientes')
        .insert(nuevoCliente)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data as Cliente
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    }
  })
}
