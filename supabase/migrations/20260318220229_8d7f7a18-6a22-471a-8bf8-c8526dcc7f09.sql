
-- Step 1: Create role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 2: Tighten RLS on employees table
DROP POLICY IF EXISTS "Anyone can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Anyone can update employees" ON public.employees;
DROP POLICY IF EXISTS "Anyone can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Anyone can read employees" ON public.employees;

CREATE POLICY "Authenticated can read employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update employees" ON public.employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete employees" ON public.employees FOR DELETE TO authenticated USING (true);

-- Step 3: Tighten RLS on training_records table
DROP POLICY IF EXISTS "Anyone can insert training_records" ON public.training_records;
DROP POLICY IF EXISTS "Anyone can update training_records" ON public.training_records;
DROP POLICY IF EXISTS "Anyone can delete training_records" ON public.training_records;
DROP POLICY IF EXISTS "Anyone can read training_records" ON public.training_records;

CREATE POLICY "Authenticated can read training_records" ON public.training_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert training_records" ON public.training_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update training_records" ON public.training_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete training_records" ON public.training_records FOR DELETE TO authenticated USING (true);

-- Step 4: Tighten RLS on equipment_catalog table
DROP POLICY IF EXISTS "Anyone can insert equipment_catalog" ON public.equipment_catalog;
DROP POLICY IF EXISTS "Anyone can update equipment_catalog" ON public.equipment_catalog;
DROP POLICY IF EXISTS "Anyone can delete equipment_catalog" ON public.equipment_catalog;
DROP POLICY IF EXISTS "Anyone can read equipment_catalog" ON public.equipment_catalog;

CREATE POLICY "Authenticated can read equipment_catalog" ON public.equipment_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert equipment_catalog" ON public.equipment_catalog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update equipment_catalog" ON public.equipment_catalog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete equipment_catalog" ON public.equipment_catalog FOR DELETE TO authenticated USING (true);

-- Step 5: Tighten RLS on inspection_checks table
DROP POLICY IF EXISTS "Anyone can insert inspection checks" ON public.inspection_checks;
DROP POLICY IF EXISTS "Anyone can update inspection checks" ON public.inspection_checks;
DROP POLICY IF EXISTS "Anyone can delete inspection checks" ON public.inspection_checks;
DROP POLICY IF EXISTS "Anyone can read inspection checks" ON public.inspection_checks;

CREATE POLICY "Authenticated can read inspection_checks" ON public.inspection_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert inspection_checks" ON public.inspection_checks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update inspection_checks" ON public.inspection_checks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete inspection_checks" ON public.inspection_checks FOR DELETE TO authenticated USING (true);

-- Step 6: Tighten storage policies
DROP POLICY IF EXISTS "Anyone can view training files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload training files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update training files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete training files" ON storage.objects;

CREATE POLICY "Auth can view training files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'training-files');
CREATE POLICY "Auth can upload training files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'training-files');
CREATE POLICY "Auth can update training files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'training-files');
CREATE POLICY "Auth can delete training files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'training-files');
