import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/providers/language-provider";
import "./globals.css";

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: "swap",
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
      className={`${promptFont.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
