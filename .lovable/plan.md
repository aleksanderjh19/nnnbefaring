## SF6 fremvisning – aktiv (oransj) vs fullført (grønn) bryter

### Ny oppførsel

To states på hver bryter-rad i fremvisningen:
- **Aktiv** (oransj bakgrunn): bryteren du sist trykket på – kun én om gangen.
- **Fullført** (grønn bakgrunn): brytere du har trykket på tidligere.

Regler når du trykker på en bryter-rad:
1. Hvis en annen bryter er aktiv fra før → den blir grønn (fullført).
2. Bryteren du nettopp trykket på blir aktiv (oransj).
3. Hvis bryteren allerede var grønn, fjernes den grønne markeringen samtidig som den blir oransj.
4. Trykk på den samme bryteren som allerede er aktiv gjør ingenting (den forblir oransj).

Slik kan montøren jobbe seg gjennom lista én bryter av gangen: aktiv oransj = «denne holder jeg på å legge inn», grønn = «denne er ferdig lagt inn i systemet».

### Teknisk

I `src/pages/Sf6Round.tsx`:
- Erstatt `checkedBreakers: Set<string>` med to states: `greenBreakers: Set<string>` og `activeBreaker: string | null`.
- Ny `handleBreakerClick(key)` implementerer reglene over.
- Reset begge når man åpner en ny runde eller lukker fremvisning (samme steder som i dag).
- Rad-klasser:
  - active → `bg-amber-500/25 hover:bg-amber-500/30`
  - green → `bg-green-500/25 hover:bg-green-500/30`
  - annet → `hover:bg-secondary/50`

Ingen DB-endringer, ingen andre filer.
