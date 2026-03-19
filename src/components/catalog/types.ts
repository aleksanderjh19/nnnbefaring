export interface CatalogRow {
  id: string;
  category_value: string;
  category_label: string;
  equipment_name: string;
  brand: string | null;
  type: string | null;
  image_url: string | null;
  location: string | null;
  noise_level_db: string | null;
  vibration_ms2: string | null;
  description: string | null;
}

export interface GroupedEquipment {
  equipment_name: string;
  brands: Map<string, string[]>;
  rows: CatalogRow[];
}

export interface CategoryMeta {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
}
