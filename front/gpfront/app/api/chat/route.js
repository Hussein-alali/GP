import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();

    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction:
        "You are a helpful real-estate assistant for SMART ESTATE. Be concise, practical, and safe.",
    });

    const chat = model.startChat({
      history: history
        .filter((m) => m && (m.role === "user" || m.role === "model") && m.text)
        .map((m) => ({
          role: m.role,
          parts: [{ text: String(m.text) }],
        })),
    });

    const result = await chat.sendMessage(String(message));
    return NextResponse.json({ text: result.response.text() });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
