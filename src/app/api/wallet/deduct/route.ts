import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is an admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (adminProfile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { customerId, amount, description, referenceId } = await req.json()

    if (!customerId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 })
    }

    // 1. Get current wallet balance
    const { data: customerData, error: customerError } = await supabase
      .from('profiles')
      .select('wallet_balance, full_name')
      .eq('id', customerId)
      .single()

    if (customerError || !customerData) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลลูกค้า' }, { status: 404 })
    }

    const currentBalance = Number(customerData.wallet_balance || 0)
    const deductAmount = Number(amount)

    // 2. Check if balance is sufficient
    if (currentBalance < deductAmount) {
      return NextResponse.json({ error: 'ยอดเงินในกระเป๋าไม่เพียงพอ' }, { status: 400 })
    }

    // 3. Create deduction transaction
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        customer_id: customerId,
        amount: deductAmount,
        type: 'DEDUCTION',
        status: 'APPROVED', // Auto-approved since admin triggers it
        description: description || `หักยอดเงินอัตโนมัติ${referenceId ? ` (อ้างอิง: ${referenceId})` : ''}`,
        admin_note: `ดำเนินการโดย Admin: ${user.email}`
      })

    if (txError) throw txError

    // 4. Update profile balance
    const newBalance = currentBalance - deductAmount
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', customerId)

    if (updateError) throw updateError

    // If it's an order reference, optionally update order status
    // For now, we leave it flexible for the client to handle state updates

    return NextResponse.json({ 
      success: true, 
      message: 'ตัดยอดเงินสำเร็จ',
      newBalance: newBalance
    })

  } catch (err: any) {
    console.error('Wallet deduct API error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
