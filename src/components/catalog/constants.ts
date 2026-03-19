import {
  Wrench, Car, HardHat, Cpu, Package, Fuel, Tractor, Activity,
} from "lucide-react";

export const LOCATIONS = [
  "Bjerka",
  "Fauske",
  "KBV, Stasjon: Kobbvatnet",
  "KOL, Stasjon: Kolsvik",
  "MAR, Stasjon: Marka",
  "NMS, Stasjon: Namsskogan",
  "NRØ, Stasjon: Nedre Røssåga",
  "RAA, Stasjon: Rana",
  "SAL, Stasjon: Salten",
  "SVN, Stasjon: Svartisen",
  "TRO, Stasjon: Trofors",
  "Annet",
];

export const CATEGORY_META = [
  { value: "bensinverktoy", label: "Bensin-/motorverktøy", icon: Fuel },
  { value: "el_verktoy", label: "El.verktøy", icon: Wrench },
  { value: "kjøretøy", label: "Kjøretøy", icon: Car },
  { value: "maskin", label: "Maskin", icon: Cpu },
  { value: "traktor_utstyr", label: "Traktor m/utstyr", icon: Tractor },
  { value: "maleinstrument", label: "Måleinstrument", icon: Activity },
  { value: "utstyr", label: "Utstyr", icon: HardHat },
  { value: "annet", label: "Annet", icon: Package },
];
