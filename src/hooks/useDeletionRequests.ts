import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Row = { row_id: string; requested_by: string; requested_at: string };

/**
 * Global soft-delete for all tools.
 * - Admin: deletes rows directly (via `hardDelete`).
 * - Non-admin: marks a row as "requested for deletion" (visible with a "Slettes snart" badge).
 *   Users can toggle their own request off.
 */
export function useDeletionRequests(tableName: string) {
  const { user, isAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("deletion_requests")
      .select("row_id, requested_by, requested_at")
      .eq("table_name", tableName);
    setRows((data as Row[]) ?? []);
  }, [tableName]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`deletion_requests:${tableName}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deletion_requests", filter: `table_name=eq.${tableName}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [tableName, load]);

  const map = new Map(rows.map((r) => [r.row_id, r]));

  const isRequested = (rowId: string) => map.has(rowId);
  const requestedBy = (rowId: string) => map.get(rowId)?.requested_by;

  const requestDeletion = useCallback(
    async (rowId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("deletion_requests")
        .insert({ table_name: tableName, row_id: rowId, requested_by: user.id });
      if (error && !/duplicate/i.test(error.message)) {
        toast.error("Kunne ikke merke for sletting");
        return;
      }
      toast.success("Merket for sletting — admin må godkjenne");
      load();
    },
    [user, tableName, load]
  );

  const cancelRequest = useCallback(
    async (rowId: string) => {
      const { error } = await supabase
        .from("deletion_requests")
        .delete()
        .eq("table_name", tableName)
        .eq("row_id", rowId);
      if (error) {
        toast.error("Kunne ikke fjerne merking");
        return;
      }
      toast.success("Merking fjernet");
      load();
    },
    [tableName, load]
  );

  /** Called after admin hard-delete to clean up any leftover request row. */
  const clearRequest = useCallback(
    async (rowId: string) => {
      await supabase
        .from("deletion_requests")
        .delete()
        .eq("table_name", tableName)
        .eq("row_id", rowId);
    },
    [tableName]
  );

  /**
   * Wire this to a delete button. Admin path calls `hardDelete` (usually opens a confirm).
   * Non-admin path toggles the deletion request.
   */
  const handleDeleteClick = useCallback(
    async (rowId: string, hardDelete: () => void | Promise<void>) => {
      if (isAdmin) {
        await hardDelete();
        await clearRequest(rowId);
      } else if (map.has(rowId)) {
        await cancelRequest(rowId);
      } else {
        await requestDeletion(rowId);
      }
    },
    [isAdmin, map, cancelRequest, requestDeletion, clearRequest]
  );

  return {
    isAdmin,
    isRequested,
    requestedBy,
    requestDeletion,
    cancelRequest,
    clearRequest,
    handleDeleteClick,
  };
}
