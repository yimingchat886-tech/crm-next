import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

const EXTRACT_PROMPT = `You are a receipt/invoice parser. Extract the cost information from this image.
Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{"name":"<item or vendor name>","amount":<number>,"costType":"CONSUMABLES"}
- name: short descriptive name of the expense (in Chinese if the receipt is in Chinese)
- amount: numeric total amount (no currency symbol)
- costType: always "CONSUMABLES" for receipts`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const month = formData.get("month") as string | null;

    if (!imageFile) {
      return Response.json({ error: "image field is required" }, { status: 400 });
    }

    // Convert image to base64 for Ollama
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Save image file for later reference
    let savedImagePath: string | null = null;
    try {
      const uploadsDir = path.join(process.cwd(), "uploads");
      await mkdir(uploadsDir, { recursive: true });
      const ext = imageFile.name.split(".").pop() ?? "jpg";
      const filename = `${Date.now()}.${ext}`;
      await writeFile(path.join(uploadsDir, filename), Buffer.from(arrayBuffer));
      savedImagePath = `/uploads/${filename}`;
    } catch {
      // Non-fatal — proceed without saving
    }

    // Call Ollama generate API
    const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llava",
        prompt: EXTRACT_PROMPT,
        images: [base64],
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text();
      return Response.json(
        { error: `Ollama error: ${text}` },
        { status: 502 }
      );
    }

    const ollamaData = await ollamaRes.json();
    const rawText: string = ollamaData.response ?? "";

    // Parse JSON from response
    let parsed: { name: string; amount: number; costType: string } | null = null;
    try {
      // Strip any markdown fences if present
      const jsonStr = rawText.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // Return raw text so client can handle manually
    }

    return Response.json({
      data: {
        parsed,
        llmRaw: rawText,
        imagePath: savedImagePath,
        month: month ?? null,
      },
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
