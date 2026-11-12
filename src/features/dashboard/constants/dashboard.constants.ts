// ============================================================================
// Dashboard Constants: Time Ranges & Visualization Presets
// ============================================================================

import { DashboardTimeRange } from "../types/dashboard.types";

export interface TimeRangeOption {
  id: DashboardTimeRange;
  label_lo: string;
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { id: "today", label_lo: "ມື້ນີ້ (Today)" },
  { id: "week", label_lo: "7 ມື້ຜ່ານມາ (7 Days)" },
  { id: "month", label_lo: "ເດືອນນີ້ (This Month)" },
];

