import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Not admin");

    const body = await req.json();
    const { action } = body;

    if (action === "rename_equipment") {
      // Rename equipment_name across catalog + training_records
      const { category_value, old_name, new_name } = body;
      if (!old_name || !new_name) throw new Error("Missing names");

      // Update catalog
      await adminClient
        .from("equipment_catalog")
        .update({ equipment_name: new_name })
        .eq("equipment_name", old_name)
        .eq("category_value", category_value);

      // Update training records
      await adminClient
        .from("training_records")
        .update({ equipment_name: new_name })
        .eq("equipment_name", old_name)
        .eq("equipment_category", category_value);

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "rename_category") {
      const { old_value, new_label } = body;
      if (!old_value || !new_label) throw new Error("Missing values");

      await adminClient
        .from("equipment_catalog")
        .update({ category_label: new_label })
        .eq("category_value", old_value);

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "merge_equipment") {
      // Merge source equipment into target (same category)
      const { category_value, source_name, target_name } = body;
      if (!source_name || !target_name || source_name === target_name) throw new Error("Invalid merge");

      // Update training records: move source -> target
      await adminClient
        .from("training_records")
        .update({ equipment_name: target_name })
        .eq("equipment_name", source_name)
        .eq("equipment_category", category_value);

      // Delete source catalog entries
      await adminClient
        .from("equipment_catalog")
        .delete()
        .eq("equipment_name", source_name)
        .eq("category_value", category_value);

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "merge_category") {
      // Merge all equipment from source category into target category
      const { source_value, target_value, target_label } = body;
      if (!source_value || !target_value || source_value === target_value) throw new Error("Invalid merge");

      // Update catalog entries
      await adminClient
        .from("equipment_catalog")
        .update({ category_value: target_value, category_label: target_label })
        .eq("category_value", source_value);

      // Update training records
      await adminClient
        .from("training_records")
        .update({ equipment_category: target_value })
        .eq("equipment_category", source_value);

      // Clean up sort orders for source
      await adminClient
        .from("catalog_sort_orders")
        .delete()
        .eq("category_value", source_value);

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Unknown action");
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
