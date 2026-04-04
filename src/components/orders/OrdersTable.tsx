"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PaymentStatus } from "@/types";

type OrderCategory = {
  id: number;
  orderId: number;
  categoryId: number;
  categoryName: string;
  priceSnapshot: number;
  quantity: number;
  progress: string;
};

export type OrderRow = {
  id: number;
  customerId: number;
  customer: { id: number; name: string; status: string | null };
  orderDate: string;
  paymentStatus: PaymentStatus;
  depositAmount: number;
  folderPath: string | null;
  createdAt: string;
  orderCategories: OrderCategory[];
  totalReceivable: number;
  balanceDue: number;
  daysSinceOrder: number;
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  DEPOSIT_PAID: "Deposit",
  FULLY_PAID: "Paid",
};

const STATUS_STYLES: Record<PaymentStatus, string> = {
  UNPAID: "bg-error-container/20 text-error",
  DEPOSIT_PAID: "bg-tertiary-container text-on-tertiary-container",
  FULLY_PAID: "bg-secondary-container text-on-secondary-container",
};

const PROGRESS_STYLES: Record<string, string> = {
  "待开始": "bg-surface-container-highest text-on-surface-variant",
  "制作中": "bg-primary-container/30 text-primary",
  "已完成": "bg-secondary-container text-on-secondary-container",
};

function CustomerAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
      {initials}
    </div>
  );
}

function InlinePaymentStatus({
  orderId,
  value,
  onSuccess,
}: {
  orderId: number;
  value: PaymentStatus;
  onSuccess: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = async (next: PaymentStatus) => {
    setSaving(true);
    await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: next }),
    });
    setSaving(false);
    setEditing(false);
    onSuccess();
  };

  if (editing) {
    return (
      <select
        autoFocus
        disabled={saving}
        defaultValue={value}
        onChange={(e) => handleChange(e.target.value as PaymentStatus)}
        onBlur={() => setEditing(false)}
        className="text-xs font-bold px-2 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/30 focus:outline-none cursor-pointer"
      >
        {(["UNPAID", "DEPOSIT_PAID", "FULLY_PAID"] as PaymentStatus[]).map(
          (s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          )
        )}
      </select>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold transition-all hover:opacity-80 ${STATUS_STYLES[value]}`}
    >
      {PAYMENT_STATUS_LABELS[value]}
    </button>
  );
}

function InlineDeposit({
  orderId,
  value,
  onSuccess,
}: {
  orderId: number;
  value: number;
  onSuccess: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value));

  const handleSave = async () => {
    const num = parseFloat(input);
    if (!isNaN(num)) {
      await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositAmount: num }),
      });
      onSuccess();
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={0}
        step={0.01}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        className="w-28 text-sm font-medium text-right bg-surface-container-lowest border border-primary rounded px-2 py-1 focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setInput(String(value));
        setEditing(true);
      }}
      className="text-sm text-right text-on-surface-variant hover:text-on-surface transition-colors"
    >
      ¥{value.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
    </button>
  );
}

const columnHelper = createColumnHelper<OrderRow>();

export default function OrdersTable({
  orders,
  isHost,
}: {
  orders: OrderRow[];
  isHost: boolean;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  // local copy for optimistic updates
  const [data, setData] = useState(orders);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: "Order ID",
      cell: (info) => (
        <span className="font-mono text-sm font-semibold text-primary">
          ORD-{String(info.getValue()).padStart(3, "0")}
        </span>
      ),
    }),
    columnHelper.accessor((row) => row.customer.name, {
      id: "customerName",
      header: "Customer",
      cell: (info) => (
        <div className="flex items-center gap-3">
          <CustomerAvatar name={info.getValue()} />
          <span className="text-sm font-semibold text-on-surface">
            {info.getValue()}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("totalReceivable", {
      header: "Total",
      cell: (info) => (
        <span className="text-sm font-bold">
          ¥{info.getValue().toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
        </span>
      ),
    }),
    columnHelper.accessor("depositAmount", {
      header: "Deposit",
      cell: (info) => (
        <div className="flex justify-end">
          <InlineDeposit
            orderId={info.row.original.id}
            value={info.getValue()}
            onSuccess={refresh}
          />
        </div>
      ),
    }),
    columnHelper.accessor("balanceDue", {
      header: "Balance",
      cell: (info) => (
        <span
          className={`text-sm font-medium text-right block ${
            info.getValue() > 0 ? "text-error" : "text-secondary"
          }`}
        >
          ¥{info.getValue().toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
        </span>
      ),
    }),
    columnHelper.accessor("paymentStatus", {
      header: "Status",
      cell: (info) => (
        <div className="flex justify-center">
          <InlinePaymentStatus
            orderId={info.row.original.id}
            value={info.getValue()}
            onSuccess={refresh}
          />
        </div>
      ),
    }),
    columnHelper.accessor(
      (row) => row.orderCategories[0]?.progress ?? "待开始",
      {
        id: "progress",
        header: "Progress",
        cell: (info) => {
          const progress = info.getValue();
          return (
            <div className="flex justify-center">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  PROGRESS_STYLES[progress] ?? PROGRESS_STYLES["待开始"]
                }`}
              >
                {progress}
              </span>
            </div>
          );
        },
      }
    ),
    columnHelper.accessor("daysSinceOrder", {
      header: "Days",
      cell: (info) => (
        <span className="text-xs text-on-surface-variant">{info.getValue()}d</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="text-right block">Actions</span>,
      cell: (info) => {
        const order = info.row.original;
        return (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/costs/${order.id}`}
              className="p-1.5 hover:bg-surface-container-lowest rounded-md text-outline hover:text-primary transition-all"
              title="Cost accounting"
            >
              <span className="material-symbols-outlined text-lg">receipt_long</span>
            </Link>
            {isHost && order.folderPath && (
              <button
                className="p-1.5 hover:bg-surface-container-lowest rounded-md text-outline hover:text-primary transition-all"
                title="Open folder"
                onClick={() => {
                  fetch("/api/orders/" + order.id + "?action=openFolder").catch(
                    () => {}
                  );
                }}
              >
                <span className="material-symbols-outlined text-lg">folder_open</span>
              </button>
            )}
          </div>
        );
      },
    }),
  ], [isHost, refresh]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  // keep data in sync with server refreshes
  useEffect(() => {
    if (orders !== data && orders.length !== data.length) {
      setData(orders);
    }
  }, [orders, data]);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/10">
      {/* Toolbar */}
      <div className="p-4 flex items-center justify-between border-b border-surface-container">
        <div className="flex items-center gap-4">
          <span className="text-sm text-outline-variant">
            {table.getFilteredRowModel().rows.length} order
            {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
          </span>
        </div>
        <input
          type="text"
          placeholder="Filter orders..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg bg-surface-container-low border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 placeholder:text-outline"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-surface-container-low/50">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() === "asc" && (
                        <span className="material-symbols-outlined text-sm">arrow_upward</span>
                      )}
                      {header.column.getIsSorted() === "desc" && (
                        <span className="material-symbols-outlined text-sm">arrow_downward</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center text-on-surface-variant text-sm"
                >
                  No orders found. Create your first order!
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-primary/5 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-primary border-b border-surface-container last:border-b-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-surface-container-low/30 border-t border-surface-container flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-xs font-bold text-outline uppercase tracking-wider">
            Rows:
          </label>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="bg-transparent border-none text-xs font-bold text-on-surface focus:ring-0 cursor-pointer"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-outline-variant">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            –
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 hover:bg-surface-container rounded-md disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 hover:bg-surface-container rounded-md text-primary disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
