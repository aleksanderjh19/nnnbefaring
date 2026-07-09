import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, Trash2, Loader2, ImageOff, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { compressImageToJpeg } from "@/lib/imageCompress";
import Sf6PhotoLightbox, { type LightboxItem } from "./Sf6PhotoLightbox";

export interface Sf6PhotoRow {
  id: string;
  storage_path: string;
  created_at: string;
  comment?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: string | null;
  stationName: string;
  voltageLevel: string;
  breakerName: string;
  readOnly?: boolean;
  photos: Sf6PhotoRow[];
  onPhotosChange: (rows: Sf6PhotoRow[]) => void;
}

const BUCKET = "sf6-round-photos";

async function signUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export default function Sf6BreakerPhotos({
  open, onOpenChange, roundId, stationName, voltageLevel, breakerName,
  readOnly = false, photos, onPhotosChange,
}: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadUrls = useCallback(async (rows: Sf6PhotoRow[]) => {
    const entries = await Promise.all(
      rows.map(async (r) => [r.id, (await signUrl(r.storage_path)) ?? ""] as const)
    );
    setUrls((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  }, []);

  useEffect(() => {
    if (open) {
      loadUrls(photos);
      setDrafts(Object.fromEntries(photos.map((p) => [p.id, p.comment ?? ""])));
    }
  }, [open, photos, loadUrls]);

  const uploadFiles = useCallback(
    async (fileArr: File[]) => {
      if (!fileArr.length) return;
      if (!roundId) {
        toast({
          title: "Lagre runden først",
          description: "Runden må ha en id før du kan legge til bilder.",
          variant: "destructive",
        });
        return;
      }
      setUploading(true);
      const { data: sess } = await supabase.auth.getUser();
      const uid = sess.user?.id;
      if (!uid) {
        toast({ title: "Ikke innlogget", variant: "destructive" });
        setUploading(false);
        return;
      }
      const inserted: Sf6PhotoRow[] = [];
      for (const file of fileArr) {
        try {
          let blob: Blob;
          try {
            blob = await compressImageToJpeg(file);
          } catch {
            // Fallback: last opp original hvis komprimering ikke støttes (f.eks. HEIC)
            blob = file;
          }
          const rand = Math.random().toString(36).slice(2, 8);
          const safeBreaker = breakerName
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${roundId}/${voltageLevel}/${safeBreaker}/${Date.now()}-${rand}.jpg`;
          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, blob, {
              contentType: blob.type || "image/jpeg",
              upsert: false,
            });
          if (upErr) throw upErr;
          const { data: row, error: dbErr } = await supabase
            .from("sf6_round_photos")
            .insert({
              round_id: roundId,
              voltage_level: voltageLevel,
              breaker_name: breakerName,
              storage_path: path,
              created_by: uid,
            })
            .select("id, storage_path, created_at, comment")
            .single();
          if (dbErr) throw dbErr;
          if (row) inserted.push(row as Sf6PhotoRow);
        } catch (e: any) {
          toast({
            title: "Feil ved opplasting",
            description: e?.message ?? String(e),
            variant: "destructive",
          });
        }
      }
      setUploading(false);
      if (inserted.length) {
        onPhotosChange([...photos, ...inserted]);
        toast({ title: "Lagt til", description: `${inserted.length} bilde(r) lastet opp.` });
      }
    },
    [roundId, voltageLevel, breakerName, photos, onPhotosChange]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Snapshot files BEFORE resetting the input value (which nulls the FileList).
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    void uploadFiles(files);
  };

  const deletePhoto = async (row: Sf6PhotoRow) => {
    await supabase.storage.from(BUCKET).remove([row.storage_path]);
    await supabase.from("sf6_round_photos").delete().eq("id", row.id);
    onPhotosChange(photos.filter((p) => p.id !== row.id));
    toast({ title: "Slettet" });
  };

  const saveComment = async (row: Sf6PhotoRow) => {
    const next = drafts[row.id] ?? "";
    if ((row.comment ?? "") === next) return;
    setSavingId(row.id);
    const { error } = await supabase
      .from("sf6_round_photos")
      .update({ comment: next || null })
      .eq("id", row.id);
    setSavingId(null);
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke lagre kommentar.", variant: "destructive" });
      return;
    }
    onPhotosChange(photos.map((p) => (p.id === row.id ? { ...p, comment: next || null } : p)));
  };

  const filenameFor = (idx: number) =>
    `${stationName}_${voltageLevel}kV_${breakerName}_${idx + 1}.jpg`
      .replace(/\s+/g, "_")
      .replace(/[^A-Za-z0-9._-]/g, "");

  const lightboxItems: LightboxItem[] = photos.map((p, i) => ({
    url: urls[p.id] || "",
    filename: filenameFor(i),
    caption: p.comment ?? "",
  }));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bilder – {breakerName}</DialogTitle>
            <DialogDescription>
              {voltageLevel} kV · {stationName}
            </DialogDescription>
          </DialogHeader>

          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-muted-foreground">
              <ImageOff className="h-8 w-8 mb-2 opacity-60" />
              <p className="text-sm">Ingen bilder ennå.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {photos.map((p, i) => (
                <div key={p.id} className="flex gap-3 rounded-lg border border-border p-2">
                  <div className="relative h-24 w-24 shrink-0 rounded-md overflow-hidden bg-muted">
                    {urls[p.id] ? (
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        className="block h-full w-full"
                      >
                        <img
                          src={urls[p.id]}
                          alt={p.comment || `Bilde ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {readOnly ? (
                      <p className="text-sm text-foreground whitespace-pre-wrap min-h-[1.25rem]">
                        {p.comment || <span className="text-muted-foreground italic">Ingen kommentar</span>}
                      </p>
                    ) : (
                      <Textarea
                        value={drafts[p.id] ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        onBlur={() => saveComment(p)}
                        placeholder="Kommentar (valgfritt)"
                        rows={2}
                        className="text-sm resize-none"
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(p.created_at).toLocaleString("no-NO")}
                      </span>
                      <div className="flex items-center gap-2">
                        {savingId === p.id && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                        {!readOnly && savingId !== p.id && (drafts[p.id] ?? "") === (p.comment ?? "") && (p.comment ?? "") !== "" && (
                          <Check className="h-3 w-3 text-primary" />
                        )}
                        {!readOnly && (
                          <button
                            onClick={() => deletePhoto(p)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Slett bilde"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!readOnly && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => cameraRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                Ta bilde
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-2 h-4 w-4" /> Last opp
              </Button>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onInputChange}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onInputChange}
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button onClick={() => onOpenChange(false)} disabled={uploading} className="w-full sm:w-auto">
              OK, ferdig
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sf6PhotoLightbox
        items={lightboxItems}
        index={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onOpenChange={(o) => { if (!o) setLightboxIndex(null); }}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
}
