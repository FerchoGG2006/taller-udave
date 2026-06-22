-- Script para inicializar la base de datos de Taller Udave en Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos enumerados
CREATE TYPE user_role AS ENUM ('owner', 'receptionist', 'mechanic');

-- 1. Tabla: profiles (perfiles de empleados)
CREATE TABLE profiles (
  id                      UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name               TEXT NOT NULL,
  phone                   TEXT,
  role                    user_role NOT NULL DEFAULT 'mechanic',
  commission_percentage   NUMERIC(5,2) DEFAULT 0.00, -- solo aplica para mecánicos
  is_active               BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- 2. Clientes del taller
CREATE TABLE clientes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  telefono    TEXT NOT NULL,   -- formato: 573XXXXXXXXX para WhatsApp
  cedula      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Vehículos (un cliente puede tener varios)
CREATE TABLE vehiculos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID REFERENCES clientes(id) ON DELETE CASCADE,
  placa       TEXT NOT NULL UNIQUE,
  marca       TEXT NOT NULL,
  modelo      TEXT NOT NULL,
  anio        INT,
  color       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. Orden de servicio
CREATE TABLE ordenes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number              SERIAL, -- número legible para mostrar al cliente
  vehiculo_id               UUID REFERENCES vehiculos(id),
  receptionist_id           UUID REFERENCES profiles(id),
  fecha_ingreso             TIMESTAMPTZ DEFAULT now(),
  fecha_entrega_estimada    TIMESTAMPTZ,
  estado                    TEXT DEFAULT 'recibido', -- recibido | diagnostico | esperando_aprobacion | en_reparacion | listo | entregado
  observaciones             TEXT,
  diagnosis                 TEXT, -- diagnóstico técnico
  labor_cost                NUMERIC(12,2) DEFAULT 0.00, -- costo de mano de obra
  parts_cost                NUMERIC(12,2) DEFAULT 0.00, -- costo de repuestos
  aprobado_por_cliente      BOOLEAN DEFAULT false,
  notificacion_enviada      BOOLEAN DEFAULT false,
  is_paid                   BOOLEAN DEFAULT false,
  internal_notes            TEXT, -- notas internas de uso del taller
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- 5. Ítems de cada orden (servicios individuales con precio)
CREATE TABLE items_orden (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id      UUID REFERENCES ordenes(id) ON DELETE CASCADE,
  descripcion   TEXT NOT NULL,
  precio        NUMERIC(10,2) NOT NULL DEFAULT 0,
  aprobado      BOOLEAN DEFAULT false
);

-- 6. Fotos del vehículo (ingreso, proceso, entrega)
CREATE TABLE fotos_orden (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id    UUID REFERENCES ordenes(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  tipo        TEXT DEFAULT 'ingreso'  -- ingreso | proceso | entrega
);

-- 7. Asignación de mecánicos a órdenes
CREATE TABLE order_mechanics (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  orden_id                UUID REFERENCES ordenes(id) ON DELETE CASCADE NOT NULL,
  mechanic_id             UUID REFERENCES profiles(id) NOT NULL,
  commission_percentage   NUMERIC(5,2) NOT NULL, -- snapshot del % en el momento de asignación
  commission_amount       NUMERIC(12,2) DEFAULT 0.00, -- calculado al entregar
  is_commission_paid      BOOLEAN DEFAULT false,
  assigned_at             TIMESTAMPTZ DEFAULT now(),
  UNIQUE(orden_id, mechanic_id)
);

-- 8. Historial de estados de orden
CREATE TABLE order_status_history (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  orden_id        UUID REFERENCES ordenes(id) ON DELETE CASCADE NOT NULL,
  changed_by      UUID REFERENCES profiles(id) NOT NULL,
  previous_status TEXT,
  new_status      TEXT NOT NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 9. Períodos de corte de comisiones
CREATE TABLE commission_periods (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mechanic_id         UUID REFERENCES profiles(id) NOT NULL,
  period_start        TIMESTAMPTZ NOT NULL,
  period_end          TIMESTAMPTZ NOT NULL,
  total_labor_value   NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_commission    NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  is_paid             BOOLEAN DEFAULT false,
  paid_at             TIMESTAMPTZ,
  paid_by             UUID REFERENCES profiles(id),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimizar búsquedas
CREATE INDEX vehiculos_placa_idx ON vehiculos (LOWER(placa));
CREATE INDEX clientes_nombre_idx ON clientes (LOWER(nombre));
CREATE INDEX ordenes_vehiculo_idx ON ordenes (vehiculo_id);
CREATE INDEX ordenes_estado_idx ON ordenes (estado);
CREATE INDEX order_mechanics_orden_idx ON order_mechanics (orden_id);
CREATE INDEX order_status_history_orden_idx ON order_status_history (orden_id);

-- ─── Triggers e Integridad de la Base de Datos ──────────────────────────

-- A. Trigger para updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER ordenes_updated_at
  BEFORE UPDATE ON ordenes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- B. Trigger: crear perfil automáticamente al registrar usuario en Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sin nombre'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'mechanic')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- C. Trigger: registrar automáticamente cada cambio de estado en ordenes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO order_status_history (orden_id, changed_by, previous_status, new_status)
    VALUES (NEW.id, auth.uid(), OLD.estado, NEW.estado);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER order_status_change_log
  AFTER UPDATE ON ordenes
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- D. Trigger: calcular y registrar comisiones al entregar
CREATE OR REPLACE FUNCTION calculate_commissions_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo ejecutar cuando el estado cambia a 'entregado'
  IF NEW.estado = 'entregado' AND OLD.estado != 'entregado' THEN
    -- Registrar fecha de entrega real
    NEW.fecha_entrega_estimada = COALESCE(NEW.fecha_entrega_estimada, now());
    
    -- Calcular comisión para cada mecánico asignado
    UPDATE order_mechanics
    SET commission_amount = (NEW.labor_cost * commission_percentage / 100)
    WHERE orden_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_commissions
  BEFORE UPDATE ON ordenes
  FOR EACH ROW EXECUTE FUNCTION calculate_commissions_on_delivery();


-- ─── Row Level Security (RLS) ──────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_periods ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de Perfiles
CREATE POLICY "owner_see_all_profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'owner')
);
CREATE POLICY "user_see_own_profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "owner_manage_profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'owner')
);

-- 2. Políticas de Clientes y Vehículos
CREATE POLICY "staff_manage_clientes" ON clientes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'receptionist'))
);
CREATE POLICY "mechanic_see_assigned_clientes" ON clientes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM ordenes o
    JOIN vehiculos v ON v.id = o.vehiculo_id
    JOIN order_mechanics om ON om.orden_id = o.id
    WHERE v.cliente_id = clientes.id AND om.mechanic_id = auth.uid()
  )
);

