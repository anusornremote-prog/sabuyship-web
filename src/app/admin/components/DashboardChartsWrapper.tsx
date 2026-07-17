'use client'

import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const DashboardCharts = dynamic(
  () => import("./DashboardCharts").then((mod) => mod.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <Card className="shadow-sm mt-6">
        <CardContent className="h-[300px] flex items-center justify-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> กำลังโหลดกราฟ...
        </CardContent>
      </Card>
    ),
  }
)

export function DashboardChartsWrapper({ data }: { data: any }) {
  return <DashboardCharts data={data} />
}
