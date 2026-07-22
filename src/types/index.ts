export type EstadoOrden =
  | 'recibido'
  | 'diagnostico'
  | 'esperando_aprobacion'
  | 'en_reparacion'
  | 'listo'
  | 'entregado'

export type UserRole = 'owner' | 'receptionist' | 'mechanic'

export interface Taller {
  id: string
  nombre_negocio: string
  logo_url?: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  phone?: string
  role: UserRole
  taller_id: string
  commission_percentage?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  nombre: string
  telefono: string
  taller_id: string
  cedula?: string
  created_at: string
}

export interface Vehiculo {
  id: string
  cliente_id: string
  taller_id: string
  placa: string
  marca: string
  modelo: string
  anio?: number
  color?: string
}

export interface ChecklistIngreso {
  kilometraje?: number
  nivel_gasolina?: 'reserva' | '25%' | '50%' | '75%' | '100%'
  elementos?: Record<string, boolean>
  notas_danos?: string
}

export interface Orden {
  id: string
  order_number?: number
  vehiculo_id: string
  taller_id: string
  receptionist_id?: string
  fecha_ingreso: string
  fecha_entrega_estimada?: string
  estado: EstadoOrden
  observaciones?: string
  diagnosis?: string
  labor_cost?: number
  parts_cost?: number
  aprobado_por_cliente: boolean
  notificacion_enviada: boolean
  is_paid?: boolean
  internal_notes?: string
  checklist_ingreso?: ChecklistIngreso
  created_at: string
  updated_at?: string
}

export interface ItemOrden {
  id: string
  orden_id: string
  taller_id: string
  descripcion: string
  precio: number
  aprobado: boolean
}

export interface FotoOrden {
  id: string
  orden_id: string
  taller_id: string
  url: string
  tipo: 'ingreso' | 'proceso' | 'entrega'
}

export interface OrderMechanic {
  id: string
  orden_id: string
  mechanic_id: string
  taller_id: string
  commission_percentage: number
  commission_amount: number
  is_commission_paid: boolean
  assigned_at: string
}

export interface OrderStatusHistory {
  id: string
  orden_id: string
  changed_by: string
  taller_id: string
  previous_status?: string
  new_status: string
  note?: string
  created_at: string
}

export interface CommissionPeriod {
  id: string
  mechanic_id: string
  period_start: string
  period_end: string
  total_labor_value: number
  total_commission: number
  is_paid: boolean
  paid_at?: string
  paid_by?: string
  notes?: string
  created_at: string
}

export interface MechanicInOrder {
  id: string
  name: string
  commission_percentage: number
  commission_amount: number
  is_commission_paid: boolean
}

export type OrdenFull = Orden & {
  vehiculos?: Vehiculo & {
    clientes?: Cliente
  }
  receptionist?: Pick<Profile, 'id' | 'full_name'>
  mechanics?: MechanicInOrder[]
}

export interface DashboardStats {
  active_orders: number
  received_today: number
  ready_for_delivery: number
  delivered_today: number
  revenue_today: number
  pending_revenue: number
}

export interface PendingCommission {
  mechanic_id: string
  mechanic_name: string
  pending_orders: number
  total_pending: number
  oldest_order_date: string
}

export type TipoMovimientoCaja = 'ingreso' | 'egreso'
export type MetodoPagoCaja = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'

export interface CajaMovimiento {
  id: string
  taller_id: string
  registrado_por: string
  orden_id?: string
  tipo: TipoMovimientoCaja
  monto: number
  metodo_pago: MetodoPagoCaja
  concepto: string
  fecha_movimiento: string
  created_at: string
}

export interface CajaMovimientoFull extends CajaMovimiento {
  profiles?: {
    full_name: string
  }
  ordenes?: {
    order_number: number
    vehiculos?: {
      placa: string
    }
  }
}
