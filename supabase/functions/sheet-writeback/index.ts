import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const SHEETS_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY") || "";
const CSV_URL = Deno.env.get("GOOGLE_SHEET_CSV_URL") || "";

function extractSheetId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}

function normalize(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "").replace(/['"]/g, "");
}

async function gw(path: string, init: RequestInit = {}) {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": SHEETS_KEY,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Sheets gateway ${res.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY || !SHEETS_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Sheets connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const sheetId = extractSheetId(CSV_URL);
    if (!sheetId) {
      return new Response(
        JSON.stringify({ success: false, error: "Sheet ID not resolvable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const client = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await client.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const updates: Record<string, string> = {
      name: (body.name || "").toString(),
      phone: (body.phone || "").toString(),
    };
    const email = (user.email || "").toLowerCase().trim();
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "User has no email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Get sheet metadata (first sheet title)
    const meta = await gw(
      `/spreadsheets/${sheetId}?fields=sheets.properties(title,sheetId)`,
    );
    const sheetTitle: string = meta.sheets?.[0]?.properties?.title || "Sheet1";

    // 2. Read full grid
    const range = `${sheetTitle}!A1:Z10000`;
    const values = await gw(
      `/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,
    );
    const rows: string[][] = values.values || [];
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "Sheet is empty" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const headers = rows[0].map(normalize);
    const emailIdx = headers.findIndex((h) => h === "emailaddress" || h === "email");
    const nameIdx = headers.findIndex(
      (h) => h === "membername" || h === "name(primarymember)" || h === "name",
    );
    const phoneIdx = headers.findIndex(
      (h) => h === "contactnumber" || h === "contactnumber(primarymember)" || h === "phone",
    );
    if (emailIdx === -1) {
      return new Response(
        JSON.stringify({ success: false, error: "Email column not found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rowIndex = rows.findIndex(
      (r, i) => i > 0 && (r[emailIdx] || "").toLowerCase().trim() === email,
    );
    if (rowIndex === -1) {
      return new Response(
        JSON.stringify({ success: false, error: "No matching row for user" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sheetRow = rowIndex + 1; // 1-based
    const dataUpdates: Array<{ range: string; values: string[][] }> = [];
    const colLetter = (i: number) => {
      let s = "";
      let n = i;
      while (n >= 0) {
        s = String.fromCharCode((n % 26) + 65) + s;
        n = Math.floor(n / 26) - 1;
      }
      return s;
    };
    if (updates.name && nameIdx !== -1) {
      dataUpdates.push({
        range: `${sheetTitle}!${colLetter(nameIdx)}${sheetRow}`,
        values: [[updates.name]],
      });
    }
    if (updates.phone && phoneIdx !== -1) {
      dataUpdates.push({
        range: `${sheetTitle}!${colLetter(phoneIdx)}${sheetRow}`,
        values: [[updates.phone]],
      });
    }
    if (dataUpdates.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await gw(`/spreadsheets/${sheetId}/values:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: dataUpdates,
      }),
    });

    return new Response(
      JSON.stringify({ success: true, updated: dataUpdates.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("sheet-writeback error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message || "Failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});