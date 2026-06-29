import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/providers/language-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sabuy Ship | นำเข้าสินค้าจากจีนง่าย รวดเร็ว และปลอดภัย",
  description: "บริการนำเข้าสินค้าจากจีนถึงไทยอย่างมืออาชีพ รวดเร็ว ปลอดภัย ตรวจสอบสถานะได้ 24 ชั่วโมง พร้อมบริการสั่งซื้อสินค้าและขนส่ง",
  icons: {
    icon: "/favicon.ico?v=2",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
