import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

function toNum(d: { toNumber(): number } | number): number {
  return typeof d === "number" ? d : d.toNumber();
}

function formatMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { year, month } = await searchParams;
  const now = new Date();
  const selectedYear = year ? parseInt(year, 10) : now.getFullYear();
  const selectedMonth = month ? parseInt(month, 10) : now.getMonth() + 1;

  // Fetch all data
  const [orders, costs, categories] = await Promise.all([
    prisma.order.findMany({
      include: { orderCategories: { include: { category: true } } },
    }),
    prisma.cost.findMany(),
    prisma.category.findMany(),
  ]);

  // KPIs: total across all time
  let totalReceivable = 0;
  let totalCollected = 0;
  let totalBalanceDue = 0;
  let totalDirectCost = 0;

  orders.forEach((order) => {
    const orderTotal = order.orderCategories.reduce(
      (sum, oc) => sum + toNum(oc.priceSnapshot) * oc.quantity,
      0
    );
    totalReceivable += orderTotal;

    if (order.paymentStatus === "FULLY_PAID") {
      totalCollected += orderTotal;
      totalDirectCost += order.orderCategories.reduce(
        (sum, oc) => sum + toNum(oc.category.directCost) * oc.quantity,
        0
      );
    } else if (order.paymentStatus === "DEPOSIT_PAID") {
      totalCollected += toNum(order.depositAmount);
      totalBalanceDue += orderTotal - toNum(order.depositAmount);
    } else {
      totalBalanceDue += orderTotal;
    }
  });

  const grossProfit = totalCollected - totalDirectCost;

  // Monthly data for line chart (last 12 months)
  const months: { month: string; revenue: number; cost: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(selectedYear, selectedMonth - 1 - i, 1);
    months.push({ month: formatMonth(d), revenue: 0, cost: 0 });
  }

  orders.forEach((order) => {
    const m = formatMonth(new Date(order.orderDate));
    const orderTotal = order.orderCategories.reduce(
      (sum, oc) => sum + toNum(oc.priceSnapshot) * oc.quantity,
      0
    );
    const idx = months.findIndex((mm) => mm.month === m);
    if (idx >= 0) months[idx].revenue += orderTotal;
  });

  costs.forEach((cost) => {
    const m = formatMonth(new Date(cost.month));
    const idx = months.findIndex((mm) => mm.month === m);
    if (idx >= 0) months[idx].cost += toNum(cost.amount);
  });

  // Category revenue for pie chart
  const categoryRevenue: Record<number, number> = {};
  orders.forEach((order) => {
    order.orderCategories.forEach((oc) => {
      const cid = oc.categoryId;
      categoryRevenue[cid] = (categoryRevenue[cid] || 0) + toNum(oc.priceSnapshot) * oc.quantity;
    });
  });

  const categoryData = categories
    .map((c) => ({
      name: c.name,
      value: categoryRevenue[c.id] || 0,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Weekly bar chart data (mock for current month)
  const weeks = ["W1", "W2", "W3", "W4"];
  const barData = weeks.map((w, i) => {
    // Simple distribution based on order dates
    const start = new Date(selectedYear, selectedMonth - 1, i * 7 + 1);
    const end = new Date(selectedYear, selectedMonth - 1, (i + 1) * 7 + 1);
    let rev = 0;
    orders.forEach((order) => {
      const d = new Date(order.orderDate);
      if (d >= start && d < end) {
        rev += order.orderCategories.reduce(
          (sum, oc) => sum + toNum(oc.priceSnapshot) * oc.quantity,
          0
        );
      }
    });
    return { name: w, revenue: rev };
  });

  const serializedData = {
    kpis: {
      totalReceivable,
      totalCollected,
      totalBalanceDue,
      grossProfit,
    },
    monthlyData: months,
    categoryData,
    barData,
    selectedYear,
    selectedMonth,
  };

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsDashboard data={serializedData} />
    </Suspense>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 animate-pulse">
      <div className="h-10 w-48 bg-surface-container-high rounded mb-8" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-surface-container-high rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-surface-container-high rounded-xl" />
    </div>
  );
}
