import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Vehiculo } from '../types'

export function useVehiculoPorPlaca(placa: string) {
  return useQuery({
    queryKey: ['vehiculos', placa],
    queryFn: async () => {
      if (!placa) return null
      
      const { data, error } = await supabase
        .from('vehiculos')
        .select('*, clientes(*)')
        .eq('placa', placa.toUpperCase())
        .maybeSingle()
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: placa.length >= 5 // Solo buscar si hay placa válida
  })
}

export function useCrearVehiculo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (nuevoVehiculo: Omit<Vehiculo, 'id'>) => {
      const { data, error } = await supabase
        .from('vehiculos')
        .insert({
          ...nuevoVehiculo,
          placa: nuevoVehiculo.placa.toUpperCase()
        })
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data as Vehiculo
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehiculos'] })
      queryClient.invalidateQueries({ queryKey: ['vehiculos', variables.placa] })
    }
  })
}
