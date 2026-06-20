import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function TrackOrder() {
  return (
    <div className="py-20 px-4 md:px-8 min-h-screen bg-slate-50">
      <div className="container max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">ติดตามสถานะสินค้า</h1>
          <p className="text-lg text-slate-600">
            กรอกหมายเลขคำสั่งซื้อ (Order ID) เพื่อดูสถานะล่าสุด
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-center">ค้นหาสถานะคำสั่งซื้อ</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col sm:flex-row gap-4" action="/track" method="get">
              <Input 
                name="id"
                placeholder="ตัวอย่าง: ORD-240001" 
                className="h-12 text-lg px-4"
                required
              />
              <Button type="submit" size="lg" className="h-12 px-8" variant="orange">
                <Search className="mr-2 h-5 w-5" />
                ค้นหา
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Placeholder for results, will implement logic later */}
        <div className="mt-12 text-center text-muted-foreground">
          <p>กรุณากรอกหมายเลขคำสั่งซื้อและกดค้นหา</p>
        </div>
      </div>
    </div>
  )
}
