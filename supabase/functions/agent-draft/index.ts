// MarrakechStory agent — drafts a tailored reply to a trip request using a real LLM.
// Provider: set AGENT_PROVIDER=openai (ChatGPT) or =claude to force one; otherwise it
// auto-selects ANTHROPIC_API_KEY -> Claude, else OPENAI_API_KEY -> ChatGPT.
// Set secrets in Supabase: Project -> Edge Functions -> Secrets (or `supabase secrets set`).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const SYSTEM = `You are the MarrakechStory travel agent — the AI concierge for MarrakechStory, a luxury boutique travel agency run by Aladdin & Marte, a Moroccan-Norwegian couple based between Marrakech and Oslo. You design tailor-made Morocco trips: Marrakech medina riads, private hammam & spa, Jardin Majorelle, sunrise hot-air balloons, Agafay desert luxury camps with camel rides and dinners under the stars, the Atlas Mountains and Berber villages, the Sahara dunes, and the Essaouira coast — for Norwegian and international travellers.

Your task: write the FIRST reply to a trip request, ready for staff to review, lightly edit, and send. Guidelines:
- Open by greeting the client by first name.
- Warmly reflect back the specifics they gave: trip type, dates, party size, budget level, accommodation style, and ESPECIALLY their free-text wishes/notes. Reference real, fitting Morocco experiences for what they described (e.g. food & market tours, Imlil day hikes, a Draa Valley oasis stay, an Erg Chigaga desert camp).
- If they asked us to craft the trip ("choose for me"), promise a complete day-by-day itinerary built around their wishes.
- Promise a tailored proposal with full programme and pricing within 24 hours, and invite them to confirm their dates so we can lock the best riads and experiences.
- Sign off exactly as: Aladdin & Marte — MarrakechStory

Voice: warm, personal, confident, concise — never pushy or salesy. Write in the client's language: Norwegian if their language or country indicates Norway, French or Swedish if indicated, otherwise English. 120–220 words. Flowing paragraphs only — NO markdown, NO headings, NO bullet symbols. Never invent specific prices or confirm availability. Output ONLY the reply text, nothing before or after.`;

function facts(lead: any): string {
  const p = (lead && lead.payload) || {};
  const tx = (v: any): string => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return v.en || v.no || v.nb || v.fr || v.sv || (Object.values(v).find((x) => typeof x === "string") as string) || "";
    return String(v);
  };
  const trav = p.travellers || {};
  const pax = p.people || ((+trav.adults || 0) + (+trav.children || 0) + (+trav.infants || 0)) || "";
  const lines: string[] = [];
  const add = (k: string, v: any) => { const s = tx(v); if (s && s !== "[]" && s !== "false") lines.push(`${k}: ${s}`); };
  add("Name", p.name || lead.name);
  add("Language/Country", [lead.lang || p.lang, lead.country || p.country].filter(Boolean).join(" / "));
  add("Request type", lead.kind);
  add("Trip type", p.tripType || lead.trip_type);
  add("Travellers", pax);
  add("Duration (days)", p.duration || lead.duration);
  add("Start date", lead.start_date || p.startDate);
  add("End date", lead.end_date);
  add("Arrival/Departure city", [tx(p.arriveCity), tx(p.departCity)].filter(Boolean).join(" / "));
  add("Pace", p.pace); add("Budget", p.budget); add("Accommodation", p.accommodation);
  add("Wants us to craft the trip", p.chooseForMe ? "yes" : "");
  add("Occasion", p.occasion);
  add("Client notes / wishes", p.notes);
  add("Things to avoid", p.avoid);
  return lines.join("\n");
}

function userMessage(lead: any, instruction?: string): string {
  return `Trip request details:\n${facts(lead)}${instruction ? `\n\nExtra instruction from staff: ${instruction}` : ""}\n\nWrite the reply now.`;
}

async function callClaude(key: string, lead: any, instruction?: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: Deno.env.get("ANTHROPIC_MODEL") || "claude-opus-4-8", max_tokens: 1200, system: SYSTEM, messages: [{ role: "user", content: userMessage(lead, instruction) }] }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `claude_${r.status}`);
  return (j.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
}

async function callOpenAI(key: string, lead: any, instruction?: string): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model: Deno.env.get("OPENAI_MODEL") || "gpt-4o", max_tokens: 1200, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMessage(lead, instruction) }] }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `openai_${r.status}`);
  return (j.choices?.[0]?.message?.content || "").trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const anthropic = Deno.env.get("ANTHROPIC_API_KEY");
  const openai = Deno.env.get("OPENAI_API_KEY");
  const override = (Deno.env.get("AGENT_PROVIDER") || "").toLowerCase();
  // Decide provider: explicit override wins, else prefer whichever key exists.
  let provider = "";
  if (override === "openai" || override === "chatgpt") provider = openai ? "openai" : "";
  else if (override === "claude" || override === "anthropic") provider = anthropic ? "claude" : "";
  else if (anthropic) provider = "claude";
  else if (openai) provider = "openai";
  if (!provider) return json({ ok: false, error: "no_key", hint: "Set OPENAI_API_KEY (ChatGPT) or ANTHROPIC_API_KEY (Claude) in Edge Function secrets. Use AGENT_PROVIDER=openai to force ChatGPT." });
  try {
    const { lead, instruction } = await req.json();
    if (!lead) return json({ ok: false, error: "no_lead" });
    const draft = provider === "openai" ? await callOpenAI(openai!, lead, instruction) : await callClaude(anthropic!, lead, instruction);
    if (!draft) return json({ ok: false, error: "empty" });
    return json({ ok: true, draft, provider });
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message || e) });
  }
});
