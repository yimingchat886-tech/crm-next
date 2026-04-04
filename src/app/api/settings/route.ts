import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const result = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return Response.json({ data: result });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: Record<string, string> = await request.json();

    await prisma.$transaction(
      Object.entries(body).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    const updated = await prisma.setting.findMany();
    const result = Object.fromEntries(updated.map((s) => [s.key, s.value]));
    return Response.json({ data: result });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
