import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Globe } from "lucide-react"
import { toast } from "sonner"

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  round: 2 | 3
  onSuccess: () => void
}

export function QuoteModal({ isOpen, onClose, order, round, onSuccess }: QuoteModalProps) {
  const [cost, setCost] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && order) {
      let inquiryItems = order.quotation?.inquiry?.items || []
      if (typeof inquiryItems === 'string') {
        try {
          inquiryItems = JSON.parse(inquiryItems)
        } catch(e) {
          inquiryItems = []
        }
      }
      
      // Initialize shipping cost fields for UI state
      const initializedItems = inquiryItems.map((item: any) => ({
        ...item,
        inputCost: round === 2 ? (item.shipping_cost_cn_th || "") : (item.shipping_cost_th_th || ""),
        inputWoodenCrateCost: round === 2 && item.wooden_crate ? (item.wooden_crate_cost || "") : ""
      }))
      setItems(initializedItems)
      
      const existingCost = round === 2 ? order.quotation?.shipping_cost_cn_th : order.quotation?.shipping_cost_th_th;
      setCost(existingCost !== undefined && existingCost !== null && existingCost > 0 ? existingCost.toString() : "");
    }
  }, [isOpen, order, round])

  const handleItemCostChange = (idx: number, field: 'inputCost' | 'inputWoodenCrateCost', value: string) => {
    const newItems = [...items]
    newItems[idx][field] = value
    setItems(newItems)

    // Auto sum
    let sum = 0
    let hasInput = false
    newItems.forEach(item => {
      let itemSum = 0
      let itemHasInput = false

      if (item.inputCost !== undefined && item.inputCost !== "") {
        itemHasInput = true
        if (!isNaN(Number(item.inputCost))) itemSum += Number(item.inputCost)
      }
      
      if (item.inputWoodenCrateCost !== undefined && item.inputWoodenCrateCost !== "") {
        itemHasInput = true
        if (!isNaN(Number(item.inputWoodenCrateCost))) itemSum += Number(item.inputWoodenCrateCost)
      }

      if (itemHasInput) {
        hasInput = true
        sum += itemSum
      }
    })
    
    if (hasInput) {
      setCost(sum >= 0 ? sum.toString() : "")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cost === "" || isNaN(Number(cost)) || Number(cost) < 0) {
      setError("กรุณากรอกยอดรวมที่ถูกต้อง")
      return
    }

    try {
      setLoading(true)
      setError("")

      const endpoint = round === 2 
        ? `/api/order/${order.id}/quote-round-2`
        : `/api/order/${order.id}/quote-round-3`
      
      // Update items array with the new costs
      const updatedItems = items.map(item => {
        const costVal = item.inputCost && !isNaN(Number(item.inputCost)) ? Number(item.inputCost) : 0
        const woodenCostVal = item.inputWoodenCrateCost && !isNaN(Number(item.inputWoodenCrateCost)) ? Number(item.inputWoodenCrateCost) : 0
        
        return {
          ...item,
          shipping_cost_cn_th: round === 2 ? costVal : (item.shipping_cost_cn_th || 0),
          shipping_cost_th_th: round === 3 ? costVal : (item.shipping_cost_th_th || 0),
          wooden_crate_cost: round === 2 && item.wooden_crate ? woodenCostVal : (item.wooden_crate_cost || 0),
          inputCost: undefined, // remove UI only field
          inputWoodenCrateCost: undefined
        }
      })

      const payload: any = round === 2
        ? { shipping_cost_cn_th: Number(cost) }
        : { shipping_cost_th_th: Number(cost) }

      if (items.length > 0) {
        payload.updated_items = updatedItems
        payload.inquiry_id = order.quotation?.inquiry?.id
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึก")
      }

      toast.success("บันทึกราคาสำเร็จ!")
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {round === 2 ? "แจ้งค่าขนส่ง จีน-ไทย (รอบ 2)" : "แจ้งค่าจัดส่งในไทย (รอบ 3)"}
          </DialogTitle>
          <DialogDescription>
            ออเดอร์: {order.order_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          
          {items.length > 0 && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-end border-b pb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">แจกแจงค่าขนส่งรายชิ้น (Optional)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">กรอกค่าส่งแต่ละชิ้น ระบบจะคำนวณยอดรวมให้อัตโนมัติ หากไม่ต้องการแยกชิ้น สามารถข้ามไปกรอกยอดรวมด้านล่างได้เลย</p>
                </div>
                {round === 2 && items.some(i => i.wooden_crate) && (
                  <div className="text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-200 shadow-sm hidden sm:block">
                    <span className="font-semibold block mb-1">เรทค่าตีลังไม้:</span>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <li>&lt; 0.2 คิว: 200 บ.</li>
                      <li>0.2-0.5 คิว: 350 บ.</li>
                      <li>0.5-1 คิว: 550 บ.</li>
                      <li>1-2 คิว: 950 บ.</li>
                      <li>&gt; 2 คิว: 1,250 บ.</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded border border-slate-100 items-start sm:items-center">
                    {item.image_url && (
                      <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <img src={item.image_url} alt="Product" className="w-12 h-12 object-cover rounded border border-slate-200" />
                      </a>
                    )}
                    <div className="flex-1 min-w-0">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline flex items-center gap-1 text-xs truncate">
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.url}</span>
                      </a>
                      <p className="text-xs text-slate-500 mt-1">จำนวน: {item.quantity} ชิ้น</p>
                    </div>
                    <div className="w-full sm:w-32 shrink-0 space-y-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.inputCost}
                        onChange={(e) => handleItemCostChange(idx, 'inputCost', e.target.value)}
                        placeholder="ค่าจัดส่ง (บาท)"
                        className="h-8 text-sm"
                        title="ค่าจัดส่ง"
                      />
                      {round === 2 && item.wooden_crate && (
                        <div className="relative">
                          <span className="absolute -top-1.5 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.inputWoodenCrateCost}
                            onChange={(e) => handleItemCostChange(idx, 'inputWoodenCrateCost', e.target.value)}
                            placeholder="ค่าตีลังไม้ (บาท)"
                            className="h-8 text-sm border-amber-300 focus-visible:ring-amber-500 bg-amber-50"
                            title="ค่าตีลังไม้"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <label htmlFor="cost" className="text-sm font-bold text-blue-900 flex justify-between items-center">
              ยอดรวมค่าจัดส่งทั้งหมด (บาท)
              <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">จำเป็นต้องกรอก</span>
            </label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="เช่น 1500"
              className="font-bold text-lg border-blue-300 focus-visible:ring-blue-500"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white min-w-[120px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              บันทึกแจ้งบิล
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
