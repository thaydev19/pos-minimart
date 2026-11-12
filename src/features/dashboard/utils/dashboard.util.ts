// ============================================================================
// Dashboard Utilities: Time Range Bucketing & Analytics Calculations
// ============================================================================

import { DashboardTimeRange, RevenueTimeSeriesPoint } from "../types/dashboard.types";

export function getStartDateForRange(range: DashboardTimeRange): Date {
  const now = new Date();
  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === "week") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - 6);
    return d;
  }
  // month
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

