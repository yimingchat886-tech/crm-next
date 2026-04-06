"use client";

import Link from "next/link";

type OrderCategory = {
  id: number;
  categoryId: number;
  categoryName: string;
  priceSnapshot: number;
  quantity: number;
  directCost: number;
};

type Order = {
  id: number;
  customer: { id: number; name: string };
  orderDate: string;
  paymentStatus: string;
  depositAmount: number;
  totalReceivable: number;
  orderCategories: OrderCategory[];
};

export default function CostsClient({ order }: { order: Order }) {
  const totalDirectCost = order.orderCategories.reduce(
    (sum, oc) => sum + oc.directCost * oc.quantity,
    0
  );

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-outline mb-2">
          <Link href="/orders" className="hover:text-primary transition-colors">Orders</Link>
          <span>/</span>
          <span className="text-on-surface">ORD-{String(order.id).padStart(3, "0")}</span>
        </nav>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Direct Costs</h1>
        <p className="text-on-surface-variant mt-1">Customer: {order.customer.name}</p>
      </div>

      {/* Direct Costs Table */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">work</span>
            Direct Costs by Category
          </h2>
          <Link
            href="/settings"
            className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
          >
            Edit in Settings
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Unit Price</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Qty</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Direct Cost</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {order.orderCategories.map((oc) => (
                <tr key={oc.id} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{oc.categoryName}</td>
                  <td className="px-6 py-4 text-sm text-right">¥{oc.priceSnapshot.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right">{oc.quantity}</td>
                  <td className="px-6 py-4 text-sm text-right text-on-surface-variant">¥{oc.directCost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-right">
                    ¥{(oc.directCost * oc.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-container-low/50">
                <td className="px-6 py-4 text-sm font-bold" colSpan={4}>Total Direct Cost</td>
                <td className="px-6 py-4 text-sm font-bold text-right text-primary">
                  ¥{totalDirectCost.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </main>
  );
}
