ALTER TABLE public.equipment_catalog 
  ADD COLUMN location text,
  ADD COLUMN noise_level_db text,
  ADD COLUMN vibration_ms2 text,
  ADD COLUMN description text;