-- Script Idempotente de Migración SaaS (Multi-Tenant por taller_id)

-- 1. Crear tabla de talleres
CREATE TABLE IF NOT EXISTS public.talleres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_negocio TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS en talleres
ALTER TABLE public.talleres ENABLE ROW LEVEL SECURITY;

-- 2. Asignar/Crear Taller por Defecto para la data existente y agregar columnas
DO $$ 
DECLARE
  default_taller_id UUID;
BEGIN
  -- Obtener taller por defecto o crearlo si no existe
  SELECT id INTO default_taller_id FROM public.talleres LIMIT 1;

  IF default_taller_id IS NULL THEN
    INSERT INTO public.talleres (nombre_negocio) 
    VALUES ('Taller Principal') 
    RETURNING id INTO default_taller_id;
  END IF;

  -- 3. Añadir columna taller_id a todas las tablas de negocio
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS taller_id UUID REFERENCES public.talleres(id);
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS taller_id UUID REFERENCES public.talleres(id);
  ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS taller_id UUID REFERENCES public.talleres(id);
  ALTER TABLE public.ordenes ADD COLUMN IF NOT EXISTS taller_id UUID REFERENCES public.talleres(id);
  ALTER TABLE public.items_orden ADD COLUMN IF NOT EXISTS taller_id UUID REFERENCES public.talleres(id);
  ALTER TABLE public.fotos_orden ADD COLUMN IF NOT EXISTS taller_id UUID REFERENCES public.talleres(id);
  ALTER TABLE public.order_mechanics ADD COLUMN IF NOT EXISTS taller_id UUID REFERENCES public.talleres(id);
  ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS taller_id UUID REFERENCES public.talleres(id);

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'citas') THEN
    ALTER TABLE public.citas ADD COLUMN IF NOT EXISTS taller_id UUID REFERENCES public.talleres(id);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'encuestas_satisfaccion') THEN
    ALTER TABLE public.encuestas_satisfaccion ADD COLUMN IF NOT EXISTS taller_id UUID REFERENCES public.talleres(id);
  END IF;

  -- 4. Actualizar registros existentes que no tengan taller_id
  UPDATE public.profiles SET taller_id = default_taller_id WHERE taller_id IS NULL;
  UPDATE public.clientes SET taller_id = default_taller_id WHERE taller_id IS NULL;
  UPDATE public.vehiculos SET taller_id = default_taller_id WHERE taller_id IS NULL;
  UPDATE public.ordenes SET taller_id = default_taller_id WHERE taller_id IS NULL;
  UPDATE public.items_orden SET taller_id = default_taller_id WHERE taller_id IS NULL;
  UPDATE public.fotos_orden SET taller_id = default_taller_id WHERE taller_id IS NULL;
  UPDATE public.order_mechanics SET taller_id = default_taller_id WHERE taller_id IS NULL;
  UPDATE public.order_status_history SET taller_id = default_taller_id WHERE taller_id IS NULL;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'citas') THEN
    UPDATE public.citas SET taller_id = default_taller_id WHERE taller_id IS NULL;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'encuestas_satisfaccion') THEN
    UPDATE public.encuestas_satisfaccion SET taller_id = default_taller_id WHERE taller_id IS NULL;
  END IF;

  -- 5. Hacer la columna NOT NULL
  ALTER TABLE public.profiles ALTER COLUMN taller_id SET NOT NULL;
  ALTER TABLE public.clientes ALTER COLUMN taller_id SET NOT NULL;
  ALTER TABLE public.vehiculos ALTER COLUMN taller_id SET NOT NULL;
  ALTER TABLE public.ordenes ALTER COLUMN taller_id SET NOT NULL;
  ALTER TABLE public.items_orden ALTER COLUMN taller_id SET NOT NULL;
  ALTER TABLE public.fotos_orden ALTER COLUMN taller_id SET NOT NULL;
  ALTER TABLE public.order_mechanics ALTER COLUMN taller_id SET NOT NULL;
  ALTER TABLE public.order_status_history ALTER COLUMN taller_id SET NOT NULL;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'citas') THEN
    ALTER TABLE public.citas ALTER COLUMN taller_id SET NOT NULL;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'encuestas_satisfaccion') THEN
    ALTER TABLE public.encuestas_satisfaccion ALTER COLUMN taller_id SET NOT NULL;
  END IF;

END $$;

-- 6. Crear/reemplazar función para obtener taller_id
CREATE OR REPLACE FUNCTION public.get_taller_id() RETURNS UUID AS $func$
  SELECT taller_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$func$ LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public;

-- 7. Establecer DEFAULT para futuras inserciones
ALTER TABLE public.profiles ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();
ALTER TABLE public.clientes ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();
ALTER TABLE public.vehiculos ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();
ALTER TABLE public.ordenes ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();
ALTER TABLE public.items_orden ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();
ALTER TABLE public.fotos_orden ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();
ALTER TABLE public.order_mechanics ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();
ALTER TABLE public.order_status_history ALTER COLUMN taller_id SET DEFAULT public.get_taller_id();

-- 8. Limpiar políticas antiguas e idempotencia (DROP POLICY IF EXISTS)

-- TALLERES
DROP POLICY IF EXISTS "Dueños ven su propio taller" ON public.talleres;
DROP POLICY IF EXISTS "Permitir crear taller" ON public.talleres;
DROP POLICY IF EXISTS "Dueños editan su taller" ON public.talleres;

