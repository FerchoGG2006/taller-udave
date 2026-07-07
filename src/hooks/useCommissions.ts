import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { PendingCommission, CommissionPeriod } from '../types'

export function useComisionesPendientes() {
  return useQuery({
    queryKey: ['commissions', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_commissions')
        .select('*')
      
      if (error) throw new Error(error.message)
      return data as PendingCommission[]
    }
  })
}

export function usePeriodosComision() {
  return useQuery({
    queryKey: ['commissions', 'periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_periods')
        .select(`
          *,
          profiles!commission_periods_mechanic_id_fkey (full_name)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(error.message)
      return data as (CommissionPeriod & { profiles: { full_name: string } })[]
    }
  })
}

export function usePagarComisiones() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ mechanicId, notes, totalLabor, totalCommission, paidBy }: {
      mechanicId: string
      notes?: string
      totalLabor: number
      totalCommission: number
      paidBy: string
    }) => {
      // 1. Obtener los registros de order_mechanics para saber las fechas de período
      const { data: assignments, error: errFetch } = await supabase
        .from('order_mechanics')
        .select(`
          assigned_at,
          ordenes!inner(estado)
        `)
        .eq('mechanic_id', mechanicId)
        .eq('is_commission_paid', false)
        .eq('ordenes.estado', 'entregado')

      if (errFetch) throw new Error(errFetch.message)

      let periodStart = new Date().toISOString()
      let periodEnd = new Date().toISOString()

      if (assignments && assignments.length > 0) {
        const dates = assignments.map(a => new Date(a.assigned_at).getTime())
        periodStart = new Date(Math.min(...dates)).toISOString()
        periodEnd = new Date(Math.max(...dates)).toISOString()
      }

      // 2. Registrar el corte en commission_periods
      const { data: period, error: errPeriod } = await supabase
        .from('commission_periods')
        .insert({
          mechanic_id: mechanicId,
          period_start: periodStart,
          period_end: periodEnd,
          total_labor_value: totalLabor,
          total_commission: totalCommission,
          is_paid: true,
          paid_at: new Date().toISOString(),
          paid_by: paidBy,
          notes: notes || ''
        })
        .select()
        .single()

      if (errPeriod) throw new Error(errPeriod.message)

      // 3. Marcar como pagadas las comisiones en order_mechanics
      // Hacemos un join o actualización masiva
      // En Supabase, podemos actualizar por filamento de subconsulta
      const { error: errUpdate } = await supabase
        .rpc('pagar_comisiones_rpc', { p_mechanic_id: mechanicId })
        // Si el RPC no está habilitado, lo actualizamos por ordenes usando un fallback sencillo
      
      if (errUpdate) {
        // Fallback: Si no existe el RPC, actualizamos directamente todos los order_mechanics no pagados
        // para este mecánico. Dado que la comisión solo se calcula cuando se entrega ('entregado'),
        // actualizar todos los pendientes de pago es la forma directa de hacerlo.
        const { error: errFallback } = await supabase
          .from('order_mechanics')
          .update({ is_commission_paid: true })
          .eq('mechanic_id', mechanicId)
          .eq('is_commission_paid', false)
        
        if (errFallback) throw new Error(errFallback.message)
      }

      return period
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] })
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    }
  })
}
