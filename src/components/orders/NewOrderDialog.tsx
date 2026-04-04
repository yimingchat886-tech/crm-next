"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Customer = { id: number; name: string };
type Category = { id: number; name: string; unitPrice: number };

export default function NewOrderDialog({
  customers,
  categories,
}: {
  customers: Customer[];
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedCategories, setSelectedCategories] = useState<
    { categoryId: number; quantity: number }[]
  >([]);

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.some((c) => c.categoryId === id)
        ? prev.filter((c) => c.categoryId !== id)
        : [...prev, { categoryId: id, quantity: 1 }]
    );
  };

  const updateQty = (id: number, qty: number) => {
    setSelectedCategories((prev) =>
      prev.map((c) => (c.categoryId === id ? { ...c, quantity: qty } : c))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      let resolvedCustomerId = Number(customerId);

      // Create new customer if needed
      if (!customerId && newCustomerName.trim()) {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCustomerName.trim() }),
        });
        const json = await res.json();
        if ("error" in json) throw new Error(json.error);
        resolvedCustomerId = json.data.id;
      }

      if (!resolvedCustomerId) {
        setError("Please select or enter a customer.");
        setSaving(false);
        return;
      }

      // Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: resolvedCustomerId,
          orderDate: new Date(orderDate).toISOString(),
        }),
      });
      const orderJson = await orderRes.json();
      if ("error" in orderJson) throw new Error(orderJson.error);
      const orderId = orderJson.data.id;

      // Add order categories
      for (const cat of selectedCategories) {
        await fetch("/api/order-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            categoryId: cat.categoryId,
            quantity: cat.quantity,
          }),
        });
      }

      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCustomerId("");
    setNewCustomerName("");
    setOrderDate(new Date().toISOString().split("T")[0]);
    setSelectedCategories([]);
    setError("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-primary to-primary-dim text-on-primary px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        New Order
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            onClick={() => { setOpen(false); resetForm(); }}
          />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.06)] w-full max-w-lg z-10 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-2xl font-extrabold text-on-surface">New Order</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Create a new customer order
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
              {/* Customer */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-outline">
                  Customer
                </label>
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    if (e.target.value) setNewCustomerName("");
                  }}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  <option value="">-- Select existing --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {!customerId && (
                  <input
                    type="text"
                    placeholder="Or enter new customer name"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder:text-outline"
                  />
                )}
              </div>

              {/* Order Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-outline">
                  Order Date
                </label>
                <input
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-outline">
                    Categories
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {categories.map((cat) => {
                      const sel = selectedCategories.find(
                        (c) => c.categoryId === cat.id
                      );
                      return (
                        <div
                          key={cat.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                            sel
                              ? "bg-primary/10 ring-1 ring-primary/30"
                              : "bg-surface-container-low hover:bg-surface-container"
                          }`}
                          onClick={() => toggleCategory(cat.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                sel ? "bg-primary border-primary" : "border-outline-variant"
                              }`}
                            >
                              {sel && (
                                <span className="material-symbols-outlined text-on-primary text-xs">
                                  check
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-on-surface-variant">
                              ¥{cat.unitPrice.toLocaleString("zh-CN")}
                            </span>
                            {sel && (
                              <input
                                type="number"
                                min={1}
                                value={sel.quantity}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  updateQty(cat.id, Number(e.target.value))
                                }
                                className="w-14 text-xs text-center bg-surface-container-lowest border border-outline-variant/30 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-error bg-error-container/10 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); resetForm(); }}
                  className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dim text-on-primary rounded-lg font-semibold text-sm shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
