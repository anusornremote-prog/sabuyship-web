"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface ConfirmDialogField {
  name: string
  label: string
  placeholder?: string
  required?: boolean
  defaultValue?: string
}

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  loading?: boolean
  fields?: ConfirmDialogField[]
  onConfirm: (values: Record<string, string>) => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  variant = "default",
  loading = false,
  fields,
  onConfirm,
}: ConfirmDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [validationError, setValidationError] = useState("")

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {}
      fields?.forEach((field) => {
        initial[field.name] = field.defaultValue ?? ""
      })
      setValues(initial)
      setValidationError("")
    }
  }, [open, fields])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (fields) {
      for (const field of fields) {
        const val = (values[field.name] || "").trim()
        if (field.required && !val) {
          setValidationError(`กรุณาระบุ${field.label}`)
          return
        }
      }
    }
    setValidationError("")
    const trimmed: Record<string, string> = {}
    Object.entries(values).forEach(([k, v]) => {
      trimmed[k] = v.trim()
    })
    await onConfirm(trimmed)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          {fields && fields.length > 0 && (
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <label
                    htmlFor={`confirm-field-${field.name}`}
                    className="block text-xs font-bold text-slate-700"
                  >
                    {field.label}
                    {field.required && <span className="ml-1 text-rose-500">*</span>}
                  </label>
                  <Input
                    id={`confirm-field-${field.name}`}
                    type="text"
                    value={values[field.name] || ""}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                      if (validationError) setValidationError("")
                    }}
                    placeholder={field.placeholder}
                    disabled={loading}
                    className="h-11 rounded-xl"
                  />
                </div>
              ))}
            </div>
          )}

          {validationError && (
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {validationError}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="min-h-11 rounded-xl"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant={variant === "destructive" ? "destructive" : "default"}
              disabled={loading}
              className="min-h-11 rounded-xl font-bold"
            >
              {loading ? "กำลังดำเนินการ..." : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

