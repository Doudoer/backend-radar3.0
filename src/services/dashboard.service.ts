export interface DashboardOrderSummary {
  id: number;
  order_number: string;
  customer_name: string;
  status: string;
  total_amount: number;
}

export interface DashboardStats {
  orders: number;
  customers: number;
  warranties: number;
  invoices: number;
}

export function buildDashboardPayload(
  counts: DashboardStats,
  latestOrders: DashboardOrderSummary[],
) {
  return {
    stats: counts,
    latestOrders,
  };
}
