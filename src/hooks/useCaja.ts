import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { CajaMovimiento, CajaMovimientoFull } from '../types'

export function useMovimientosPorFecha(fecha: string) {
  return useQuery({
    queryKey: ['caja_movimientos', fecha],
    queryFn: async () => {
      // Fetch movements for the specific date
      const startOfDay = new Date(fecha + 'T00:00:00').toISOString()
      const endOfDay = new Date(fecha + 'T23:59:59.999').toISOString()

      const { data, error } = await supabase
        .from('caja_movimientos')
        .select(`
          *,
          profiles (full_name),
          ordenes (
            order_number,
            vehiculos (placa)
          )
        `)
        .gte('fecha_movimiento', startOfDay)
        .lte('fecha_movimiento', endOfDay)
        .order('fecha_movimiento', { ascending: false })

      if (error) throw new Error(error.message)
      return data as CajaMovimientoFull[]
    },
    enabled: !!fecha,
  })
}

export function useCrearMovimiento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (movimiento: Omit<CajaMovimiento, 'id' | 'taller_id' | 'created_at' | 'registrado_por'>) => {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) throw new Error('No user authenticated')
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, taller_id')
        .eq('id', userData.user.id)
        .single()
        
      if (!profile) throw new Error('Profile not found')

      const { data, error } = await supabase
        .from('caja_movimientos')
        .insert([{
          ...movimiento,
          taller_id: profile.taller_id,
          registrado_por: profile.id
        }])
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate the query for the specific date of the movement
      if (variables.fecha_movimiento) {
        const dateStr = variables.fecha_movimiento.split('T')[0]
        queryClient.invalidateQueries({ queryKey: ['caja_movimientos', dateStr] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['caja_movimientos'] })
      }
    }
  })
}
