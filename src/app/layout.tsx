import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { TauriWindowInitializer } from "@/components/TauriWindowInitializer";

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
    <html
      lang="lo"
      className="h-full antialiased"
      style={{ backgroundColor: "#F8FAFC" }}
    >
      <body
        className="h-full w-full overflow-hidden select-none bg-[#F8FAFC] text-slate-900 font-sans"
        style={{ backgroundColor: "#F8FAFC" }}
      >
        <TauriWindowInitializer />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
