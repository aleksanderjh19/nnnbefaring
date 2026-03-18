
-- Table for shared mast inspection checks
CREATE TABLE public.inspection_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id TEXT NOT NULL,
  mast_number INTEGER NOT NULL,
  year INTEGER NOT NULL DEFAULT extract(year from now()),
  checked BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (line_id, mast_number, year)
);

-- Enable RLS
ALTER TABLE public.inspection_checks ENABLE ROW LEVEL SECURITY;

-- Everyone can read (no login required)
CREATE POLICY "Anyone can read inspection checks"
  ON public.inspection_checks FOR SELECT
  USING (true);

-- Everyone can insert (no login required for shared use)
CREATE POLICY "Anyone can insert inspection checks"
  ON public.inspection_checks FOR INSERT
  WITH CHECK (true);

-- Everyone can update
CREATE POLICY "Anyone can update inspection checks"
  ON public.inspection_checks FOR UPDATE
  USING (true);

-- Everyone can delete
CREATE POLICY "Anyone can delete inspection checks"
  ON public.inspection_checks FOR DELETE
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_inspection_checks_line_year ON public.inspection_checks (line_id, year);
