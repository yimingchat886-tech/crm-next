import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, unitPrice, directCost } = body;

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name: String(name) }),
        ...(unitPrice !== undefined && { unitPrice }),
        ...(directCost !== undefined && { directCost }),
      },
    });

    return Response.json({ data: category });
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

    const usageCount = await prisma.orderCategory.count({
      where: { categoryId: Number(id) },
    });

    if (usageCount > 0) {
      return Response.json(
        { error: "Category is referenced by existing orders", code: "IN_USE" },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id: Number(id) } });
    return Response.json({ data: { id: Number(id) } });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
