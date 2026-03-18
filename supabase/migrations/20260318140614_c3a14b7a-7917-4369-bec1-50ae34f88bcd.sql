
-- Employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read employees" ON public.employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert employees" ON public.employees
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees" ON public.employees
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete employees" ON public.employees
  FOR DELETE TO authenticated USING (true);

-- Training records table
CREATE TABLE public.training_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  equipment_name text NOT NULL,
  equipment_type text,
  noise_level_db text,
  vibration_ms2 text,
  trainer_name text NOT NULL,
  trainer_company text,
  confirmation_type text NOT NULL DEFAULT 'practical_and_theoretical',
  photo_urls text[] DEFAULT '{}',
  trainee_signature_url text,
  trainer_signature_url text,
  training_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read training_records" ON public.training_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert training_records" ON public.training_records
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update training_records" ON public.training_records
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete training_records" ON public.training_records
  FOR DELETE TO authenticated USING (true);

-- Storage bucket for training photos and signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('training-files', 'training-files', true);

CREATE POLICY "Authenticated users can upload training files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'training-files');

CREATE POLICY "Anyone can view training files" ON storage.objects
  FOR SELECT USING (bucket_id = 'training-files');

CREATE POLICY "Authenticated users can delete training files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'training-files');
