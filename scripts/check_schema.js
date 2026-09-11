const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

function loadEnv(filename) {
  return Object.fromEntries(
    fs.readFileSync(filename, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.trimStart().startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=')
        return separator === -1
          ? [line.trim(), '']
          : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
      }),
  )
}

const env = loadEnv('.env.local')
const url = env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const secretKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !publishableKey || !secretKey) {
  console.error('FAIL environment: missing Supabase URL, publishable key, or secret key')
  process.exit(1)
}

const publicClient = createClient(url, publishableKey)
const adminClient = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const schemaContract = {
  profiles: 'id,role,customer_code,full_name,phone,line_id,line_uid,wallet_balance,is_active,created_at,updated_at',
  addresses: 'id,customer_id,full_name,phone,address_line,subdistrict,district,province,postal_code,is_default,created_at,updated_at',
  inquiries: 'id,inquiry_number,customer_id,customer_name,phone,line_id,product_url,product_name,image_url,quantity,items,shipping_type,service_type,shipping_address_id,remark,notes,status,created_at,updated_at',
  quotations: 'id,inquiry_id,customer_id,product_cost,service_fee,shipping_cost_cn_cn,shipping_cost_cn_th,shipping_cost_th_th,wooden_crate_cost,other_fee,total_price,admin_notes,valid_until,status,created_at,updated_at',
  orders: 'id,order_number,customer_id,quotation_id,status,payment_round_1_status,payment_round_2_status,payment_round_3_status,admin_notes,tracking_number,shipping_company,shipping_address_id,consolidated_into_id,delivered_at,created_at,updated_at',
  payments: 'id,order_id,payment_round,amount,payment_date,payment_method,transfer_date,transfer_time,slip_url,rejection_reason,status,created_at,updated_at',
  tracking_logs: 'id,order_id,status,notes,description,created_by,created_at',
  wallet_transactions: 'id,customer_id,amount,type,status,reference_image,description,admin_note,created_at,updated_at',
  shipments: 'id,order_id,customer_id,customer_code,transport_type,tracking_number,thailand_tracking_number,status,product_type,product_name,container_date,quantity,weight,arrival_date,shipping_cost,width,length,height,created_at,updated_at',
  site_settings: 'key,value,updated_at',
}

async function run() {
  let failed = false

  for (const [table, columns] of Object.entries(schemaContract)) {
    const { error } = await adminClient.from(table).select(columns).limit(0)
    if (error) {
      failed = true
      console.error(`FAIL ${table}: ${error.code || ''} ${error.message}`.trim())
    } else {
      console.log(`PASS ${table}`)
    }
  }

  const { data: publicProfiles, error: publicProfilesError } = await publicClient
    .from('profiles')
    .select('id')
    .limit(1)
  if (publicProfilesError || (publicProfiles && publicProfiles.length > 0)) {
    failed = true
    console.error('FAIL profiles RLS: anonymous access was not denied')
  } else {
    console.log('PASS profiles RLS (anonymous sees no rows)')
  }

  const { error: authAdminError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 })
  if (authAdminError) {
    failed = true
    console.error(`FAIL secret key: ${authAdminError.message}`)
  } else {
    console.log('PASS secret key')
  }

  const { data: buckets, error: bucketError } = await adminClient.storage.listBuckets()
  const bucketNames = new Set((buckets || []).map((bucket) => bucket.name))
  for (const name of ['inquiries', 'payment_slips']) {
    if (bucketError || !bucketNames.has(name)) {
      failed = true
      console.error(`FAIL storage bucket: ${name}`)
    } else {
      console.log(`PASS storage bucket: ${name}`)
    }
  }

  if (failed) process.exitCode = 1
}

run().catch((error) => {
  console.error(`FAIL schema check: ${error.message}`)
  process.exitCode = 1
})
