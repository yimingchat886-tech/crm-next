import { prisma } from "@/lib/prisma";
import OrdersTable from "@/components/orders/OrdersTable";
import NewOrderDialog from "@/components/orders/NewOrderDialog";
import type { PaymentStatus } from "@/types";

// Helper to safely convert Prisma Decimal → number
function toNum(d: { toNumber(): number } | number): number {
  return typeof d === "number" ? d : d.toNumber();
}

export default async function OrdersPage() {
  const [orders, customers, categories] = await Promise.all([
    prisma.order.findMany({
      orderBy: { orderDate: "desc" },
      include: {
        customer: true,
        orderCategories: { include: { category: true } },
      },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Serialize for client boundary
  const serializedOrders = orders.map((order) => {
    const deposit = toNum(order.depositAmount);
    const totalReceivable = order.orderCategories.reduce(
      (sum, oc) => sum + toNum(oc.priceSnapshot) * oc.quantity,
      0
    );
    const balanceDue = totalReceivable - deposit;
    const daysSinceOrder = Math.floor(
      (Date.now() - new Date(order.orderDate).getTime()) / 86400000
    );

    return {
      id: order.id,
      customerId: order.customerId,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        status: order.customer.status,
      },
      orderDate: order.orderDate.toISOString(),
      paymentStatus: order.paymentStatus as PaymentStatus,
      depositAmount: deposit,
      folderPath: order.folderPath,
      createdAt: order.createdAt.toISOString(),
      orderCategories: order.orderCategories.map((oc) => ({
        id: oc.id,
        orderId: oc.orderId,
        categoryId: oc.categoryId,
        categoryName: oc.category.name,
        priceSnapshot: toNum(oc.priceSnapshot),
        quantity: oc.quantity,
        progress: oc.progress,
      })),
      totalReceivable,
      balanceDue,
      daysSinceOrder,
    };
  });

  // Stats
  const totalOrders = orders.length;
  const activePipeline = orders.filter(
    (o) => o.paymentStatus !== "FULLY_PAID"
  ).length;
  const totalRevenueForecast = serializedOrders.reduce(
    (sum, o) => sum + o.totalReceivable,
    0
  );
  const totalCollected = serializedOrders.reduce((sum, o) => {
    if (o.paymentStatus === "FULLY_PAID") return sum + o.totalReceivable;
    if (o.paymentStatus === "DEPOSIT_PAID") return sum + o.depositAmount;
    return sum;
  }, 0);

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    unitPrice: toNum(c.unitPrice),
  }));

  const serializedCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const isHost = process.env.IS_HOST === "true";

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <nav className="flex mb-2 text-xs font-medium text-outline uppercase tracking-widest">
            <span>Dashboard</span>
            <span className="mx-2">/</span>
            <span className="text-primary">Operations</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-background">
            Order List
          </h1>
        </div>
        <NewOrderDialog customers={serializedCustomers} categories={serializedCategories} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <p className="text-sm font-medium text-outline-variant mb-1">Total Orders</p>
          <span className="text-2xl font-bold">{totalOrders}</span>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <p className="text-sm font-medium text-outline-variant mb-1">Active Pipeline</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{activePipeline}</span>
            <span className="text-xs font-bold text-tertiary">In Progress</span>
          </div>
        </div>
        <div className="bg-primary p-6 rounded-xl shadow-sm md:col-span-2 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/80 mb-1">Revenue Forecast</p>
            <span className="text-2xl font-bold text-white block mb-3">
              ¥{totalRevenueForecast.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
            </span>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-3">
              <div
                className="bg-white h-full rounded-full transition-all"
                style={{
                  width: totalRevenueForecast > 0
                    ? `${Math.min(100, (totalCollected / totalRevenueForecast) * 100).toFixed(1)}%`
                    : "0%",
                }}
              />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/60">Collected</p>
                <p className="text-sm font-bold text-white">
                  ¥{totalCollected.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/60">Remaining</p>
                <p className="text-sm font-bold text-white">
                  ¥{(totalRevenueForecast - totalCollected).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 blur-3xl rounded-full" />
        </div>
      </div>

      {/* Table */}
      <OrdersTable orders={serializedOrders} isHost={isHost} />
    </main>
  );
}
