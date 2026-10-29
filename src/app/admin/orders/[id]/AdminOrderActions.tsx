"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PackageX, Truck, FileText } from "lucide-react"
import { OutOfStockModal } from "@/components/admin/OutOfStockModal"
import { ChinaTrackingModal } from "@/components/admin/ChinaTrackingModal"
import { QuoteModal } from "@/components/admin/QuoteModal"
import { useRouter } from "next/navigation"

export function AdminOrderActions({ order }: { order: any }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [chinaTrackingModalOpen, setChinaTrackingModalOpen] = useState(false)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [quoteRound, setQuoteRound] = useState<2 | 3>(2)
  const router = useRouter()

  if (order.status === "DELIVERED" || order.status === "CANCELED") {
    return null
  }

  const quotation = Array.isArray(order.quotation) ? order.quotation[0] : order.quotation
  const inquiry = Array.isArray(quotation?.inquiry) ? quotation.inquiry[0] : quotation?.inquiry
  let items = inquiry?.items || []
  if (typeof items === "string") {
    try {
      items = JSON.parse(items)
    } catch {
      items = []
    }
  }
  const hasChinaTracking = items.some((it: any) => it.tracking_cn_cn || it.china_tracking_number)

  const handleOpenQuoteModal = (round: 2 | 3) => {
    setQuoteRound(round)
    setQuoteModalOpen(true)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 1. Enter / Edit China Domestic Tracking */}
      {(order.status === "ORDERED" || order.status === "CHINA_WAREHOUSE") && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setChinaTrackingModalOpen(true)}
          className={`cursor-pointer font-medium text-xs gap-1.5 ${
            hasChinaTracking
              ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
              : "bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          {hasChinaTracking ? "แก้ไขแทร็กจีน" : "ใส่เลขแทร็กจีน"}
        </Button>
      )}

      {/* 2. Round 2 Quote (China Warehouse) */}
      {(order.status === "ORDERED" || (order.status === "CHINA_WAREHOUSE" && order.payment_round_2_status !== "PAID")) && (
        <Button
          size="sm"
          onClick={() => handleOpenQuoteModal(2)}
          className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-medium text-xs gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          {order.payment_round_2_status ? "แก้ไขค่าส่งจีน" : "ถึงโกดังจีน (แจ้งบิล)"}
        </Button>
      )}

      {/* 3. Out of stock button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer font-medium text-xs"
      >
        <PackageX className="w-3.5 h-3.5 mr-1" />
        สินค้าหมด
      </Button>

      {/* China Tracking Modal */}
      <ChinaTrackingModal
        isOpen={chinaTrackingModalOpen}
        onClose={() => setChinaTrackingModalOpen(false)}
        order={order}
        onSuccess={() => {
          setChinaTrackingModalOpen(false)
          router.refresh()
        }}
      />

      {/* Quote Modal */}
      <QuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        order={order}
        round={quoteRound}
        onSuccess={() => {
          setQuoteModalOpen(false)
          router.refresh()
        }}
      />

      {/* Out of Stock Modal */}
      <OutOfStockModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        order={order}
        onSuccess={() => {
          setModalOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}
