export type EstadoOrden =
  | 'recibido'
  | 'diagnostico'
  | 'esperando_aprobacion'
  | 'en_reparacion'
  | 'listo'
  | 'entregado'

export interface Cliente {
  id: string
  nombre: string
  telefono: string
  cedula?: string
  created_at: string
}

export interface Vehiculo {
  id: string
  cliente_id: string
  placa: string
  marca: string
  modelo: string
  anio?: number
  color?: string
}

export interface Orden {
  id: string
  vehiculo_id: string
  fecha_ingreso: string
  fecha_entrega_estimada?: string
  estado: EstadoOrden
  observaciones?: string
  aprobado_por_cliente: boolean
  notificacion_enviada: boolean
  created_at: string
}

export interface ItemOrden {
  id: string
  orden_id: string
  descripcion: string
  precio: number
  aprobado: boolean
}

export interface FotoOrden {
  id: string
  orden_id: string
  url: string
  tipo: 'ingreso' | 'proceso' | 'entrega'
}
