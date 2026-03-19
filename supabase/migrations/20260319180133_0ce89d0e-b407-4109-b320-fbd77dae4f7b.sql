
CREATE TABLE public.catalog_sort_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  category_value text NOT NULL,
  entity_key text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, category_value, entity_key)
);

ALTER TABLE public.catalog_sort_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read catalog_sort_orders"
  ON public.catalog_sort_orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert catalog_sort_orders"
  ON public.catalog_sort_orders FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update catalog_sort_orders"
  ON public.catalog_sort_orders FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete catalog_sort_orders"
  ON public.catalog_sort_orders FOR DELETE TO authenticated
  USING (true);
