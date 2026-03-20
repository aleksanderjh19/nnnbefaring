import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";

const WASTE_CATEGORIES = [
  {
    id: "restavfall",
    label: "Restavfall",
    icon: Trash2,
    color: "bg-gray-600",
    location: "Container ved hovedinngang",
    description: "Alt som ikke kan sorteres i andre kategorier",
  },
  {
    id: "papp",
    label: "Papp og papir",
    icon: Package,
    color: "bg-amber-700",
    location: "Presscontainer bak verksted",
    description: "Pappesker, papir, aviser (brett sammen pappen)",
  },
  {
    id: "metall",
    label: "Metall",
    icon: Wrench,
    color: "bg-slate-500",
    location: "Metallcontainer ved lager",
    description: "Skrapjern, aluminiumsprofiler, blikk, kabler",
  },
  {
    id: "batterier",
    label: "Batterier",
    icon: Battery,
    color: "bg-yellow-600",
    location: "Innsamlingsboks i resepsjonen",
    description: "Alle typer batterier (merket beholder)",
  },
  {
    id: "ee_avfall",
    label: "EE-avfall",
    icon: Zap,
    color: "bg-emerald-700",
    location: "EE-pall ved teknisk rom",
    description: "Elektronikk, kabler, lyspærer, småelektrisk",
  },
  {
    id: "plast",
    label: "Plast",
    icon: Recycle,
    color: "bg-blue-600",
    location: "Plastcontainer ved lager",
    description: "Ren plastemballasje, folie, plastbeholdere",
  },
] as const;

type WasteCategory = (typeof WASTE_CATEGORIES)[number];

interface RecipientRow {
  id: string;
  waste_category: string;
  email: string;
}

export default function WasteManagement() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Admin: recipients management
  const [showSettings, setShowSettings] = useState(false);
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [settingsCategory, setSettingsCategory] = useState<string>(WASTE_CATEGORIES[0].id);

  useEffect(() => {
    document.title = "Avfallshåndtering Bjerka – NNN Verktøy";
  }, []);

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

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
        body: {
          categories: Array.from(selected),
          note: note.trim() || undefined,
        },
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              Avfallshåndtering
            </h1>
            <p className="font-body text-xs text-muted-foreground">
              Sorteringsoversikt og varsling om tømming
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="text-muted-foreground"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6 space-y-8">
        {/* Sorting guide */}
        <section>
          <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Sorteringsguide
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {WASTE_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="flex gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cat.color} text-white`}
                >
                  <cat.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-foreground">{cat.label}</p>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">
                    {cat.description}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-primary">
                    <MapPin className="h-3 w-3" />
                    <span className="font-body font-medium">{cat.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pickup request */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 font-display text-sm font-bold text-foreground">
            Meld behov for tømming
          </h2>
          <p className="mb-4 font-body text-xs text-muted-foreground">
            Velg hvilke avfallsdunker som er fulle og trenger henting
          </p>

          <div className="space-y-2">
            {WASTE_CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  selected.has(cat.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary"
                }`}
              >
                <Checkbox
                  checked={selected.has(cat.id)}
                  onCheckedChange={() => toggle(cat.id)}
                />
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${cat.color} text-white`}
                >
                  <cat.icon className="h-3.5 w-3.5" />
                </div>
                <span className="font-display text-sm font-semibold text-foreground">
                  {cat.label}
                </span>
              </label>
            ))}
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Valgfri kommentar (f.eks. «Metallcontainer er overfull»)"
            className="mt-4 resize-none"
            rows={2}
          />

          <Button
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            className="mt-4 w-full gap-2"
          >
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
            {WASTE_CATEGORIES.map((cat) => (
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
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <span className="text-sm">{r.email}</span>
                <button
                  onClick={() => removeRecipient(r.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
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
