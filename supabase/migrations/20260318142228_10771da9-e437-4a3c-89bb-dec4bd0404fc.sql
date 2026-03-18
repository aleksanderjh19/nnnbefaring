
-- Drop old authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can read employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can delete employees" ON public.employees;

DROP POLICY IF EXISTS "Authenticated users can read training_records" ON public.training_records;
DROP POLICY IF EXISTS "Authenticated users can insert training_records" ON public.training_records;
DROP POLICY IF EXISTS "Authenticated users can update training_records" ON public.training_records;
DROP POLICY IF EXISTS "Authenticated users can delete training_records" ON public.training_records;

-- Create public policies for employees
CREATE POLICY "Anyone can read employees" ON public.employees FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert employees" ON public.employees FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update employees" ON public.employees FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete employees" ON public.employees FOR DELETE TO public USING (true);

-- Create public policies for training_records
CREATE POLICY "Anyone can read training_records" ON public.training_records FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert training_records" ON public.training_records FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update training_records" ON public.training_records FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete training_records" ON public.training_records FOR DELETE TO public USING (true);
