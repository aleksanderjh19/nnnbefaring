import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SortOrder {
  entity_type: string;
  category_value: string;
  entity_key: string;
  sort_order: number;
}

export function useSortOrders() {
  const [sortOrders, setSortOrders] = useState<SortOrder[]>([]);

  const fetchSortOrders = useCallback(async () => {
    const { data } = await supabase
      .from("catalog_sort_orders" as any)
      .select("entity_type, category_value, entity_key, sort_order")
      .order("sort_order");
    if (data) setSortOrders(data as unknown as SortOrder[]);
  }, []);

  useEffect(() => {
    fetchSortOrders();
  }, [fetchSortOrders]);

  const getSortOrder = useCallback(
    (entityType: string, categoryValue: string, entityKey: string): number => {
      const found = sortOrders.find(
        (s) =>
          s.entity_type === entityType &&
          s.category_value === categoryValue &&
          s.entity_key === entityKey
      );
      return found?.sort_order ?? 999;
    },
    [sortOrders]
  );

  const saveSortOrders = useCallback(
    async (entityType: string, categoryValue: string, orderedKeys: string[]) => {
      // Upsert all sort orders
      const rows = orderedKeys.map((key, i) => ({
        entity_type: entityType,
        category_value: categoryValue,
        entity_key: key,
        sort_order: i,
        updated_at: new Date().toISOString(),
      }));

      for (const row of rows) {
        await supabase
          .from("catalog_sort_orders" as any)
          .upsert(row, { onConflict: "entity_type,category_value,entity_key" });
      }

      // Optimistic update
      setSortOrders((prev) => {
        const filtered = prev.filter(
          (s) => !(s.entity_type === entityType && s.category_value === categoryValue)
        );
        return [...filtered, ...rows];
      });
    },
    []
  );

  const sortItems = useCallback(
    <T>(items: T[], entityType: string, categoryValue: string, getKey: (item: T) => string): T[] => {
      return [...items].sort((a, b) => {
        const orderA = getSortOrder(entityType, categoryValue, getKey(a));
        const orderB = getSortOrder(entityType, categoryValue, getKey(b));
        return orderA - orderB;
      });
    },
    [getSortOrder]
  );

  return { sortOrders, getSortOrder, saveSortOrders, sortItems, fetchSortOrders };
}
