import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1sQta9o2wRufsm9Kn7I9GRocNDviU-z9YgJb9m6uxIAo/export?format=csv';

interface Member {
  memberId: string;
  name: string;
  email: string;
  phone: string;
  flatNo: string;
  wing: string;
  role: 'manager' | 'user';
  maintenanceStatus: 'paid' | 'pending' | 'overdue';
  outstandingDues: number;
}

function parseCSV(csvText: string): Member[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  
  // Parse headers - normalize them
  const headers = lines[0].split(',').map(h => 
    h.trim().toLowerCase().replace(/\s+/g, '').replace(/['"]/g, '')
  );
  
  console.log('Parsed headers:', headers);
  
  const members: Member[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV with potential quoted values
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
    
    console.log('Row data:', memberData);
    
    // Map to Member interface with actual Google Sheet column names
    // Columns: name(primarymember), contactnumber(primarymember), emailaddress, flatno., wing, owner/tenant, etc.
    const member: Member = {
      memberId: `USR${String(i).padStart(3, '0')}`,
      name: memberData['name(primarymember)'] || memberData.name || 'Unknown',
      email: memberData.emailaddress || memberData.email || '',
      phone: memberData['contactnumber(primarymember)'] || memberData.phone || '',
      flatNo: memberData['flatno.'] || memberData.flatno || memberData.flat || '',
      wing: memberData.wing || '',
      role: 'user' as 'manager' | 'user',
      maintenanceStatus: 'pending' as 'paid' | 'pending' | 'overdue',
      outstandingDues: 0,
    };
    
    // Skip rows without a name
    if (member.name && member.name !== 'Unknown') {
      members.push(member);
    }
  }
  
  return members;
}

function parseMaintenanceStatus(status: string): 'paid' | 'pending' | 'overdue' {
  const normalized = status.toLowerCase().trim();
  if (normalized === 'paid' || normalized === 'clear') return 'paid';
  if (normalized === 'overdue' || normalized === 'late') return 'overdue';
  return 'pending';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json().catch(() => ({ action: 'read', data: null }));

    if (action === 'read') {
      // Fetch CSV from Google Sheets
      const response = await fetch(CSV_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Google Sheet: ${response.status}`);
      }
      
      const csvText = await response.text();
      const members = parseCSV(csvText);
      
      console.log(`Parsed ${members.length} members from CSV`);
      
      return new Response(
        JSON.stringify({ success: true, members }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'write') {
      // Note: Writing to Google Sheets requires OAuth or Service Account
      // For now, return a message about the requirement
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Write operations require Google Service Account credentials. Please add GOOGLE_SERVICE_ACCOUNT_KEY secret to enable write functionality.',
          requiresSecret: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
