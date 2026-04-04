import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/** Normalize any date to the first day of its month at UTC midnight */
function toMonthStart(value: string | Date): Date {
  const d = new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const monthParam = searchParams.get("month");

    const costs = await prisma.cost.findMany({
      where: monthParam
        ? { month: toMonthStart(monthParam) }
        : undefined,
      orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    });

    return Response.json({ data: costs });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { costType, name, amount, month, imagePath, llmRaw, confirmed } =
      body;

    if (!costType || !name || amount === undefined || !month) {
      return Response.json(
        { error: "costType, name, amount, and month are required" },
        { status: 400 }
      );
    }

    const cost = await prisma.cost.create({
      data: {
        costType,
        name: String(name),
        amount,
        month: toMonthStart(month),
        imagePath: imagePath ?? null,
        llmRaw: llmRaw ?? null,
        confirmed: confirmed ?? false,
      },
    });

    return Response.json({ data: cost }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
