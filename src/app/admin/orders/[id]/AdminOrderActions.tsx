"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PackageX } from "lucide-react"
import { OutOfStockModal } from "../OutOfStockModal"
import { useRouter } from "next/navigation"

export function AdminOrderActions({ order }: { order: any }) {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  if (order.status === "DELIVERED" || order.status === "CANCELED") {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer font-medium"
      >
        <PackageX className="w-4 h-4 mr-1.5" />
        แจ้งสินค้าหมด / ปรับยอดเงิน
      </Button>

      <OutOfStockModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        order={order}
        onSuccess={() => {
          setModalOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}
