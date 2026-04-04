import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, categoryId, priceSnapshot, quantity, progress } = body;

    if (!orderId || !categoryId) {
      return Response.json(
        { error: "orderId and categoryId are required" },
        { status: 400 }
      );
    }

    // Use provided priceSnapshot or fall back to category's current unitPrice
    let snapshot = priceSnapshot;
    if (snapshot === undefined) {
      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });
      if (!category) {
        return Response.json({ error: "Category not found" }, { status: 404 });
      }
      snapshot = category.unitPrice;
    }

    const orderCategory = await prisma.orderCategory.create({
      data: {
        orderId: Number(orderId),
        categoryId: Number(categoryId),
        priceSnapshot: snapshot,
        quantity: quantity ?? 1,
        progress: progress ?? "待开始",
      },
      include: { category: true },
    });

    return Response.json({ data: orderCategory }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