CREATE POLICY "staff_manage_vehiculos" ON vehiculos FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'receptionist'))
);
CREATE POLICY "mechanic_see_assigned_vehiculos" ON vehiculos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM ordenes o
    JOIN order_mechanics om ON om.orden_id = o.id
    WHERE o.vehiculo_id = vehiculos.id AND om.mechanic_id = auth.uid()
  )
);

-- 3. Políticas de Órdenes, Ítems y Fotos
CREATE POLICY "staff_manage_ordenes" ON ordenes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'receptionist'))
);
CREATE POLICY "mechanic_see_assigned_ordenes" ON ordenes FOR SELECT USING (
  EXISTS (SELECT 1 FROM order_mechanics om WHERE om.orden_id = ordenes.id AND om.mechanic_id = auth.uid())
);
CREATE POLICY "mechanic_update_assigned_ordenes" ON ordenes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM order_mechanics om WHERE om.orden_id = ordenes.id AND om.mechanic_id = auth.uid())
);

CREATE POLICY "staff_manage_items" ON items_orden FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'receptionist'))
);
CREATE POLICY "mechanic_see_assigned_items" ON items_orden FOR SELECT USING (
  EXISTS (SELECT 1 FROM order_mechanics om WHERE om.orden_id = items_orden.orden_id AND om.mechanic_id = auth.uid())
);

CREATE POLICY "staff_manage_fotos" ON fotos_orden FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'receptionist'))
);
CREATE POLICY "mechanic_manage_assigned_fotos" ON fotos_orden FOR ALL USING (
  EXISTS (SELECT 1 FROM order_mechanics om WHERE om.orden_id = fotos_orden.orden_id AND om.mechanic_id = auth.uid())
);

-- 4. Políticas de Mecánicos de la Orden
CREATE POLICY "owner_manage_order_mechanics" ON order_mechanics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'owner')
);
CREATE POLICY "receptionist_assign_mechanics" ON order_mechanics FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'receptionist')
);
CREATE POLICY "mechanic_see_own_assignments" ON order_mechanics FOR SELECT USING (mechanic_id = auth.uid());

