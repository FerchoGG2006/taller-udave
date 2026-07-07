import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { DashboardStats } from '../types'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_today')
        .select('*')
        .single()
      
      if (error) throw new Error(error.message)
      return data as DashboardStats
    }
  })
}
