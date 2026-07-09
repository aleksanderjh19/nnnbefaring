import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft,
  Battery,
  Package,
  Wrench,
  Trash2,
  Recycle,
  Zap,
  Send,
  Settings,
  MapPin,
  CheckCircle2,
  Plus,
  X,
  Pencil,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trash2, Package, Wrench, Battery, Zap, Recycle,
};

// Convert Tailwind bg classes to hex colors for inline styles (avoids purging)
const BG_COLOR_MAP: Record<string, string> = {
  "bg-gray-600": "#4b5563",
  "bg-amber-700": "#b45309",
  "bg-slate-500": "#64748b",
  "bg-yellow-600": "#ca8a04",
  "bg-emerald-700": "#047857",
  "bg-blue-600": "#2563eb",
};

const getBgColor = (twClass: string) => BG_COLOR_MAP[twClass] || "#6b7280";

interface WasteCategoryRow {
  id: string;
  label: string;
  description: string;
  location: string;
  color: string;
  icon_name: string;
  sort_order: number;
}

interface PageSettings {
  page_title: string;
  page_subtitle: string;
  guide_heading: string;
  pickup_heading: string;
  pickup_description: string;
}

const DEFAULT_SETTINGS: PageSettings = {
  page_title: "Avfallshåndtering Bjerka",
  page_subtitle: "Sorteringsoversikt og varsling om tømming",
  guide_heading: "Sorteringsguide",
  pickup_heading: "Meld behov for tømming",
  pickup_description: "Velg hvilke avfallsdunker som er fulle og trenger henting",
};

interface RecipientRow {
  id: string;
  waste_category: string;
  email: string;
}

