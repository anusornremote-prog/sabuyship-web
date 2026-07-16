const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const key = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function run() {
  const { data: shipmentsData, error: e1 } = await supabase.from('shipments').select('*').limit(1);
  console.log("Shipments cols:", shipmentsData ? Object.keys(shipmentsData[0] || {}) : e1);
  
  const { data: quotationsData, error: e2 } = await supabase.from('quotations').select('*').limit(1);
  console.log("Quotations cols:", quotationsData ? Object.keys(quotationsData[0] || {}) : e2);
}

run();
