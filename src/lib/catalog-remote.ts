import type { CustomCatalog } from "@/lib/catalog-storage";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/useAuth";

// Server access for the shared hardware catalog (accounts mode). One row per
// user-added item in public.catalog_items; `kind` namespaces the four libraries
// and `data` is the library-specific def (RackItemDef / SystemDeviceDef / Panel
// / InventoryModelDef) stored verbatim — its client-generated `id` round-trips,
// so deletes filter on `data->>id`. See supabase/migrations/0002_shared_catalog.sql.
export type CatalogKind = keyof CustomCatalog;

interface CatalogRow {
  kind: CatalogKind;
  data: Record<string, unknown>;
  // Who contributed the row — drives the client-side delete affordance, which
  // must agree with the RLS delete policy (own or orphaned).
  created_by: string | null;
}

export async function fetchCatalogItems(): Promise<CatalogRow[]> {
  const { data, error } = await supabase
    .from("catalog_items")
    .select("kind, data, created_by")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CatalogRow[];
}

export async function insertCatalogItem(kind: CatalogKind, def: { id: string }): Promise<void> {
  const userId = useAuth.getState().user?.id ?? null;
  const { error } = await supabase
    .from("catalog_items")
    .insert({ kind, data: def, created_by: userId });
  if (error) throw error;
}

export async function deleteCatalogItem(defId: string): Promise<void> {
  const { data, error } = await supabase
    .from("catalog_items")
    .delete()
    .eq("data->>id", defId)
    .select("id");
  if (error) throw error;
  // RLS doesn't error on rows the caller may not delete — it filters them, so a
  // denied delete "succeeds" over 0 rows. Throw so the caller can roll back its
  // optimistic removal instead of the row resurrecting next session.
  if (!data || data.length === 0) throw new Error("No deletable row (not the contributor)");
}