-- 5. Políticas de Historial de Estados
CREATE POLICY "staff_see_status_history" ON order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'receptionist'))
);
CREATE POLICY "mechanic_see_assigned_history" ON order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM order_mechanics om WHERE om.orden_id = order_status_history.orden_id AND om.mechanic_id = auth.uid())
);
CREATE POLICY "authenticated_insert_history" ON order_status_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Políticas de Períodos de Comisión
CREATE POLICY "owner_manage_commission_periods" ON commission_periods FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'owner')
);

-- 7. Políticas de Acceso Público (Anónimo) para el Portal del Cliente
CREATE POLICY "Lectura anónima de clientes" ON clientes FOR SELECT TO anon USING (true);
CREATE POLICY "Lectura anónima de vehiculos" ON vehiculos FOR SELECT TO anon USING (true);
CREATE POLICY "Lectura anónima de orden" ON ordenes FOR SELECT TO anon USING (true);
CREATE POLICY "Lectura anónima de items" ON items_orden FOR SELECT TO anon USING (true);
CREATE POLICY "Lectura anónima de fotos" ON fotos_orden FOR SELECT TO anon USING (true);
CREATE POLICY "Aprobación anónima de ordenes" ON ordenes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Aprobación anónima de items" ON items_orden FOR UPDATE TO anon USING (true) WITH CHECK (true);


-- ─── Vistas Útiles para la Aplicación ─────────────────────────────────────

-- Vista 1: Órdenes con información completa
CREATE OR REPLACE VIEW orders_full_view AS
SELECT
  o.id,
  o.order_number,
  o.estado,
  o.labor_cost,
  o.parts_cost,
  (o.labor_cost + o.parts_cost) AS total_cost,
  o.observaciones,
  o.diagnosis,
  o.mileage,
  o.fecha_ingreso,
  o.fecha_entrega_estimada,
  o.aprobado_por_cliente,
  o.notificacion_enviada,
  o.is_paid,
  o.internal_notes,
  o.created_at,
  o.updated_at,
  v.placa,
  v.marca,
  v.modelo,
  v.anio,
  v.color,
  c.nombre AS owner_name,
  c.telefono AS owner_phone,
  p.full_name AS receptionist_name,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', pr.id,
        'name', pr.full_name,
        'commission_percentage', om.commission_percentage,
        'commission_amount', om.commission_amount,
        'is_commission_paid', om.is_commission_paid
      )
    ) FILTER (WHERE pr.id IS NOT NULL),
    '[]'
  ) AS mechanics
FROM ordenes o
JOIN vehiculos v ON v.id = o.vehiculo_id
JOIN clientes c ON c.id = v.cliente_id
LEFT JOIN profiles p ON p.id = o.receptionist_id
LEFT JOIN order_mechanics om ON om.orden_id = o.id
LEFT JOIN profiles pr ON pr.id = om.mechanic_id
GROUP BY o.id, v.id, c.id, p.id;

-- Vista 2: Estadísticas del día para el Dashboard
CREATE OR REPLACE VIEW dashboard_today AS
SELECT
  COUNT(*) FILTER (WHERE estado != 'entregado') AS active_orders,
  COUNT(*) FILTER (WHERE estado = 'recibido' AND created_at::DATE = CURRENT_DATE) AS received_today,
  COUNT(*) FILTER (WHERE estado = 'listo') AS ready_for_delivery,
  COUNT(*) FILTER (WHERE estado = 'entregado' AND fecha_entrega_estimada::DATE = CURRENT_DATE) AS delivered_today,
  COALESCE(SUM(labor_cost) FILTER (WHERE estado = 'entregado' AND fecha_entrega_estimada::DATE = CURRENT_DATE), 0) AS revenue_today,
  COALESCE(SUM(labor_cost) FILTER (WHERE estado != 'entregado'), 0) AS pending_revenue
FROM ordenes;

-- Vista 3: Comisiones pendientes por mecánico
CREATE OR REPLACE VIEW pending_commissions AS
SELECT
  p.id AS mechanic_id,
  p.full_name AS mechanic_name,
  COUNT(om.id) AS pending_orders,
  COALESCE(SUM(om.commission_amount), 0) AS total_pending,
  MIN(o.created_at) AS oldest_order_date
FROM profiles p
JOIN order_mechanics om ON om.mechanic_id = p.id
JOIN ordenes o ON o.id = om.orden_id
WHERE om.is_commission_paid = false
AND o.estado = 'entregado'
GROUP BY p.id, p.full_name;

-- Habilitar realtime para actualizaciones en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE ordenes;
ALTER PUBLICATION supabase_realtime ADD TABLE order_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE order_mechanics;
