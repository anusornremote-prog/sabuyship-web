import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { FloatingLineButton } from "@/components/layout/FloatingLineButton"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen relative">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingLineButton />
    </div>
  )
}
