import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CSV_URL = Deno.env.get('GOOGLE_SHEET_CSV_URL') || '';

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

interface MaintenanceBill {
  id: string;
  userId: string;
  flatNo: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  month: string;
  year: number;
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

function parseCSV(csvText: string): { members: Member[]; bills: MaintenanceBill[] } {
  const lines = csvText.split('\n');
  if (lines.length < 2) return { members: [], bills: [] };

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  console.log('Parsed headers:', headers);

  const members: Member[] = [];
  const bills: MaintenanceBill[] = [];
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    // Map columns flexibly to handle various header naming conventions
    const memberId = row['memberid'] || row['member_id'] || row['sr.no.'] || `USR${String(i).padStart(3, '0')}`;
    const name = row['membername'] || row['name(primarymember)'] || row['name'] || '';
    const email = row['emailaddress'] || row['email'] || '';
    const phone = row['contactnumber'] || row['contactnumber(primarymember)'] || row['phone'] || '';
    const flatNo = row['flatno.'] || row['flatno'] || row['flat'] || '';
    const wing = row['wing'] || '';
    const sheetRole = row['role'] || '';
    const maintenanceStatusRaw = row['maintenancestatus'] || row['status'] || '';
    const outstandingDuesRaw = row['outstandingdues'] || row['dues'] || row['amount'] || '0';

    if (!name || name === 'Unknown') continue;

    const maintenanceStatus = parseMaintenanceStatus(maintenanceStatusRaw);
    const outstandingDues = parseFloat(outstandingDuesRaw) || 0;

    const member: Member = {
      memberId,
      name,
      email,
      phone,
      flatNo,
      wing,
      role: sheetRole.toLowerCase().includes('manager') || sheetRole.toLowerCase().includes('admin') ? 'manager' : 'user',
      maintenanceStatus,
      outstandingDues,
    };

    members.push(member);

    // Create maintenance bill for members with outstanding dues
    if (outstandingDues > 0 || maintenanceStatus !== 'paid') {
      bills.push({
        id: `BILL-${memberId}-${currentYear}-${i}`,
        userId: memberId,
        flatNo,
        amount: outstandingDues > 0 ? outstandingDues : 5000,
        dueDate: new Date(currentYear, currentDate.getMonth(), 15).toISOString().split('T')[0],
        status: maintenanceStatus,
        month: currentMonth,
        year: currentYear,
      });
    }

    if (maintenanceStatus === 'paid') {
      const prevMonth = new Date(currentYear, currentDate.getMonth() - 1, 1);
      bills.push({
        id: `BILL-${memberId}-${prevMonth.getFullYear()}-${prevMonth.getMonth()}-${i}`,
        userId: memberId,
        flatNo,
        amount: 5000,
        dueDate: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 15).toISOString().split('T')[0],
        status: 'paid',
        paidDate: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 10).toISOString().split('T')[0],
        month: prevMonth.toLocaleString('default', { month: 'long' }),
        year: prevMonth.getFullYear(),
      });
    }
  }

  return { members, bills };
}

function parseMaintenanceStatus(status: string): 'paid' | 'pending' | 'overdue' {
  const normalized = status.toLowerCase().trim();
  if (normalized === 'paid' || normalized === 'clear' || normalized === 'yes') return 'paid';
  if (normalized === 'overdue' || normalized === 'late' || normalized === 'no') return 'overdue';
  return 'pending';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action } = await req.json().catch(() => ({ action: 'read' }));

    if (action === 'read') {
      if (!CSV_URL) {
        return new Response(
          JSON.stringify({ success: false, error: 'CSV URL not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(CSV_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status}`);
      }

      const csvText = await response.text();
      
      // Validate we got CSV, not HTML
      if (csvText.trim().startsWith('<!') || csvText.trim().startsWith('<html')) {
        console.error('Received HTML instead of CSV. Check GOOGLE_SHEET_CSV_URL.');
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid CSV source. Please check the sheet URL configuration.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { members, bills } = parseCSV(csvText);
      console.log(`Parsed ${members.length} members and ${bills.length} bills from CSV`);

      return new Response(
        JSON.stringify({ success: true, members, bills }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'write') {
      return new Response(
        JSON.stringify({ success: false, error: 'Write operations require additional configuration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred while processing the request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
