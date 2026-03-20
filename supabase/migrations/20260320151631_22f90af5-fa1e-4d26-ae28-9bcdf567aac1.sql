
-- Table for editable waste categories
CREATE TABLE public.waste_categories (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'bg-gray-600',
  icon_name text NOT NULL DEFAULT 'Trash2',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.waste_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read waste_categories"
  ON public.waste_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage waste_categories"
  ON public.waste_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed with current hardcoded values
INSERT INTO public.waste_categories (id, label, description, location, color, icon_name, sort_order) VALUES
  ('restavfall', 'Restavfall', 'Alt som ikke kan sorteres i andre kategorier', 'Container ved hovedinngang', 'bg-gray-600', 'Trash2', 0),
  ('papp', 'Papp og papir', 'Pappesker, papir, aviser (brett sammen pappen)', 'Presscontainer bak verksted', 'bg-amber-700', 'Package', 1),
  ('metall', 'Metall', 'Skrapjern, aluminiumsprofiler, blikk, kabler', 'Metallcontainer ved lager', 'bg-slate-500', 'Wrench', 2),
  ('batterier', 'Batterier', 'Alle typer batterier (merket beholder)', 'Innsamlingsboks i resepsjonen', 'bg-yellow-600', 'Battery', 3),
  ('ee_avfall', 'EE-avfall', 'Elektronikk, kabler, lyspærer, småelektrisk', 'EE-pall ved teknisk rom', 'bg-emerald-700', 'Zap', 4),
  ('plast', 'Plast', 'Ren plastemballasje, folie, plastbeholdere', 'Plastcontainer ved lager', 'bg-blue-600', 'Recycle', 5);

-- Key/value table for page-level text
CREATE TABLE public.waste_page_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);

ALTER TABLE public.waste_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read waste_page_settings"
  ON public.waste_page_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage waste_page_settings"
  ON public.waste_page_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed page settings
INSERT INTO public.waste_page_settings (key, value) VALUES
  ('page_title', 'Avfallshåndtering Bjerka'),
  ('page_subtitle', 'Sorteringsoversikt og varsling om tømming'),
  ('guide_heading', 'Sorteringsguide'),
  ('pickup_heading', 'Meld behov for tømming'),
  ('pickup_description', 'Velg hvilke avfallsdunker som er fulle og trenger henting');
