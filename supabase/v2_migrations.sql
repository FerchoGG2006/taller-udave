-- =========================================================================
-- MIGRACIÓN V2: INVENTARIO, CATÁLOGO DE SERVICIOS, CAJA (POS) Y CONFIGURACIÓN
-- =========================================================================

-- 1. Tabla: inventario (Gestión de repuestos y productos)
CREATE TABLE IF NOT EXISTS public.inventario (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taller_id           UUID REFERENCES public.talleres(id) NOT NULL,
  codigo              TEXT, -- Código de barras o SKU interno
  nombre              TEXT NOT NULL,
  descripcion         TEXT,
  categoria           TEXT, -- Ej: Filtros, Aceites, Frenos
  cantidad_stock      INT NOT NULL DEFAULT 0,
  stock_minimo        INT DEFAULT 2,
  precio_compra       NUMERIC(12,2) DEFAULT 0.00,
  precio_venta        NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla: catalogo_servicios (Mano de obra estandarizada)
CREATE TABLE IF NOT EXISTS public.catalogo_servicios (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taller_id           UUID REFERENCES public.talleres(id) NOT NULL,
  codigo              TEXT,
  nombre              TEXT NOT NULL,
  descripcion         TEXT,
  precio              NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tiempo_estimado_min INT, -- Tiempo estimado en minutos
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla: caja_movimientos (POS / Registro Financiero Diario)
CREATE TYPE tipo_movimiento_caja AS ENUM ('ingreso', 'egreso');
CREATE TYPE metodo_pago_caja AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'otro');

CREATE TABLE IF NOT EXISTS public.caja_movimientos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taller_id           UUID REFERENCES public.talleres(id) NOT NULL,
  registrado_por      UUID REFERENCES public.profiles(id) NOT NULL,
  orden_id            UUID REFERENCES public.ordenes(id) ON DELETE SET NULL, -- Si aplica a una orden específica
  tipo                tipo_movimiento_caja NOT NULL,
  monto               NUMERIC(12,2) NOT NULL,
  metodo_pago         metodo_pago_caja NOT NULL DEFAULT 'efectivo',
  concepto            TEXT NOT NULL, -- Ej: "Pago de Orden #102", "Compra de refrigerio"
  fecha_movimiento    TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla: configuracion_taller (Ajustes generales, facturación y WhatsApp)
CREATE TABLE IF NOT EXISTS public.configuracion_taller (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taller_id           UUID REFERENCES public.talleres(id) NOT NULL UNIQUE,
  razon_social        TEXT,
  nit_rut             TEXT,
  direccion           TEXT,
  telefono            TEXT,
  email_contacto      TEXT,
  terminos_condiciones TEXT, -- Para imprimir en el PDF de cotización/factura
  mensaje_whatsapp_bienvenida TEXT,
  mensaje_whatsapp_listo TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS) en nuevas tablas
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_taller ENABLE ROW LEVEL SECURITY;

-- 5. Crear Políticas (Multi-Tenant RLS Aislamiento Total)

-- inventario
DROP POLICY IF EXISTS "Tenant Isolation" ON public.inventario;
CREATE POLICY "Tenant Isolation" ON public.inventario FOR ALL USING (taller_id = public.get_taller_id());

-- catalogo_servicios
DROP POLICY IF EXISTS "Tenant Isolation" ON public.catalogo_servicios;
CREATE POLICY "Tenant Isolation" ON public.catalogo_servicios FOR ALL USING (taller_id = public.get_taller_id());

-- caja_movimientos
DROP POLICY IF EXISTS "Tenant Isolation" ON public.caja_movimientos;
CREATE POLICY "Tenant Isolation" ON public.caja_movimientos FOR ALL USING (taller_id = public.get_taller_id());

-- configuracion_taller
DROP POLICY IF EXISTS "Tenant Isolation" ON public.configuracion_taller;
CREATE POLICY "Tenant Isolation" ON public.configuracion_taller FOR ALL USING (taller_id = public.get_taller_id());


-- 6. Añadir triggers de updated_at
CREATE TRIGGER inventario_updated_at
  BEFORE UPDATE ON public.inventario
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER catalogo_servicios_updated_at
  BEFORE UPDATE ON public.catalogo_servicios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER config_taller_updated_at
  BEFORE UPDATE ON public.configuracion_taller
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Modificar tabla items_orden para enlazar a inventario o catalogo (Opcional, de referencia)
ALTER TABLE public.items_orden ADD COLUMN IF NOT EXISTS inventario_id UUID REFERENCES public.inventario(id);
ALTER TABLE public.items_orden ADD COLUMN IF NOT EXISTS servicio_id UUID REFERENCES public.catalogo_servicios(id);
ALTER TABLE public.items_orden ADD COLUMN IF NOT EXISTS cantidad INT DEFAULT 1;

-- 8. Trigger para descontar inventario cuando se marca como pagado o entregado (Opcional, según diseño)
-- Lo podemos hacer desde el backend/frontend, pero a nivel de base de datos asegura consistencia.
-- Por ahora añadiremos el campo "cantidad" para reflejar el consumo.

-- Configurar Default para taller_id (Igual que en SaaS Migration)
ALTER TABLE public.inventario ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();
ALTER TABLE public.catalogo_servicios ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();
ALTER TABLE public.caja_movimientos ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();
ALTER TABLE public.configuracion_taller ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();
