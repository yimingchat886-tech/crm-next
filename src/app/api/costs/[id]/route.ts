import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function toMonthStart(value: string | Date): Date {
  const d = new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { costType, name, amount, month, imagePath, llmRaw, confirmed } =
      body;

    const cost = await prisma.cost.update({
      where: { id: Number(id) },
      data: {
        ...(costType !== undefined && { costType }),
        ...(name !== undefined && { name: String(name) }),
        ...(amount !== undefined && { amount }),
        ...(month !== undefined && { month: toMonthStart(month) }),
        ...(imagePath !== undefined && { imagePath }),
        ...(llmRaw !== undefined && { llmRaw }),
        ...(confirmed !== undefined && { confirmed: Boolean(confirmed) }),
      },
    });

    return Response.json({ data: cost });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.cost.delete({ where: { id: Number(id) } });
    return Response.json({ data: { id: Number(id) } });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
