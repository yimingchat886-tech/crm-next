import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CostsClient from "@/components/costs/CostsClient";
import type { CostType, PaymentStatus } from "@/types";

function toNum(d: { toNumber(): number } | number): number {
  return typeof d === "number" ? d : d.toNumber();
}

export default async function CostsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const id = Number(orderId);
  if (isNaN(id)) return notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      orderCategories: { include: { category: true } },
    },
  });

  if (!order) return notFound();

  // Fetch costs for the order's month
  const monthStart = new Date(order.orderDate);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const costs = await prisma.cost.findMany({
    where: {
      month: {
        gte: monthStart,
        lt: new Date(monthStart.getTime() + 32 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const settings = await prisma.setting.findMany();
  const settingMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const totalReceivable = order.orderCategories.reduce(
    (sum, oc) => sum + toNum(oc.priceSnapshot) * oc.quantity,
    0
  );

  const serializedOrder = {
    id: order.id,
    customer: { id: order.customer.id, name: order.customer.name },
    orderDate: order.orderDate.toISOString(),
    paymentStatus: order.paymentStatus as PaymentStatus,
    depositAmount: toNum(order.depositAmount),
    totalReceivable,
    orderCategories: order.orderCategories.map((oc) => ({
      id: oc.id,
      categoryId: oc.categoryId,
      categoryName: oc.category.name,
      priceSnapshot: toNum(oc.priceSnapshot),
      quantity: oc.quantity,
      directCost: toNum(oc.category.directCost),
    })),
  };

  const serializedCosts = costs.map((c) => ({
    id: c.id,
    costType: c.costType as CostType,
    name: c.name,
    amount: toNum(c.amount),
    month: c.month.toISOString(),
    imagePath: c.imagePath,
    llmRaw: c.llmRaw,
    confirmed: c.confirmed,
  }));

  return (
    <CostsClient
      order={serializedOrder}
      costs={serializedCosts}
      settings={settingMap}
    />
  );
}
