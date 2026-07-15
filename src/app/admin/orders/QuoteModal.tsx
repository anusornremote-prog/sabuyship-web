import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  round: 2 | 3
  onSuccess: () => void
}

export function QuoteModal({ isOpen, onClose, order, round, onSuccess }: QuoteModalProps) {
  const [cost, setCost] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cost || isNaN(Number(cost)) || Number(cost) < 0) {
      setError("กรุณากรอกราคาที่ถูกต้อง")
      return
    }

    try {
      setLoading(true)
      setError("")

      const endpoint = round === 2 
        ? `/api/order/${order.id}/quote-round-2`
        : `/api/order/${order.id}/quote-round-3`
      
      const payload = round === 2
        ? { shipping_cost_cn_th: Number(cost) }
        : { shipping_cost_th_th: Number(cost) }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึก")
      }

      alert("บันทึกราคาสำเร็จ!")
      onSuccess()
      onClose()
      setCost("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose()
        setCost("")
        setError("")
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {round === 2 ? "แจ้งค่าขนส่ง จีน-ไทย (รอบ 2)" : "แจ้งค่าจัดส่งในไทย (รอบ 3)"}
          </DialogTitle>
          <DialogDescription>
            ออเดอร์: {order.order_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="cost" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">ระบุราคา (บาท)</label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="เช่น 1500"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              บันทึก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
