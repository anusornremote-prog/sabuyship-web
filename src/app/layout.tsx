import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import { LanguageProvider } from "@/components/providers/language-provider";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { DeferredQuickRmbCalculator } from "@/components/calculator/DeferredQuickRmbCalculator";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    icon: [{ url: "/favicon.ico?v=3", sizes: "32x32", type: "image/x-icon" }],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SabuyShip",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${promptFont.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <div className="flex-1 flex flex-col pb-24 md:pb-0">
            {children}
          </div>
          <DeferredQuickRmbCalculator />
          <MobileBottomNav />
        </LanguageProvider>
        <Toaster richColors position="top-right" />
        <SpeedInsights />
      </body>
    </html>
  );
}
