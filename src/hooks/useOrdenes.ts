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
            id, placa, marca, modelo, anio, color,
            clientes (id, nombre, telefono)
          ),
          receptionist:profiles!ordenes_receptionist_id_fkey (id, full_name),
          order_mechanics (
            id,
            mechanic_id,
            commission_percentage,
            commission_amount,
            is_commission_paid,
            profiles (full_name)
          )
        `)
        .neq('estado', 'entregado')
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(error.message)
      return data as any[]
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
            id, placa, marca, modelo, anio, color,
            clientes (id, nombre, telefono)
          ),
          receptionist:profiles!ordenes_receptionist_id_fkey (id, full_name),
          order_mechanics (
            id,
            mechanic_id,
            commission_percentage,
            commission_amount,
            is_commission_paid,
            profiles (full_name)
          )
        `)
        .order('created_at', { ascending: false })
        
      if (placa) {
        query = query.eq('vehiculos.placa', placa.toUpperCase())
      }
      
      const { data, error } = await query
      
      if (error) throw new Error(error.message)
      return data as any[]
    },
    enabled: placa === undefined || placa.length >= 5
  })
}

export function useCambiarEstadoOrden() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, estado, note }: { id: string, estado: EstadoOrden, note?: string }) => {
      // 1. Actualizar estado
      const { data, error } = await supabase
        .from('ordenes')
        .update({ estado })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)

      // 2. Si hay una nota, la insertamos en el historial de estados
      // Nota: El trigger 'order_status_change_log' creará el historial automático,
      // pero si queremos agregar una nota personalizada, podemos actualizar el último registro insertado.
      if (note) {
        // Esperamos un momento breve para que el trigger inserte el registro
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const { data: latestHistory } = await supabase
          .from('order_status_history')
          .select('id')
          .eq('orden_id', id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (latestHistory && latestHistory.length > 0) {
          await supabase
            .from('order_status_history')
            .update({ note })
            .eq('id', latestHistory[0].id)
        }
      }

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
      orden: Omit<Orden, 'id' | 'created_at' | 'estado' | 'aprobado_por_cliente' | 'notificacion_enviada' | 'order_number'>,
      items: { descripcion: string, precio: number }[]
    }) => {
      // Obtener el ID del usuario actual para registrarlo como recepcionista si está autenticado
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Crear Orden
      const { data: nuevaOrden, error: errorOrden } = await supabase
        .from('ordenes')
        .insert({
          ...orden,
          receptionist_id: user ? user.id : null
        })
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
      
      return nuevaOrden as Orden
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    }
  })
}

export function useActualizarOrdenDetalles() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ordenId, laborCost, partsCost, diagnosis, estimatedDelivery, internalNotes, mechanicIds }: {
      ordenId: string
      laborCost: number
      partsCost: number
      diagnosis?: string
      estimatedDelivery?: string
      internalNotes?: string
      mechanicIds: string[]
    }) => {
      // 1. Actualizar campos de la orden
      const { data: orden, error: errOrden } = await supabase
        .from('ordenes')
        .update({
          labor_cost: laborCost,
          parts_cost: partsCost,
          diagnosis,
          fecha_entrega_estimada: estimatedDelivery,
          internal_notes: internalNotes
        })
        .eq('id', ordenId)
        .select()
        .single()

      if (errOrden) throw new Error(errOrden.message)

      // 2. Obtener mecánicos asignados actualmente
      const { data: actuales, error: errFetch } = await supabase
        .from('order_mechanics')
        .select('mechanic_id')
        .eq('orden_id', ordenId)

      if (errFetch) throw new Error(errFetch.message)
      const idsActuales = actuales?.map(a => a.mechanic_id) || []

      // 3. Desasignar mecánicos retirados
      const aEliminar = idsActuales.filter(id => !mechanicIds.includes(id))
      if (aEliminar.length > 0) {
        const { error: errDel } = await supabase
          .from('order_mechanics')
          .delete()
          .eq('orden_id', ordenId)
          .in('mechanic_id', aEliminar)

        if (errDel) throw new Error(errDel.message)
      }

      // 4. Asignar nuevos mecánicos con su snapshot de comisión actual
      const aAgregar = mechanicIds.filter(id => !idsActuales.includes(id))
      if (aAgregar.length > 0) {
        const { data: perfiles, error: errPerfiles } = await supabase
          .from('profiles')
          .select('id, commission_percentage')
          .in('id', aAgregar)

        if (errPerfiles) throw new Error(errPerfiles.message)

        const inserts = perfiles.map(p => ({
          orden_id: ordenId,
          mechanic_id: p.id,
          commission_percentage: p.commission_percentage || 0
        }))

        const { error: errIns } = await supabase
          .from('order_mechanics')
          .insert(inserts)

        if (errIns) throw new Error(errIns.message)
      }

      return orden as Orden
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
      queryClient.invalidateQueries({ queryKey: ['commissions'] })
    }
  })
}
