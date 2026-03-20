import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    // Verify the calling user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { categories, note } = await req.json();
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error("No categories provided");
    }

    // Get recipients for the selected categories
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: recipients } = await adminClient
      .from("waste_notification_recipients")
      .select("email, waste_category")
      .in("waste_category", categories);

    if (!recipients || recipients.length === 0) {
      throw new Error(
        "Ingen mottakere er konfigurert for valgte kategorier. Be en administrator om å legge til mottakere."
      );
    }

    // Log the pickup request
    await adminClient.from("waste_pickup_requests").insert({
      waste_category: categories.join(","),
      requested_by: user.id,
      note: note || null,
    });

    // Build category labels
    const LABELS: Record<string, string> = {
      restavfall: "Restavfall",
      papp: "Papp og papir",
      metall: "Metall",
      batterier: "Batterier",
      ee_avfall: "EE-avfall",
      plast: "Plast",
    };

    const categoryLabels = categories
      .map((c: string) => LABELS[c] || c)
      .join(", ");

    const uniqueEmails = [...new Set(recipients.map((r) => r.email))];

    const emailHtml = `
<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1a1a1a; margin-bottom: 16px;">Tømmevarsel</h2>
  <p>Det er meldt behov for tømming av følgende avfallskategorier:</p>
  <ul style="padding-left: 20px;">
    ${categories.map((c: string) => `<li>${LABELS[c] || c}</li>`).join("")}
  </ul>
  ${note ? `<p><strong>Kommentar:</strong> ${note}</p>` : ""}
  <p style="color: #666; font-size: 14px;">
    Meldt av: ${user.email}<br/>
    Tidspunkt: ${new Date().toLocaleString("nb-NO", { timeZone: "Europe/Oslo" })}
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #999; font-size: 12px;">NNN Verktøy – Avfallshåndtering</p>
</div>`.trim();

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NNN Verktøy <varsling@nnn.verktoy.no>",
        to: uniqueEmails,
        subject: `Tømmevarsel: ${categoryLabels}`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend error:", resendRes.status, errBody);
      throw new Error(`Kunne ikke sende e-post (${resendRes.status})`);
    }

    const resendData = await resendRes.json();
    console.log("Resend success:", resendData);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Varsel sendt til ${uniqueEmails.length} mottaker(e) for: ${categoryLabels}`,
        recipients: uniqueEmails,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("notify-waste-pickup error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
