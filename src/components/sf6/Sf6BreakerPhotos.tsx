import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Trash2, Loader2, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { compressImageToJpeg } from "@/lib/imageCompress";
import Sf6PhotoLightbox, { type LightboxItem } from "./Sf6PhotoLightbox";

export interface Sf6PhotoRow {
  id: string;
  storage_path: string;
  created_at: string;
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
  /** Called with the updated list after add/delete so caller can update cache. */
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
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadUrls = useCallback(async (rows: Sf6PhotoRow[]) => {
    const entries = await Promise.all(
      rows.map(async (r) => [r.id, (await signUrl(r.storage_path)) ?? ""] as const)
    );
    setUrls(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    if (open) loadUrls(photos);
  }, [open, photos, loadUrls]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !roundId) return;
    setUploading(true);
    const { data: sess } = await supabase.auth.getUser();
    const uid = sess.user?.id;
    if (!uid) {
      toast({ title: "Ikke innlogget", variant: "destructive" });
      setUploading(false);
      return;
    }
    const inserted: Sf6PhotoRow[] = [];
    for (const file of Array.from(files)) {
      try {
        const blob = await compressImageToJpeg(file);
        const rand = Math.random().toString(36).slice(2, 8);
        const path = `${roundId}/${voltageLevel}/${breakerName}/${Date.now()}-${rand}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
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
          .select("id, storage_path, created_at")
          .single();
        if (dbErr) throw dbErr;
        if (row) inserted.push(row as Sf6PhotoRow);
      } catch (e: any) {
        toast({ title: "Feil ved opplasting", description: e.message ?? String(e), variant: "destructive" });
      }
    }
    setUploading(false);
    if (inserted.length) {
      const merged = [...photos, ...inserted];
      onPhotosChange(merged);
      toast({ title: "Lagt til", description: `${inserted.length} bilde(r) lastet opp.` });
    }
  };

  const deletePhoto = async (row: Sf6PhotoRow) => {
    await supabase.storage.from(BUCKET).remove([row.storage_path]);
    await supabase.from("sf6_round_photos").delete().eq("id", row.id);
    onPhotosChange(photos.filter((p) => p.id !== row.id));
    toast({ title: "Slettet" });
  };

  const filenameFor = (idx: number) =>
    `${stationName}_${voltageLevel}kV_${breakerName}_${idx + 1}.jpg`
      .replace(/\s+/g, "_")
      .replace(/[^A-Za-z0-9._-]/g, "");

  const lightboxItems: LightboxItem[] = photos.map((p, i) => ({
    url: urls[p.id] || "",
    filename: filenameFor(i),
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
            <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto">
              {photos.map((p, i) => (
                <div key={p.id} className="relative aspect-square rounded-md overflow-hidden bg-muted group">
                  {urls[p.id] ? (
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className="block h-full w-full"
                    >
                      <img
                        src={urls[p.id]}
                        alt={`Bilde ${i + 1}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </button>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!readOnly && (
                    <button
                      onClick={() => deletePhoto(p)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-destructive"
                      aria-label="Slett bilde"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
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
                onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
              />
            </div>
          )}
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
