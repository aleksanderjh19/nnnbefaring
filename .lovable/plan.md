

## Plan: Gjør all tekst på Avfallshåndtering-siden redigerbar via admin-UI

### Hva
Legge til en inline-redigeringsmodus for admin-brukere, slik at alle tekster (kategorinavn, beskrivelser, lokasjoner, sideoverskrifter) kan endres direkte på siden og lagres i databasen.

### Hvordan

**1. Opprett databasetabell `waste_categories`**
- Kolonner: `id` (text, PK), `label`, `description`, `location`, `color`, `icon_name`, `sort_order`
- Seed med dagens hardkodede verdier
- RLS: alle autentiserte kan lese, kun admin kan oppdatere
- Opprett også en `waste_page_settings`-tabell for sideoverskrift og undertekst (nøkkel/verdi)

**2. Oppdater `WasteManagement.tsx`**
- Hent kategorier fra `waste_categories`-tabellen i stedet for hardkodet array
- Hent sideinnstillinger fra `waste_page_settings`
- Fall tilbake til hardkodede verdier hvis tabellen er tom
- For admin-brukere: vis en «Rediger»-knapp som aktiverer redigeringsmodus
- I redigeringsmodus: gjør alle tekstfelt til `<Input>`/`<Textarea>` med inline lagring
- Lagre-knapp som oppdaterer databasen og avslutter redigeringsmodus

**3. Tekniske detaljer**
- Ikon-mapping: lagre ikonnavnet som streng (`Trash2`, `Package` etc.) og map til Lucide-komponent
- Rekkefølge styres av `sort_order`-kolonne
- Farger lagres som Tailwind-klasser (f.eks. `bg-gray-600`)

### Filendringer
| Fil | Endring |
|-----|---------|
| Migration (SQL) | Opprett `waste_categories` + `waste_page_settings` med seed-data og RLS |
| `src/pages/WasteManagement.tsx` | Hent data fra DB, legg til redigeringsmodus for admin |