export default function WasteManagement() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Data from DB
  const [categories, setCategories] = useState<WasteCategoryRow[]>([]);
  const [settings, setSettings] = useState<PageSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editCategories, setEditCategories] = useState<WasteCategoryRow[]>([]);
  const [editSettings, setEditSettings] = useState<PageSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  // Pickup form
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Admin recipients
  const [showSettings, setShowSettings] = useState(false);
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [settingsCategory, setSettingsCategory] = useState<string>("");

  const fetchData = useCallback(async () => {
    const [catRes, settRes] = await Promise.all([
      supabase.from("waste_categories").select("*").order("sort_order"),
      supabase.from("waste_page_settings").select("*"),
    ]);
    if (catRes.data && catRes.data.length > 0) {
      setCategories(catRes.data as WasteCategoryRow[]);
      if (!settingsCategory) setSettingsCategory(catRes.data[0].id);
    }
    if (settRes.data) {
      const map: Record<string, string> = {};
      (settRes.data as { key: string; value: string }[]).forEach((r) => (map[r.key] = r.value));
      setSettings({ ...DEFAULT_SETTINGS, ...map } as PageSettings);
    }
    setLoading(false);
  }, [settingsCategory]);

  useEffect(() => {
    document.title = "Avfallshåndtering – NNHH Verktøy";
    fetchData();
  }, [fetchData]);

  // Edit mode helpers
  const startEditing = () => {
    setEditCategories(JSON.parse(JSON.stringify(categories)));
    setEditSettings({ ...settings });
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const saveEdits = async () => {
    setSaving(true);
    try {
      // Update categories
      for (const cat of editCategories) {
        await supabase
          .from("waste_categories")
          .update({
            label: cat.label,
            description: cat.description,
            location: cat.location,
            color: cat.color,
          })
          .eq("id", cat.id);
      }
      // Update page settings
      for (const [key, value] of Object.entries(editSettings)) {
        await supabase
          .from("waste_page_settings")
          .update({ value })
          .eq("key", key);
      }
      setCategories(editCategories);
      setSettings(editSettings);
      setEditing(false);
      toast.success("Endringer lagret");
    } catch {
      toast.error("Kunne ikke lagre endringer");
    } finally {
      setSaving(false);
    }
  };

  const updateCat = (id: string, field: keyof WasteCategoryRow, value: string) => {
    setEditCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Pickup form
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSent(false);
  };

  const handleSend = async () => {
    if (selected.size === 0) {
      toast.error("Velg minst én avfallskategori");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("notify-waste-pickup", {
        body: { categories: Array.from(selected), note: note.trim() || undefined },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Varsel sendt!");
      setSelected(new Set());
      setNote("");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke sende varsel");
    } finally {
      setSending(false);
    }
  };

  // Recipients management
  useEffect(() => {
    if (showSettings) {
      supabase
        .from("waste_notification_recipients")
        .select("*")
        .then(({ data }) => {
          if (data) setRecipients(data as RecipientRow[]);
        });
    }
  }, [showSettings]);

  const addRecipient = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Ugyldig e-postadresse");
      return;
    }
    const { data, error } = await supabase
      .from("waste_notification_recipients")
      .insert({ waste_category: settingsCategory, email })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") toast.error("Denne e-posten finnes allerede for kategorien");
      else toast.error(error.message);
      return;
    }
    setRecipients((prev) => [...prev, data as RecipientRow]);
    setNewEmail("");
    toast.success("Mottaker lagt til");
  };

  const removeRecipient = async (id: string) => {
    await supabase.from("waste_notification_recipients").delete().eq("id", id);
    setRecipients((prev) => prev.filter((r) => r.id !== id));
    toast.success("Mottaker fjernet");
  };

  const categoryRecipients = recipients.filter((r) => r.waste_category === settingsCategory);
  const displayCats = editing ? editCategories : categories;
  const displaySettings = editing ? editSettings : settings;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Laster…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            {editing ? (
              <>
                <Input
                  value={editSettings.page_title}
                  onChange={(e) => setEditSettings((s) => ({ ...s, page_title: e.target.value }))}
                  className="font-display text-lg font-extrabold h-8 mb-1"
                />
                <Input
                  value={editSettings.page_subtitle}
                  onChange={(e) => setEditSettings((s) => ({ ...s, page_subtitle: e.target.value }))}
                  className="font-body text-xs h-6"
                />
              </>
            ) : (
              <>
                <h1 className="font-display text-lg font-extrabold tracking-tight text-foreground">
                  {displaySettings.page_title}
                </h1>
                <p className="font-body text-xs text-muted-foreground">
                  {displaySettings.page_subtitle}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && !editing && (
              <Button variant="ghost" size="icon" onClick={startEditing} className="text-muted-foreground">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="text-muted-foreground">
                <Settings className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Edit mode toolbar */}
      {editing && (
        <div className="border-b border-primary/20 bg-primary/5">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-2">
            <span className="text-xs font-medium text-primary">Redigeringsmodus</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelEditing} disabled={saving}>
                Avbryt
              </Button>
              <Button size="sm" onClick={saveEdits} disabled={saving} className="gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {saving ? "Lagrer…" : "Lagre"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-5 py-6 space-y-8">
        {/* Sorting guide */}
        <section>
          {editing ? (
            <Input
              value={editSettings.guide_heading}
              onChange={(e) => setEditSettings((s) => ({ ...s, guide_heading: e.target.value }))}
              className="mb-4 font-display text-xs font-bold uppercase tracking-widest h-6"
            />
          ) : (
            <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {displaySettings.guide_heading}
            </h2>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {displayCats.map((cat) => {
              const Icon = ICON_MAP[cat.icon_name] || Trash2;
              return (
                <div
                  key={cat.id}
                  className="flex gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: getBgColor(cat.color) }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    {editing ? (
                      <>
                        <Input
                          value={cat.label}
                          onChange={(e) => updateCat(cat.id, "label", e.target.value)}
                          className="font-display text-sm font-bold h-7"
                        />
                        <Textarea
                          value={cat.description}
                          onChange={(e) => updateCat(cat.id, "description", e.target.value)}
                          className="font-body text-xs resize-none min-h-[40px]"
                          rows={2}
                        />
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary shrink-0" />
                          <Input
                            value={cat.location}
                            onChange={(e) => updateCat(cat.id, "location", e.target.value)}
                            className="font-body text-xs font-medium h-6"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-sm font-bold text-foreground">{cat.label}</p>
                        <p className="font-body text-xs text-muted-foreground leading-relaxed">
                          {cat.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <MapPin className="h-3 w-3" />
                          <span className="font-body font-medium">{cat.location}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pickup request */}
        <section className="rounded-xl border border-border bg-card p-5">
          {editing ? (
            <>
              <Input
                value={editSettings.pickup_heading}
                onChange={(e) => setEditSettings((s) => ({ ...s, pickup_heading: e.target.value }))}
                className="mb-1 font-display text-sm font-bold h-7"
              />
              <Input
                value={editSettings.pickup_description}
                onChange={(e) => setEditSettings((s) => ({ ...s, pickup_description: e.target.value }))}
                className="mb-4 font-body text-xs h-6"
              />
            </>
          ) : (
            <>
              <h2 className="mb-1 font-display text-sm font-bold text-foreground">
                {displaySettings.pickup_heading}
              </h2>
              <p className="mb-4 font-body text-xs text-muted-foreground">
                {displaySettings.pickup_description}
              </p>
            </>
          )}

          <div className="space-y-2">
            {categories.map((cat) => {
              const Icon = ICON_MAP[cat.icon_name] || Trash2;
              return (
                <label
                  key={cat.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                    selected.has(cat.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <Checkbox checked={selected.has(cat.id)} onCheckedChange={() => toggle(cat.id)} />
                  <div className="flex h-7 w-7 items-center justify-center rounded-md text-white" style={{ backgroundColor: getBgColor(cat.color) }}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-display text-sm font-semibold text-foreground">{cat.label}</span>
                </label>
              );
            })}
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Valgfri kommentar (f.eks. «Metallcontainer er overfull»)"
            className="mt-4 resize-none"
            rows={2}
          />

          <Button onClick={handleSend} disabled={selected.size === 0 || sending} className="mt-4 w-full gap-2">
            {sent ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Varsel sendt
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {sending ? "Sender…" : "Send tømmevarsel"}
              </>
            )}
          </Button>
        </section>
      </main>

      {/* Admin: manage recipients */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>E-postvarsling – mottakere</DialogTitle>
            <DialogDescription>
              Konfigurer hvem som mottar varsel for hver avfallskategori
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSettingsCategory(cat.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  settingsCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="mt-2 space-y-2">
            {categoryRecipients.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-3">
                Ingen mottakere lagt til ennå
              </p>
            )}
            {categoryRecipients.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm">{r.email}</span>
                <button onClick={() => removeRecipient(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <Input
              type="email"
              placeholder="epost@firma.no"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRecipient()}
            />
            <Button size="icon" onClick={addRecipient}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
