import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/providers/language-provider";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { QuickRmbCalculator } from "@/components/calculator/QuickRmbCalculator";
import { Toaster } from "sonner";
import "./globals.css";

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1e3a8a",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Sabuy Ship | นำเข้าสินค้าจากจีนง่าย รวดเร็ว และปลอดภัย",
  description: "บริการนำเข้าสินค้าจากจีนถึงไทยอย่างมืออาชีพ รวดเร็ว ปลอดภัย ตรวจสอบสถานะได้ 24 ชั่วโมง พร้อมบริการสั่งซื้อสินค้าและขนส่ง",
  icons: {
    icon: "/favicon.ico?v=2",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SabuyShip",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "th";

  return (
    <html
      lang={lang}
      className={`${promptFont.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <div className="flex-1 flex flex-col pb-18 md:pb-0">
            {children}
          </div>
          <QuickRmbCalculator />
          <MobileBottomNav />
        </LanguageProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
