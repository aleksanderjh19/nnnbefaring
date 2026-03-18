import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Zap, Settings, Pencil, Trash2, Plus, X } from "lucide-react";
import { getMastNumbers } from "@/data/lines";
import { useInspectionState } from "@/hooks/useInspectionState";
import { useLines } from "@/hooks/useLines.tsx";
import { ProgressBar } from "@/components/ProgressBar";
import { useMemo } from "react";

const Home = () => {
  const navigate = useNavigate();
  const { getLineStats, getTotalStats } = useInspectionState();
  const { lines, lineGroups, editMode, setEditMode, removeLine, updateLine, addLine } = useLines();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameField, setRenameField] = useState<"name" | "description">("name");

  // Add line dialog
  const [showAddLine, setShowAddLine] = useState(false);
  const [newLineName, setNewLineName] = useState("");
  const [newLineDesc, setNewLineDesc] = useState("");
  const [newLineGroup, setNewLineGroup] = useState(lineGroups[0]?.name ?? "");
  const [newLineMastStart, setNewLineMastStart] = useState("1");
  const [newLineMastEnd, setNewLineMastEnd] = useState("100");

  const linesWithCounts = useMemo(
    () => lines.map((l) => ({ id: l.id, count: getMastNumbers(l).length })),
    [lines]
  );
  const totalStats = getTotalStats(linesWithCounts);

  const startRename = (id: string, field: "name" | "description", currentValue: string) => {
    setRenamingId(id);
    setRenameField(field);
    setRenameValue(currentValue);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      updateLine(renamingId, { [renameField]: renameValue.trim() });
    }
    setRenamingId(null);
  };

  const handleAddLine = () => {
    if (!newLineName.trim()) return;
    const start = parseInt(newLineMastStart) || 1;
    const end = parseInt(newLineMastEnd) || 100;
    const masts: number[] = [];
    for (let i = start; i <= end; i++) masts.push(i);
    addLine({
      id: newLineName.trim(),
      name: newLineName.trim(),
      description: newLineDesc.trim(),
      group: newLineGroup,
      masts,
    });
    setShowAddLine(false);
    setNewLineName("");
    setNewLineDesc("");
    setNewLineMastStart("1");
    setNewLineMastEnd("100");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">
                Ledningsbefaringer
              </h1>
              <p className="font-body text-xs text-muted-foreground">NNN · 2026</p>
            </div>

            {/* Edit mode toggle */}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex h-10 items-center gap-2 rounded-lg border px-3 font-body text-sm font-medium transition-colors ${
                editMode
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{editMode ? "Avslutt redigering" : "Rediger"}</span>
            </button>
          </div>
          <div className="mt-4">
            <ProgressBar done={totalStats.done} total={totalStats.total} percent={totalStats.percent} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-5">
        {editMode && (
          <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
            <p className="font-body text-sm font-medium text-accent">
              Redigeringsmodus aktiv — du kan endre navn, slette og legge til linjer.
            </p>
          </div>
        )}

        <p className="mb-5 font-body text-sm text-muted-foreground">
          {editMode ? "Klikk på blyant for å endre navn, eller søppelbøtte for å slette." : "Velg en linje for å starte befaring."}
        </p>

        <div className="space-y-6">
          {lineGroups.map((group) => {
            const groupLines = lines.filter((l) => l.group === group.name);
            if (groupLines.length === 0) return null;

            return (
              <section key={group.name}>
                <h2 className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {groupLines.map((line) => {
                    const masts = getMastNumbers(line);
                    const stats = getLineStats(line.id, masts.length);
                    const isRenaming = renamingId === line.id;

                    return (
                      <div
                        key={line.id}
                        className="flex w-full items-center gap-2 rounded-xl border border-border bg-card text-left transition-colors"
                      >
                        <button
                          onClick={() => navigate(`/linje/${line.id}`)}
                          className="tap-highlight-none flex min-w-0 flex-1 items-center gap-4 px-4 py-4 hover:bg-secondary"
                        >
                          <div className="min-w-0 flex-1">
                            {isRenaming ? (
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={commitRename}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitRename();
                                  if (e.key === "Escape") setRenamingId(null);
                                }}
                                className="w-full rounded border border-input bg-background px-2 py-1 font-display text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            ) : (
                              <>
                                <p className="font-display text-sm font-bold text-foreground">
                                  {line.name}
                                </p>
                                <p className="font-body text-xs text-muted-foreground">
                                  {line.description}
                                </p>
                              </>
                            )}
                            {!isRenaming && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-[11px] font-body text-muted-foreground">
                                  <span>{stats.done}/{stats.total} master</span>
                                  <span className="font-semibold text-foreground">{stats.percent}%</span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all duration-300"
                                    style={{ width: `${stats.percent}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          {!editMode && (
                            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                          )}
                        </button>

                        {editMode && !isRenaming && (
                          <div className="flex shrink-0 items-center gap-1 pr-3">
                            <button
                              onClick={() => startRename(line.id, "name", line.name)}
                              title="Endre linjenavn"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => startRename(line.id, "description", line.description)}
                              title="Endre beskrivelse"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <span className="font-body text-[10px] font-bold">Abc</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Slett ${line.name}?`)) removeLine(line.id);
                              }}
                              title="Slett linje"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Add line button */}
        {editMode && (
          <div className="mt-6">
            {!showAddLine ? (
              <button
                onClick={() => setShowAddLine(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 font-body text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                Legg til ny linje
              </button>
            ) : (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-foreground">Ny linje</h3>
                  <button onClick={() => setShowAddLine(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block font-body text-xs text-muted-foreground">Linjenavn</label>
                      <input
                        value={newLineName}
                        onChange={(e) => setNewLineName(e.target.value)}
                        placeholder="F.eks. L0999"
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-body text-xs text-muted-foreground">Gruppe</label>
                      <select
                        value={newLineGroup}
                        onChange={(e) => setNewLineGroup(e.target.value)}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {lineGroups.map((g) => (
                          <option key={g.name} value={g.name}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block font-body text-xs text-muted-foreground">Beskrivelse</label>
                    <input
                      value={newLineDesc}
                      onChange={(e) => setNewLineDesc(e.target.value)}
                      placeholder="F.eks. Sted A - Sted B"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block font-body text-xs text-muted-foreground">Første mast</label>
                      <input
                        type="number"
                        value={newLineMastStart}
                        onChange={(e) => setNewLineMastStart(e.target.value)}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-body text-xs text-muted-foreground">Siste mast</label>
                      <input
                        type="number"
                        value={newLineMastEnd}
                        onChange={(e) => setNewLineMastEnd(e.target.value)}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddLine}
                    disabled={!newLineName.trim()}
                    className="h-10 w-full rounded-lg bg-primary font-body text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    Legg til
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
