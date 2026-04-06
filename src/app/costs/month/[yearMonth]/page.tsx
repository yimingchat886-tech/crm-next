import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MonthCostsClient from "@/components/costs/MonthCostsClient";

function toNum(d: { toNumber(): number } | number): number {
  return typeof d === "number" ? d : d.toNumber();
}

export default async function MonthCostsPage({
  params,
}: {
  params: Promise<{ yearMonth: string }>;
}) {
  const { yearMonth } = await params;

  // Validate format YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return notFound();

  const [year, month] = yearMonth.split("-").map(Number);
  if (month < 1 || month > 12) return notFound();

  const monthStart = new Date(Date.UTC(year, month - 1, 1));

  const [costs, settings] = await Promise.all([
    prisma.cost.findMany({
      where: { month: monthStart },
      orderBy: { createdAt: "desc" },
    }),
    prisma.setting.findMany(),
  ]);

  const settingMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const serializedCosts = costs.map((c) => ({
    id: c.id,
    costType: c.costType as "CONSUMABLES" | "MONTHLY_FIXED",
    name: c.name,
    amount: toNum(c.amount),
    month: c.month.toISOString(),
    imagePath: c.imagePath,
    llmRaw: c.llmRaw,
    confirmed: c.confirmed,
  }));

  return (
    <MonthCostsClient
      yearMonth={yearMonth}
      costs={serializedCosts}
      settings={settingMap}
    />
  );
}
