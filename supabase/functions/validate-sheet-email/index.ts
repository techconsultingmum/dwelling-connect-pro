import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1sQta9o2wRufsm9Kn7I9GRocNDviU-z9YgJb9m6uxIAo/export?format=csv';

interface SheetMember {
  email: string;
  name: string;
  phone: string;
  flatNo: string;
  wing: string;
}

async function fetchSheetEmails(): Promise<SheetMember[]> {
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet: ${response.status}`);
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
    
    if (email) {
      members.push({
        email: email.toLowerCase().trim(),
        name,
        phone: memberData['contactnumber(primarymember)'] || memberData.phone || '',
        flatNo: memberData['flatno.'] || memberData.flatno || '',
        wing: memberData.wing || '',
      });
    }
  }
  
  return members;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const members = await fetchSheetEmails();
    const member = members.find(m => m.email === normalizedEmail);
    
    if (member) {
      return new Response(
        JSON.stringify({ 
          valid: true, 
          member: {
            name: member.name,
            email: member.email,
            phone: member.phone,
            flatNo: member.flatNo,
            wing: member.wing,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ valid: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
