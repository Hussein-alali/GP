import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const FRONT_BASE_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

function toText(value) {
  return String(value || "").toLowerCase();
}

function extractBudget(message) {
  const matches = String(message || "").match(/\d+(?:[.,]\d+)?/g);
  if (!matches || !matches.length) return null;

  const budget = Number(matches[matches.length - 1].replace(/,/g, ""));
  return Number.isFinite(budget) ? budget : null;
}

function isRecommendationRequest(message) {
  const text = toText(message);
  const keywords = [
    "suggest",
    "recommend",
    "show me",
    "find",
    "list",
    "best",
    "properties",
    "????",
    "??????",
    "?????",
    "???",
    "????",
  ];

  return keywords.some((k) => text.includes(k));
}

function propertyMatchesMessage(property, message) {
  const text = toText(message);
  const propertyText = [property.type, property.location, property.description]
    .map(toText)
    .join(" ");

  const budget = extractBudget(message);
  const budgetMatch = budget == null || Number(property.price) <= budget;

  const directKeywordMatch =
    !text ||
    text
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .some((word) => propertyText.includes(word));

  return budgetMatch && directKeywordMatch;
}

function selectSuggestedProperties(message, properties) {
  const matched = properties.filter((p) => propertyMatchesMessage(p, message));
  const source = matched.length ? matched : properties;

  return [...source]
    .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    .slice(0, 5);
}

function buildPropertiesSnapshot(properties) {
  return properties.slice(0, 60).map((p) => ({
    id: p.id,
    type: p.type,
    location: p.location,
    price: p.price,
    area: p.area,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    description: p.description || "",
    images: Array.isArray(p.images) ? p.images : [],
  }));
}

async function fetchPropertiesFromDb() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/real_estate/`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function buildLinksSection(suggestedProperties) {
  if (!suggestedProperties.length) return "";

  const lines = suggestedProperties.map(
    (p) =>
      `- Property #${p.id} (${p.type || "Property"} - ${p.location || "Unknown"}): ${FRONT_BASE_URL}/properties/${p.id}`
  );

  return `\n\nProperty links:\n${lines.join("\n")}`;
}

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

    const properties = await fetchPropertiesFromDb();
    const propertiesSnapshot = buildPropertiesSnapshot(properties);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction:
        "You are a real-estate assistant for SMART ESTATE. Use the provided DB snapshot as source of truth. If no matching property exists, say that clearly. Keep answers concise and practical.",
    });

    const chat = model.startChat({
      history: history
        .filter((m) => m && (m.role === "user" || m.role === "model") && m.text)
        .map((m) => ({
          role: m.role,
          parts: [{ text: String(m.text) }],
        })),
    });

    const contextualPrompt = [
      "Real-estate database snapshot (JSON):",
      JSON.stringify(propertiesSnapshot),
      "",
      "User question:",
      String(message),
    ].join("\n");

    const result = await chat.sendMessage(contextualPrompt);
    let responseText = result.response.text();

    if (isRecommendationRequest(message) && properties.length) {
      const suggested = selectSuggestedProperties(message, properties);
      responseText += buildLinksSection(suggested);
    }

    return NextResponse.json({ text: responseText });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
