'use client'

import { Copy } from "lucide-react"
import { toast } from "sonner"

export function CopyTrackingButton({ trackingNumber, label }: { trackingNumber: string, label: string }) {
  if (!trackingNumber) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingNumber)
    toast.success(`คัดลอก${label}แล้ว: ${trackingNumber}`)
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-sm font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
        {trackingNumber}
      </span>
      <button 
        onClick={handleCopy}
        className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
        title={`คัดลอก${label}`}
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  )
}
