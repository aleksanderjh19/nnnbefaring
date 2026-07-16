import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, FileSignature, CheckCircle2, Clock, PackageCheck, Trash2 } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Row = {
  id: string;
  laantaker_navn: string;
  utlaant_gjenstand: string;
  dato_fra: string | null;
  dato_til: string | null;
  status: string;
  updated_at: string;
};

const statusMeta: Record<string, { label: string; icon: any; className: string }> = {
  draft:      { label: "Kladd",     icon: Clock,        className: "bg-muted text-foreground" },
  active:     { label: "Utlånt",    icon: FileSignature, className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100" },
  returned:   { label: "Innlevert", icon: PackageCheck,  className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100" },
};

const UtlansList = () => {
  useEffect(() => { document.title = "Utlånsskjema – NNHH Verktøy"; }, []);
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("utlans_skjemaer")
      .select("id, laantaker_navn, utlaant_gjenstand, dato_fra, dato_til, status, updated_at")
      .order("updated_at", { ascending: false });
    if (error) toast({ title: "Feil ved henting", description: error.message, variant: "destructive" });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleNew = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return;
    const { data, error } = await supabase
      .from("utlans_skjemaer")
      .insert({ user_id: userRes.user.id, dato_sted: new Date().toISOString().slice(0, 10) })
      .select("id")
      .single();
    if (error || !data) {
      toast({ title: "Feil", description: error?.message ?? "Kunne ikke opprette", variant: "destructive" });
      return;
    }
    navigate(`/utlansskjema/${data.id}`);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("utlans_skjemaer").delete().eq("id", id);
    if (error) {
      toast({ title: "Feil ved sletting", description: error.message, variant: "destructive" });
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
    toast({ title: "Slettet" });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <CategoryHeader title="Utlånsskjema" subtitle="Avtale om utlån av utstyr" />
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tilbake
        </button>

        <Button onClick={handleNew} className="w-full gap-2"><Plus className="h-4 w-4" /> Nytt utlånsskjema</Button>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Laster…</p>
        ) : rows.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Ingen skjemaer enda. Opprett ett med knappen over.</CardContent></Card>
        ) : (
          rows.map((r) => {
            const meta = statusMeta[r.status] ?? statusMeta.draft;
            const Icon = meta.icon;
            const period = r.dato_fra || r.dato_til
              ? `${r.dato_fra ?? "…"} → ${r.dato_til ?? "…"}`
              : null;
            return (
              <Card key={r.id} className="transition hover:shadow-md">
                <CardContent className="flex items-start gap-3 p-4">
                  <button className="flex-1 text-left" onClick={() => navigate(`/utlansskjema/${r.id}`)}>
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className={`${meta.className} border-0 gap-1`}><Icon className="h-3 w-3" />{meta.label}</Badge>
                    </div>
                    <div className="font-medium">{r.laantaker_navn || <span className="text-muted-foreground italic">Uten navn</span>}</div>
                    <div className="text-sm text-muted-foreground">{r.utlaant_gjenstand || "—"}</div>
                    {period && <div className="mt-0.5 text-xs text-muted-foreground">{period}</div>}
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Slette skjema?</AlertDialogTitle>
                        <AlertDialogDescription>Dette kan ikke angres.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(r.id)}>Slett</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
};

export default UtlansList;
