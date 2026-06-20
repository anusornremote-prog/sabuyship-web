import Link from "next/link"
import { Ship } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <img src="/logo.png" alt="Sabuy Ship Logo" className="h-16 w-auto object-contain" />
        <span className="font-bold text-3xl tracking-tight text-primary">Sabuy Ship</span>
      </Link>
      {children}
    </div>
  )
}
