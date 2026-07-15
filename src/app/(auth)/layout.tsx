import Link from "next/link"
import { Ship } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-orange-50/30 p-4 relative overflow-hidden">
      
      {/* Decorative blurred blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 w-full flex flex-col items-center">
        <Link href="/" className="flex justify-center mb-2 hover:opacity-90 transition-opacity -my-6 md:-my-10">
          <img src="/Sabuy_Ship_Express.png" alt="Sabuy Ship Express Logo" className="h-48 md:h-64 w-auto object-contain drop-shadow-sm" />
        </Link>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
