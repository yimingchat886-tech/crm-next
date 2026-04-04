import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { customerId, orderDate, paymentStatus, depositAmount, folderPath } =
      body;

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        ...(customerId !== undefined && { customerId: Number(customerId) }),
        ...(orderDate !== undefined && { orderDate: new Date(orderDate) }),
        ...(paymentStatus !== undefined && { paymentStatus }),
        ...(depositAmount !== undefined && { depositAmount }),
        ...(folderPath !== undefined && { folderPath }),
      },
      include: {
        customer: true,
        orderCategories: { include: { category: true } },
      },
    });

    return Response.json({ data: order });
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
    await prisma.order.delete({ where: { id: Number(id) } });
    return Response.json({ data: { id: Number(id) } });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
