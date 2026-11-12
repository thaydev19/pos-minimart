import { PosTerminalPage } from "@/features/pos";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "POS Terminal - ລະບົບຂາຍໜ້າຮ້ານມິນິມາດ",
  description: "Enterprise Offline-First Retail POS Terminal for Laos (LAK)",
};

export default function PosPage() {
  return <PosTerminalPage />;
}
