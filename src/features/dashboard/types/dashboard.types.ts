// ============================================================================
// Dashboard Type Definitions - Enterprise Lao Retail POS
// ============================================================================

export type DashboardTimeRange = "today" | "week" | "month";

export interface DashboardKPIs {
  totalRevenue: number;
  totalCost: number;
  estimatedGrossProfit: number;
  grossProfitMarginPct: number;
  totalOrdersCount: number;
  averageOrderValue: number;
}

export interface RevenueTimeSeriesPoint {
  label: string;
  revenue: number;
  ordersCount: number;
}

export interface PaymentMethodBreakdown {
  cashTotal: number;
  cashCount: number;
  transferTotal: number;
  transferCount: number;
  cashPct: number;
  transferPct: number;
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  imageUrl?: string;
  baseUnit: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface DashboardStockAlert {
  id: string;
  type: "low_stock" | "near_expiry" | "expired";
  productId: string;
  productName: string;
  batchNumber?: string;
  detail: string;
  daysRemaining?: number;
}

export interface DashboardRecentOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  itemsCount: number;
  total: number;
  paymentMethod: string;
  status: string;
}

