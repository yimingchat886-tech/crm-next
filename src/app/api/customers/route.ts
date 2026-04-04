import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
    });
    return Response.json({ data: customers });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, status } = body;

    if (!name) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: String(name),
        description: description ?? null,
        status: status ?? null,
      },
    });

    return Response.json({ data: customer }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
