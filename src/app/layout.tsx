import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { TauriWindowInitializer } from "@/components/TauriWindowInitializer";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "QuickOne POS - ລະບົບຂາຍໜ້າຮ້ານ",
  description: "Enterprise Offline-First Retail POS System for Laos (ພາສາລາວ)",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
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
      <head>
        <link
          rel="preload"
          href="/fonts/NotoSansLao.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/PlusJakartaSans.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className="h-full w-full overflow-hidden select-none bg-[#F8FAFC] text-slate-900 font-sans"
        style={{ backgroundColor: "#F8FAFC" }}
      >
        <TauriWindowInitializer />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            className: "font-sans",
            style: {
              fontFamily: "'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif",
            },
          }}
        />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
