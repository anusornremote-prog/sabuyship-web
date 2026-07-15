"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestTrackingLogs() {
  const supabase = createClient()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function checkLogs() {
      // First find the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('order_number', 'ORD-26077893')
        .single()

      if (orderError) {
        setError(orderError)
        return
      }

      // Then fetch tracking logs
      const { data: logsData, error: logsError } = await supabase
        .from('tracking_logs')
        .select('*')
        .eq('order_id', orderData.id)

      if (logsError) {
        setError(logsError)
      } else {
        setData({ order: orderData, logs: logsData })
      }
    }
    checkLogs()
  }, [])

  return (
    <div className="p-8 font-mono">
      <h1 className="text-xl font-bold mb-4">Tracking Logs Diagnostic</h1>
      <h2 className="text-lg font-bold mt-4 text-red-600">Error:</h2>
      <pre className="bg-slate-100 p-4 rounded overflow-auto text-sm">{JSON.stringify(error, null, 2)}</pre>
      
      <h2 className="text-lg font-bold mt-4 text-green-600">Data:</h2>
      <pre className="bg-slate-100 p-4 rounded overflow-auto text-sm">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
