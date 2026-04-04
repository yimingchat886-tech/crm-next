import type {
  Customer,
  Category,
  Order,
  OrderCategory,
  Cost,
  Setting,
  CustomerStatus,
  PaymentStatus,
  CostType,
} from "@/generated/prisma";

// Re-export Prisma types for convenience
export type {
  Customer,
  Category,
  Order,
  OrderCategory,
  Cost,
  Setting,
  CustomerStatus,
  PaymentStatus,
  CostType,
};

// Enriched types used by Server Components
export type OrderWithRelations = Order & {
  customer: Customer;
  orderCategories: (OrderCategory & { category: Category })[];
};

export type OrderCategoryWithCategory = OrderCategory & {
  category: Category;
};

// Computed fields (not stored in DB, calculated at runtime)
export type OrderComputedFields = {
  daysSinceOrder: number;
  totalReceivable: number; // Σ priceSnapshot × quantity
  balanceDue: number; // totalReceivable - depositAmount
};

export type OrderRow = OrderWithRelations & OrderComputedFields;

// API response wrapper
export type ApiResponse<T> = { data: T } | { error: string; code?: string };

// Analytics types
export type KpiData = {
  totalReceivable: number;
  totalCollected: number;
  totalBalanceDue: number;
  grossProfit: number;
};

export type MonthlyData = {
  month: string; // "YYYY-MM"
  revenue: number;
  directCost: number;
  consumables: number;
  monthlyFixed: number;
  grossProfit: number;
  allocatedProfit: number;
};

export type CategoryRevenueData = {
  categoryName: string;
  revenue: number;
  quantity: number;
};

// Frontend label maps
export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  REPEAT_BUYER: "回购",
  REFERRAL: "有人推荐",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "未付",
  DEPOSIT_PAID: "定金已付",
  FULLY_PAID: "全款已付",
};

export const PROGRESS_OPTIONS = ["待开始", "制作中", "已完成"] as const;
export type ProgressOption = (typeof PROGRESS_OPTIONS)[number];
