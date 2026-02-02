import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function parseCSV(csvText: string): { members: Member[]; bills: MaintenanceBill[] } {
  const lines = csvText.split('\n');
  if (lines.length < 2) return { members: [], bills: [] };
  
  // Parse headers - normalize them
  const headers = lines[0].split(',').map(h => 
    h.trim().toLowerCase().replace(/\s+/g, '').replace(/['"]/g, '')
  );
  
  console.log('Parsed headers:', headers);
  
  const members: Member[] = [];
  const bills: MaintenanceBill[] = [];
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
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
    
    // Map to Member interface with actual Google Sheet column names
    const memberId = `USR${String(i).padStart(3, '0')}`;
    const maintenanceStatus = parseMaintenanceStatus(memberData.maintenancestatus || memberData.status || 'pending');
    const outstandingDues = parseFloat(memberData.outstandingdues || memberData.dues || memberData.amount || '0') || 0;
    const flatNo = memberData['flatno.'] || memberData.flatno || memberData.flat || '';
    
    const member: Member = {
      memberId,
      name: memberData['name(primarymember)'] || memberData.name || 'Unknown',
      email: memberData.emailaddress || memberData.email || '',
      phone: memberData['contactnumber(primarymember)'] || memberData.phone || '',
      flatNo,
      wing: memberData.wing || '',
      role: 'user',
      maintenanceStatus,
      outstandingDues,
    };
    
    // Skip rows without a name
    if (member.name && member.name !== 'Unknown') {
      members.push(member);
      
      // Create maintenance bill for this member
      if (outstandingDues > 0 || maintenanceStatus !== 'paid') {
        const bill: MaintenanceBill = {
          id: `BILL-${memberId}-${currentYear}-${i}`,
          userId: memberId,
          flatNo,
          amount: outstandingDues > 0 ? outstandingDues : 5000, // Default maintenance amount
          dueDate: new Date(currentYear, currentDate.getMonth(), 15).toISOString().split('T')[0],
          status: maintenanceStatus,
          month: currentMonth,
          year: currentYear,
        };
        bills.push(bill);
      }
      
      // Add previous month bill if marked as paid
      if (maintenanceStatus === 'paid') {
        const prevMonth = new Date(currentYear, currentDate.getMonth() - 1, 1);
        const bill: MaintenanceBill = {
          id: `BILL-${memberId}-${prevMonth.getFullYear()}-${prevMonth.getMonth()}-${i}`,
          userId: memberId,
          flatNo,
          amount: 5000,
          dueDate: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 15).toISOString().split('T')[0],
          status: 'paid',
          paidDate: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 10).toISOString().split('T')[0],
          month: prevMonth.toLocaleString('default', { month: 'long' }),
          year: prevMonth.getFullYear(),
        };
        bills.push(bill);
      }
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Check for authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
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
      // Fetch CSV from Google Sheets
      const response = await fetch(CSV_URL);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const csvText = await response.text();
      const { members, bills } = parseCSV(csvText);
      
      console.log(`Parsed ${members.length} members and ${bills.length} bills from CSV`);
      
      return new Response(
        JSON.stringify({ success: true, members, bills }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'write') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Write operations require additional configuration'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error processing request');
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred while processing the request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
