import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixInquiries() {
  console.log("Fetching quotations with orders...");
  const { data: quotations, error } = await supabase
    .from('quotations')
    .select('inquiry_id, orders(id)')
    .not('inquiry_id', 'is', null);

  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  const inquiriesToUpdate = quotations
    .filter((q: any) => q.orders && q.orders.length > 0)
    .map((q: any) => q.inquiry_id);

  console.log(`Found ${inquiriesToUpdate.length} inquiries that have orders.`);

  if (inquiriesToUpdate.length > 0) {
    const { data, error: updateError } = await supabase
      .from('inquiries')
      .update({ status: 'ORDERED' })
      .in('id', inquiriesToUpdate)
      .select();

    if (updateError) {
      console.error("Update error:", updateError);
    } else {
      console.log(`Successfully updated ${data?.length} inquiries to ORDERED.`);
    }
  } else {
    console.log("No inquiries needed updating.");
  }
}

fixInquiries();
