const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VALID_CATEGORIES = [
  { value: "bensinverktoy", label: "Bensin-/motorverktøy" },
  { value: "el_verktoy", label: "El.verktøy" },
  { value: "kjøretøy", label: "Kjøretøy" },
  { value: "maskin", label: "Maskin" },
  { value: "traktor_utstyr", label: "Traktor m/utstyr" },
  { value: "maleinstrument", label: "Måleinstrument" },
  { value: "utstyr", label: "Utstyr" },
  { value: "annet", label: "Annet" },
];

interface ExtractedEquipment {
  equipment_name: string;
  brand: string | null;
  type: string | null;
  category_value: string;
  category_label: string;
  noise_level_db: string | null;
  vibration_ms2: string | null;
  description: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, mode = 'scrape' } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL er påkrevd' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY er ikke konfigurert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY er ikke konfigurert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase-konfigurasjon mangler' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Scrape or crawl with Firecrawl
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log(`${mode === 'crawl' ? 'Crawling' : 'Scraping'} URL:`, formattedUrl);

    const firecrawlEndpoint = mode === 'crawl'
      ? 'https://api.firecrawl.dev/v1/crawl'
      : 'https://api.firecrawl.dev/v1/scrape';

    const firecrawlBody = mode === 'crawl'
      ? { url: formattedUrl, limit: 10, scrapeOptions: { formats: ['markdown'] } }
      : { url: formattedUrl, formats: ['markdown'], onlyMainContent: true };

    const scrapeRes = await fetch(firecrawlEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(firecrawlBody),
    });

    const scrapeData = await scrapeRes.json();

    if (!scrapeRes.ok) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: `Firecrawl feilet: ${scrapeData.error || scrapeRes.status}` }),
        { status: scrapeRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect markdown from scrape or crawl
    let markdown = '';
    if (mode === 'crawl') {
      // For crawl, we get an async job - poll for results
      const crawlId = scrapeData.id;
      if (!crawlId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Crawl returnerte ingen jobb-ID' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Poll for crawl completion (max 2 minutes)
      let crawlComplete = false;
      let crawlResult = null;
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
          headers: { 'Authorization': `Bearer ${firecrawlKey}` },
        });
        crawlResult = await statusRes.json();
        if (crawlResult.status === 'completed') {
          crawlComplete = true;
          break;
        }
        console.log(`Crawl status: ${crawlResult.status}, completed: ${crawlResult.completed}/${crawlResult.total}`);
      }

      if (!crawlComplete || !crawlResult?.data) {
        return new Response(
          JSON.stringify({ success: false, error: 'Crawl tidsavbrudd eller ingen data' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      markdown = crawlResult.data
        .map((page: { markdown?: string }) => page.markdown || '')
        .join('\n\n---\n\n');
    } else {
      markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    }

    if (!markdown || markdown.length < 50) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ikke nok innhold funnet på siden' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trim markdown to avoid token limits
    const trimmedMarkdown = markdown.substring(0, 15000);

    // Step 2: Use AI to extract equipment data
    console.log('Extracting equipment data with AI...');

    const categoryList = VALID_CATEGORIES.map(c => `  "${c.value}" → "${c.label}"`).join('\n');

    const aiRes = await fetch('https://ai.lovable.dev/api/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Du er en ekspert på å ekstrahere utstyrsinformasjon fra nettsider. Ekstraher en liste med verktøy/utstyr/maskiner fra teksten.

For hvert utstyr, returner:
- equipment_name: Utstyrets hovednavn (f.eks. "Motorsag", "Vinkelsliper")
- brand: Merke/produsent (f.eks. "Husqvarna", "Bosch") eller null
- type: Modell/type (f.eks. "545 Mark II", "GWS 18-125") eller null
- category_value: En av disse kategoriene:
${categoryList}
- noise_level_db: Støynivå i dB hvis oppgitt, ellers null
- vibration_ms2: Vibrasjonsnivå i m/s² hvis oppgitt, ellers null
- description: Kort beskrivelse (maks 200 tegn) eller null

Returner BARE en JSON-array. Ingen annen tekst.
Eksempel: [{"equipment_name":"Motorsag","brand":"Husqvarna","type":"545 Mark II","category_value":"bensinverktoy","noise_level_db":"115","vibration_ms2":"3.5","description":"Profesjonell motorsag for skogsbruk"}]`
          },
          {
            role: 'user',
            content: `Ekstraher utstyrsinformasjon fra denne nettsiden:\n\n${trimmedMarkdown}`
          }
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI extraction failed:', errText);
      return new Response(
        JSON.stringify({ success: false, error: `AI-ekstraksjon feilet: ${aiRes.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiRes.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON from AI response
    let equipment: ExtractedEquipment[] = [];
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        equipment = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', aiContent);
      return new Response(
        JSON.stringify({ success: false, error: 'Klarte ikke å tolke AI-svaret', raw: aiContent }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (equipment.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ingen utstyr funnet på siden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Validate and map category labels
    const validatedEquipment = equipment.map(item => {
      const cat = VALID_CATEGORIES.find(c => c.value === item.category_value);
      return {
        equipment_name: item.equipment_name,
        brand: item.brand || null,
        type: item.type || null,
        category_value: cat ? cat.value : 'annet',
        category_label: cat ? cat.label : 'Annet',
        noise_level_db: item.noise_level_db || null,
        vibration_ms2: item.vibration_ms2 || null,
        description: item.description || null,
      };
    });

    // Step 4: Insert into equipment_catalog (preview mode - return data without inserting)
    // To actually insert, pass insert: true in the request body
    const { insert: shouldInsert } = await req.json().catch(() => ({ insert: false }));

    console.log(`Found ${validatedEquipment.length} equipment items`);

    return new Response(
      JSON.stringify({
        success: true,
        count: validatedEquipment.length,
        equipment: validatedEquipment,
        message: `Fant ${validatedEquipment.length} utstyr fra ${formattedUrl}. Bruk insert-endepunktet for å importere.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in crawl-equipment:', error);
    const msg = error instanceof Error ? error.message : 'Ukjent feil';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
