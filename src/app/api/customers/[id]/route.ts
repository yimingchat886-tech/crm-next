import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, status } = body;

    const customer = await prisma.customer.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name: String(name) }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
    });

    return Response.json({ data: customer });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
