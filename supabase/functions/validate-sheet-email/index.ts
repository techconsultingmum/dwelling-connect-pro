import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CSV_URL = Deno.env.get('GOOGLE_SHEET_CSV_URL') || '';

interface SheetMember {
  memberId: string;
  email: string;
  name: string;
  phone: string;
  flatNo: string;
  wing: string;
  maintenanceStatus: 'paid' | 'pending' | 'overdue';
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim().replace(/^"|"$/g, ''));
  return values;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '').replace(/['"]/g, '');
}

async function fetchSheetEmails(): Promise<SheetMember[]> {
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error('Unable to fetch member data');
  }

  const csvText = await response.text();
  
  // Validate we got CSV, not HTML
  if (csvText.trim().startsWith('<!') || csvText.trim().startsWith('<html')) {
    throw new Error('Received HTML instead of CSV data');
  }

  const lines = csvText.split('\n');
  if (lines.length < 2) return [];

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  const members: SheetMember[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    const email = row['emailaddress'] || row['email'] || '';
    const name = row['membername'] || row['name(primarymember)'] || row['name'] || '';
    const memberId = row['memberid'] || row['member_id'] || row['sr.no.'] || `M${i.toString().padStart(3, '0')}`;
    const phone = row['contactnumber'] || row['contactnumber(primarymember)'] || row['phone'] || '';
    const flatNo = row['flatno.'] || row['flatno'] || '';
    const wing = row['wing'] || '';

    const statusRaw = (row['maintenancestatus'] || row['status'] || '').toLowerCase().trim();
    let maintenanceStatus: 'paid' | 'pending' | 'overdue' = 'pending';
    if (statusRaw.includes('paid') || statusRaw.includes('clear')) {
      maintenanceStatus = 'paid';
    } else if (statusRaw.includes('overdue') || statusRaw.includes('due')) {
      maintenanceStatus = 'overdue';
    }

    if (email) {
      members.push({
        memberId,
        email: email.toLowerCase().trim(),
        name,
        phone,
        flatNo,
        wing,
        maintenanceStatus,
      });
    }
  }

  return members;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Cache
let cachedSheetData: { data: SheetMember[]; timestamp: number } | null = null;
const CACHE_TTL = 300000;

async function getSheetMembers(): Promise<SheetMember[]> {
  const now = Date.now();
  if (cachedSheetData && now - cachedSheetData.timestamp < CACHE_TTL) {
    return cachedSheetData.data;
  }

  const members = await fetchSheetEmails();
  cachedSheetData = { data: members, timestamp: now };
  return members;
}

function getClientIP(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let email: string;
    try {
      const body = await req.json();
      email = body.email;
    } catch {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    let members: SheetMember[];
    try {
      members = await getSheetMembers();
    } catch {
      return new Response(
        JSON.stringify({ valid: false, error: 'Unable to verify email at this time. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const member = members.find(m => m.email === normalizedEmail);

    if (member) {
      return new Response(
        JSON.stringify({
          valid: true,
          member: {
            memberId: member.memberId,
            name: member.name,
            email: member.email,
            phone: member.phone,
            flatNo: member.flatNo,
            wing: member.wing,
            maintenanceStatus: member.maintenanceStatus,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ valid: false, error: 'Email not registered. Please contact your society manager.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('Error validating email');
    return new Response(
      JSON.stringify({ valid: false, error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
