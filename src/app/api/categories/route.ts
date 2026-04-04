import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return Response.json({ data: categories });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, unitPrice, directCost } = body;

    if (!name || unitPrice === undefined) {
      return Response.json(
        { error: "name and unitPrice are required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: String(name),
        unitPrice: unitPrice,
        directCost: directCost ?? 0,
      },
    });

    return Response.json({ data: category }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
