'use client'

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts"
import { ArrowRight, BarChart3, TrendingUp } from "lucide-react"

interface ChartData {
  date: string
  revenue: number
  inquiries: number
  orders: number
}

export function DashboardCharts({ data }: { data: ChartData[] }) {
  const formatYAxis = (value: number) => {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()
  }

  const formatCurrency = (value: number) => {
    return `฿ ${value.toLocaleString()}`
  }

  const hasRevenue = data?.some((item) => item.revenue > 0)
  const hasVolume = data?.some((item) => item.inquiries > 0 || item.orders > 0)

  const EmptyChart = ({
    icon: Icon,
    title,
    description,
    href,
    action,
  }: {
    icon: typeof TrendingUp
    title: string
    description: string
    href: string
    action: string
  }) => (
    <div className="h-[220px] flex flex-col items-center justify-center text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm font-black text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">{description}</p>
      <Link href={href} className="inline-flex items-center gap-1 mt-4 text-xs font-black text-primary hover:underline">
        {action} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 mt-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-slate-800">ยอดขาย 30 วันล่าสุด</CardTitle>
          <p className="text-xs text-slate-500">มูลค่าคำสั่งซื้อรวม แสดงเป็นเงินบาท</p>
        </CardHeader>
        <CardContent>
          {hasRevenue ? <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(typeof value === 'number' ? value : 0), 'ยอดขาย']}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div> : <EmptyChart
            icon={TrendingUp}
            title="ยังไม่มียอดขายในช่วง 30 วัน"
            description="กราฟจะเริ่มแสดงเมื่อมีคำสั่งซื้อที่มีมูลค่าในระบบ"
            href="/admin/orders"
            action="ดูคำสั่งซื้อทั้งหมด"
          />}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-slate-800">ปริมาณงาน 30 วันล่าสุด</CardTitle>
          <p className="text-xs text-slate-500">เปรียบเทียบคำขอประเมินราคากับคำสั่งซื้อ</p>
        </CardHeader>
        <CardContent>
          {hasVolume ? <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} allowDecimals={false} />
                <Tooltip 
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="inquiries" name="คำขอประเมินราคา" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="orders" name="ยอดการสั่งซื้อ" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div> : <EmptyChart
            icon={BarChart3}
            title="ยังไม่มีคำขอหรือคำสั่งซื้อใหม่"
            description="ช่วงที่ไม่มีข้อมูลจะใช้พื้นที่แบบย่อ เพื่อให้เห็นงานสำคัญด้านบนได้ทันที"
            href="/admin/inquiries"
            action="ดูคำขอประเมินราคา"
          />}
        </CardContent>
      </Card>
    </div>
  )
}
