
CREATE TABLE voltage_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_name text NOT NULL,
  voltage_level text NOT NULL,
  secondary_voltage numeric NOT NULL DEFAULT 63.50,
  date date NOT NULL DEFAULT CURRENT_DATE,
  sign_names text DEFAULT '',
  ref_instrument jsonb NOT NULL DEFAULT '{}',
  meas_instrument jsonb NOT NULL DEFAULT '{}',
  transformers jsonb NOT NULL DEFAULT '[]',
  measurements jsonb NOT NULL DEFAULT '{}',
  comments text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE voltage_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read voltage_rounds"
ON voltage_rounds FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert voltage_rounds"
ON voltage_rounds FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update voltage_rounds"
ON voltage_rounds FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete voltage_rounds"
ON voltage_rounds FOR DELETE TO authenticated
USING (true);
