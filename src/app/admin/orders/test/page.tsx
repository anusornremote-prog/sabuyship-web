'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestPage() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const runTest = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          created_at,
          payment_round_1_status,
          payment_round_2_status,
          payment_round_3_status,
          customer_id,
          customer:customer_id (
            id,
            full_name,
            phone,
            wallet_balance
          ),
          address:shipping_address_id (
            address_line,
            subdistrict,
            district,
            province,
            postal_code
          ),
          quotation:quotation_id (
            total_price
          ),
          payments (
            id,
            amount,
            payment_date,
            slip_url,
            status
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        setError(error)
      } else {
        setResult(data)
      }
    }
    
    runTest()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Diagnostic Test</h1>
      
      {error && (
        <div className="bg-red-50 p-4 border border-red-200 rounded">
          <h2 className="font-bold text-red-800">Error Details:</h2>
          <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}

      {result && (
        <div className="bg-green-50 p-4 border border-green-200 rounded">
          <h2 className="font-bold text-green-800">Success! Found {result.length} orders.</h2>
          <pre className="mt-2 text-sm text-green-700 whitespace-pre-wrap overflow-auto max-h-[500px]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
