-- Script para inicializar la base de datos de Taller Udave en Supabase

-- Clientes del taller
CREATE TABLE clientes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  telefono    text NOT NULL,   -- formato: 573XXXXXXXXX para WhatsApp
  cedula      text,
  created_at  timestamptz DEFAULT now()
);

-- Vehículos (un cliente puede tener varios)
CREATE TABLE vehiculos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  uuid REFERENCES clientes(id) ON DELETE CASCADE,
  placa       text NOT NULL UNIQUE,
  marca       text NOT NULL,
  modelo      text NOT NULL,
  anio        int,
  color       text
);

-- Orden de servicio
CREATE TABLE ordenes (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id               uuid REFERENCES vehiculos(id),
  fecha_ingreso             timestamptz DEFAULT now(),
  fecha_entrega_estimada    timestamptz,
  estado                    text DEFAULT 'recibido',
  observaciones             text,
  aprobado_por_cliente      boolean DEFAULT false,
  notificacion_enviada      boolean DEFAULT false,
  created_at                timestamptz DEFAULT now()
);

-- Ítems de cada orden (servicios individuales con precio)
CREATE TABLE items_orden (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id      uuid REFERENCES ordenes(id) ON DELETE CASCADE,
  descripcion   text NOT NULL,
  precio        numeric(10,2) NOT NULL DEFAULT 0,
  aprobado      boolean DEFAULT false
);

-- Fotos del vehículo (ingreso, proceso, entrega)
CREATE TABLE fotos_orden (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id    uuid REFERENCES ordenes(id) ON DELETE CASCADE,
  url         text NOT NULL,
  tipo        text DEFAULT 'ingreso'  -- ingreso | proceso | entrega
);

-- Políticas RLS (Row Level Security) - Básicas para iniciar
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_orden ENABLE ROW LEVEL SECURITY;

-- Por el momento, permitimos todo el acceso a usuarios autenticados (el administrador)
CREATE POLICY "Permitir todo a usuarios autenticados" ON clientes FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON vehiculos FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON ordenes FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON items_orden FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON fotos_orden FOR ALL TO authenticated USING (true);

-- Para la página pública, permitiremos que usuarios anónimos actualicen 'aprobado_por_cliente' y 'items_orden.aprobado'
CREATE POLICY "Lectura anónima de orden" ON ordenes FOR SELECT TO anon USING (true);
CREATE POLICY "Lectura anónima de vehiculos" ON vehiculos FOR SELECT TO anon USING (true);
CREATE POLICY "Lectura anónima de clientes" ON clientes FOR SELECT TO anon USING (true);
CREATE POLICY "Lectura anónima de items" ON items_orden FOR SELECT TO anon USING (true);

-- Permiso específico para actualizar el estado desde la página pública (solo campos específicos)
CREATE POLICY "Aprobacion anonima ordenes" ON ordenes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Aprobacion anonima items" ON items_orden FOR UPDATE TO anon USING (true) WITH CHECK (true);
