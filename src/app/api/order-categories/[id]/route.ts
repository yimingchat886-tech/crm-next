import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { priceSnapshot, quantity, progress } = body;

    const orderCategory = await prisma.orderCategory.update({
      where: { id: Number(id) },
      data: {
        ...(priceSnapshot !== undefined && { priceSnapshot }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(progress !== undefined && { progress: String(progress) }),
      },
      include: { category: true },
    });

    return Response.json({ data: orderCategory });
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
    await prisma.orderCategory.delete({ where: { id: Number(id) } });
    return Response.json({ data: { id: Number(id) } });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
