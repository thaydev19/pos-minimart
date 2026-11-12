import type { Metadata, Viewport } from "next";
import { Noto_Sans_Lao, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";

const notoSansLao = Noto_Sans_Lao({
  subsets: ["lao"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-lao",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-latin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lao Minimart POS - ລະບົບຂາຍໜ້າຮ້ານມິນິມາດ",
  description: "Enterprise Offline-First Retail POS System for Laos (ພາສາລາວ)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lo" className={`${notoSansLao.variable} ${plusJakartaSans.variable} h-full antialiased`}>
      <body className="h-full w-full overflow-hidden select-none bg-[#F8F9FA] text-slate-900 font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
