import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Dynamic CORS based on allowed origins
function getCorsHeaders(req: Request) {
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://dwelling-connect-pro.lovable.app,https://id-preview--05f7decd-ddff-49c1-86f2-98c702724fdb.lovable.app,http://localhost:5173,http://localhost:8080').split(',').filter(Boolean);
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1sQta9o2wRufsm9Kn7I9GRocNDviU-z9YgJb9m6uxIAo/export?format=csv';

interface SheetMember {
  memberId: string;
  email: string;
  name: string;
  phone: string;
  flatNo: string;
  wing: string;
  maintenanceStatus: 'paid' | 'pending' | 'overdue';
}

async function fetchSheetEmails(): Promise<SheetMember[]> {
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error('Unable to fetch member data');
  }
  
  const csvText = await response.text();
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => 
    h.trim().toLowerCase().replace(/\s+/g, '').replace(/['"]/g, '')
  );
  
  const members: SheetMember[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
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
    
    const memberData: Record<string, string> = {};
    headers.forEach((header, idx) => {
      memberData[header] = values[idx] || '';
    });
    
    const email = memberData.emailaddress || memberData.email || '';
    const name = memberData['name(primarymember)'] || memberData.name || '';
    const memberId = memberData.memberid || memberData['member id'] || memberData['sr.no.'] || `M${i.toString().padStart(3, '0')}`;
    
    // Parse maintenance status
    const statusRaw = (memberData.maintenancestatus || memberData.status || '').toLowerCase().trim();
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
        phone: memberData['contactnumber(primarymember)'] || memberData.phone || '',
        flatNo: memberData['flatno.'] || memberData.flatno || '',
        wing: memberData.wing || '',
        maintenanceStatus,
      });
    }
  }
  
  return members;
}

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    let members: SheetMember[];
    try {
      members = await fetchSheetEmails();
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
        JSON.stringify({ valid: false, error: 'Email not found in society records' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('Error validating email');
    return new Response(
      JSON.stringify({ valid: false, error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});