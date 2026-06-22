import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Profile, UserRole } from '../types'

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      if (error) throw new Error(error.message)
      return data as Profile[]
    }
  })
}

export function useMecanicosActivos() {
  return useQuery({
    queryKey: ['profiles', 'mechanics', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mechanic')
        .eq('is_active', true)
        .order('full_name', { ascending: true })

      if (error) throw new Error(error.message)
      return data as Profile[]
    }
  })
}

export function useProfile(id?: string) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message)
      return data as Profile
    },
    enabled: !!id
  })
}

export function useActiveProfile() {
  return useQuery({
    queryKey: ['activeProfile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw new Error(error.message)
      return data as Profile
    }
  })
}

export function useCrearPerfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, password, full_name, role, commission_percentage, phone }: {
      email: string
      password: string
      full_name: string
      role: UserRole
      commission_percentage?: number
      phone?: string
    }) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            role
          }
        }
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error("No se pudo crear el usuario")

      await new Promise(resolve => setTimeout(resolve, 800))

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          phone,
          commission_percentage: role === 'mechanic' ? (commission_percentage || 0) : 0
        })
        .eq('id', authData.user.id)
        .select()
        .single()

      if (updateError) throw new Error(updateError.message)
      return updatedProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    }
  })
}

export function useActualizarPerfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, full_name, phone, role, commission_percentage, is_active }: {
      id: string
      full_name: string
      phone?: string
      role: UserRole
      commission_percentage?: number
      is_active: boolean
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name,
          phone,
          role,
          commission_percentage: role === 'mechanic' ? (commission_percentage || 0) : 0,
          is_active
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as Profile
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['activeProfile'] })
    }
  })
}
