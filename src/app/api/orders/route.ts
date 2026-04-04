import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { orderDate: "desc" },
      include: {
        customer: true,
        orderCategories: { include: { category: true } },
      },
    });
    return Response.json({ data: orders });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, orderDate, paymentStatus, depositAmount, folderPath } =
      body;

    if (!customerId || !orderDate) {
      return Response.json(
        { error: "customerId and orderDate are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        customerId: Number(customerId),
        orderDate: new Date(orderDate),
        paymentStatus: paymentStatus ?? "UNPAID",
        depositAmount: depositAmount ?? 0,
        folderPath: folderPath ?? null,
      },
      include: {
        customer: true,
        orderCategories: { include: { category: true } },
      },
    });

    return Response.json({ data: order }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