-- PROFILES
DROP POLICY IF EXISTS "owner_see_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "user_see_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "owner_manage_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Ver perfiles del mismo taller" ON public.profiles;
DROP POLICY IF EXISTS "Insertar propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Dueños pueden actualizar perfiles" ON public.profiles;

-- CLIENTES
DROP POLICY IF EXISTS "staff_manage_clientes" ON public.clientes;
DROP POLICY IF EXISTS "mechanic_see_assigned_clientes" ON public.clientes;
DROP POLICY IF EXISTS "Lectura anónima de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.clientes;

-- VEHICULOS
DROP POLICY IF EXISTS "staff_manage_vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS "mechanic_see_assigned_vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS "Lectura anónima de vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.vehiculos;

-- ORDENES
DROP POLICY IF EXISTS "staff_manage_ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "mechanic_see_assigned_ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "mechanic_update_assigned_ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "Lectura anónima de orden" ON public.ordenes;
DROP POLICY IF EXISTS "Aprobación anónima de ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.ordenes;

-- ITEMS_ORDEN
DROP POLICY IF EXISTS "staff_manage_items" ON public.items_orden;
DROP POLICY IF EXISTS "mechanic_see_assigned_items" ON public.items_orden;
DROP POLICY IF EXISTS "Lectura anónima de items" ON public.items_orden;
DROP POLICY IF EXISTS "Aprobación anónima de items" ON public.items_orden;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.items_orden;

-- FOTOS_ORDEN
DROP POLICY IF EXISTS "staff_manage_fotos" ON public.fotos_orden;
DROP POLICY IF EXISTS "mechanic_manage_assigned_fotos" ON public.fotos_orden;
DROP POLICY IF EXISTS "Lectura anónima de fotos" ON public.fotos_orden;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.fotos_orden;

-- ORDER_MECHANICS
DROP POLICY IF EXISTS "owner_manage_order_mechanics" ON public.order_mechanics;
DROP POLICY IF EXISTS "receptionist_assign_mechanics" ON public.order_mechanics;
DROP POLICY IF EXISTS "mechanic_see_own_assignments" ON public.order_mechanics;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.order_mechanics;

-- ORDER_STATUS_HISTORY
DROP POLICY IF EXISTS "staff_see_status_history" ON public.order_status_history;
DROP POLICY IF EXISTS "mechanic_see_assigned_history" ON public.order_status_history;
DROP POLICY IF EXISTS "authenticated_insert_history" ON public.order_status_history;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.order_status_history;

-- 9. Crear Nuevas Políticas RLS Multi-Tenant

-- TALLERES
CREATE POLICY "Dueños ven su propio taller" ON public.talleres FOR SELECT USING (id = public.get_taller_id());
CREATE POLICY "Permitir crear taller" ON public.talleres FOR INSERT WITH CHECK (true);
CREATE POLICY "Dueños editan su taller" ON public.talleres FOR UPDATE USING (id = public.get_taller_id());

-- PROFILES
CREATE POLICY "Ver perfiles del mismo taller" ON public.profiles FOR SELECT USING (taller_id = public.get_taller_id() OR id = auth.uid());
CREATE POLICY "Insertar propio perfil" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Dueños pueden actualizar perfiles" ON public.profiles FOR UPDATE USING (taller_id = public.get_taller_id() AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner');

-- TABLAS DE NEGOCIO
CREATE POLICY "Tenant Isolation" ON public.clientes FOR ALL USING (taller_id = public.get_taller_id());
CREATE POLICY "Tenant Isolation" ON public.vehiculos FOR ALL USING (taller_id = public.get_taller_id());
CREATE POLICY "Tenant Isolation" ON public.ordenes FOR ALL USING (taller_id = public.get_taller_id());
CREATE POLICY "Tenant Isolation" ON public.items_orden FOR ALL USING (taller_id = public.get_taller_id());
CREATE POLICY "Tenant Isolation" ON public.fotos_orden FOR ALL USING (taller_id = public.get_taller_id());
CREATE POLICY "Tenant Isolation" ON public.order_mechanics FOR ALL USING (taller_id = public.get_taller_id());
CREATE POLICY "Tenant Isolation" ON public.order_status_history FOR ALL USING (taller_id = public.get_taller_id());

-- CITAS Y ENCUESTAS (en caso de existir las tablas)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'citas') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Tenant Isolation" ON public.citas';
    EXECUTE 'CREATE POLICY "Tenant Isolation" ON public.citas FOR ALL USING (taller_id = public.get_taller_id())';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'encuestas_satisfaccion') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.encuestas_satisfaccion';
    EXECUTE 'DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.encuestas_satisfaccion';
    EXECUTE 'DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.encuestas_satisfaccion';
    EXECUTE 'CREATE POLICY "Tenant Isolation Select" ON public.encuestas_satisfaccion FOR SELECT USING (taller_id = public.get_taller_id())';
    EXECUTE 'CREATE POLICY "Tenant Isolation Insert" ON public.encuestas_satisfaccion FOR INSERT WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Tenant Isolation Update" ON public.encuestas_satisfaccion FOR UPDATE USING (taller_id = public.get_taller_id())';
  END IF;
END $$;

-- 10. Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
