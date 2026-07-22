-- =========================================================================
-- MIGRACIÓN V3: STORAGE BUCKET PARA FOTOS DE INGRESO
-- =========================================================================

-- 1. Crear el bucket público para las fotos de las órdenes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('orden_fotos', 'orden_fotos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Seguridad (RLS) para el Storage
-- Permitir lectura pública de las fotos
CREATE POLICY "Fotos Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'orden_fotos');

-- Permitir a usuarios autenticados subir fotos
CREATE POLICY "Fotos Auth Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'orden_fotos');

-- Permitir a usuarios autenticados eliminar fotos
CREATE POLICY "Fotos Auth Delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'orden_fotos');
