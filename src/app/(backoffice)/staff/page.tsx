import { Metadata } from "next";
import { StaffPage } from "@/features/staff/pages/staff-page";

export const metadata: Metadata = {
  title: "ຈັດການພະນັກງານ (Staff Management) - QuickOne POS",
  description: "Manage staff accounts, assign roles, and configure 6-digit cashier PINs",
};

export default function StaffManagementRoute() {
  return <StaffPage />;
}
