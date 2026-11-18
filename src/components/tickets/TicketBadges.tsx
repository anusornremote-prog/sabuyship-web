"use client"

import { Badge } from "@/components/ui/badge"
import { getTicketCategoryLabel, getTicketStatusMeta } from "@/lib/tickets"

export function TicketStatusBadge({
  status,
  className = "",
}: {
  status: string | null | undefined
  className?: string
}) {
  const meta = getTicketStatusMeta(status)
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 text-xs ${meta.badgeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`} aria-hidden="true" />
      <span>{meta.label}</span>
    </Badge>
  )
}

export function TicketCategoryBadge({
  category,
  className = "",
}: {
  category: string | null | undefined
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={`bg-slate-50 text-slate-700 border-slate-200 font-semibold px-2.5 py-0.5 text-xs ${className}`}
    >
      {getTicketCategoryLabel(category)}
    </Badge>
  )
}
