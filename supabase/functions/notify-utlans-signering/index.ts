import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const OWNER_EMAIL = 'aleksander.holmslet@statnett.no';
const APP_URL = 'https://nnhh.lovable.app';

interface Payload {
  skjemaId: string;
  type: 'loan' | 'return';
  laantakerNavn?: string;
  utlaantGjenstand?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { skjemaId, type, laantakerNavn, utlaantGjenstand } = (await req.json()) as Payload;
    if (!skjemaId || !type) {
      return new Response(JSON.stringify({ error: 'skjemaId og type kreves' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY mangler');

    const isLoan = type === 'loan';
    const subject = isLoan
      ? `Utlånsskjema klart for signering — ${laantakerNavn ?? ''}`.trim()
      : `Innlevering klar for godkjenning — ${laantakerNavn ?? ''}`.trim();

    const heading = isLoan ? 'Nytt utlån venter på din signatur' : 'Innlevering venter på godkjenning';
    const body = isLoan
      ? `${laantakerNavn ?? 'En låntaker'} har fylt ut og signert et utlånsskjema for <b>${utlaantGjenstand ?? 'utstyr'}</b>. Skjemaet venter på din signatur som ansvarlig utstyrseier.`
      : `${laantakerNavn ?? 'Låntaker'} har signert innlevering av <b>${utlaantGjenstand ?? 'utstyret'}</b>. Vennligst signer for å bekrefte at det er tilbakelevert.`;

    const link = `${APP_URL}/utlansskjema/${skjemaId}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color:#0f172a;">
        <div style="border-left:4px solid #00814C; padding-left:16px; margin-bottom:20px;">
          <h2 style="margin:0; font-size:20px; color:#00814C;">${heading}</h2>
        </div>
        <p style="font-size:15px; line-height:1.5;">${body}</p>
        <p style="margin:28px 0;">
          <a href="${link}" style="background:#00814C; color:#fff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600; display:inline-block;">Åpne skjema</a>
        </p>
        <p style="font-size:12px; color:#64748b;">NNHH Verktøy — Utlånsskjema</p>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'NNHH Verktøy <onboarding@resend.dev>',
        to: [OWNER_EMAIL],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend failed', res.status, errText);
      return new Response(JSON.stringify({ error: 'E-post feilet', details: errText }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
