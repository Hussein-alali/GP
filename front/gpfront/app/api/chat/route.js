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

function extractTerms(text) {
  return toText(text)
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

function extractBudget(message) {
  const matches = String(message || "").match(/\d+(?:[.,]\d+)?/g);
  if (!matches || !matches.length) return null;

  const budget = Number(matches[matches.length - 1].replace(/,/g, ""));
  return Number.isFinite(budget) ? budget : null;
}

function extractRecentUserContext(history) {
  return (Array.isArray(history) ? history : [])
    .filter((m) => m && m.role === "user" && m.text)
    .slice(-4)
    .map((m) => String(m.text))
    .join(" ");
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

function propertyTextBlob(property) {
  return [property.type, property.location, property.description]
    .map(toText)
    .join(" ");
}

function scorePropertyForIntent(property, userIntentText, budget) {
  const blob = propertyTextBlob(property);
  const terms = extractTerms(userIntentText);

  let score = 0;
  for (const term of terms) {
    if (blob.includes(term)) score += 2;
  }

  const price = Number(property.price || 0);
  if (budget != null && Number.isFinite(price)) {
    if (price <= budget) score += 3;
    else score -= 3;
  }

  if (Number.isFinite(price) && price > 0) {
    score += Math.max(0, 2 - price / 10_000_000);
  }

  return score;
}

function selectSuggestedProperties(intentText, properties, budget) {
  return [...properties]
    .map((p) => ({ property: p, score: scorePropertyForIntent(p, intentText, budget) }))
    .sort((a, b) => b.score - a.score || Number(a.property.price || 0) - Number(b.property.price || 0))
    .slice(0, 5)
    .map((x) => x.property);
}

function selectMemoryProperties(intentText, properties, budget) {
  return [...properties]
    .map((p) => ({ property: p, score: scorePropertyForIntent(p, intentText, budget) }))
    .sort((a, b) => b.score - a.score || Number(a.property.price || 0) - Number(b.property.price || 0))
    .slice(0, 20)
    .map((x) => x.property);
}

function buildMemorySummary(intentText, budget, memoryProperties) {
  const hasBudget = budget != null ? `Budget hint: ${budget}` : "Budget hint: not specified";
  const typeCounts = {};
  for (const p of memoryProperties) {
    const type = String(p.type || "unknown").toLowerCase();
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t, c]) => `${t}(${c})`)
    .join(", ");

  return {
    user_intent: intentText,
    budget: budget,
    budget_note: hasBudget,
    top_types_in_memory: topTypes || "n/a",
    memory_count: memoryProperties.length,
  };
}

function buildPropertiesSnapshot(properties) {
  return properties.map((p) => ({
    id: p.id,
    type: p.type,
    location: p.location,
    price: p.price,
    area: p.area,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    description: p.description || "",
  }));
}

async function fetchPropertiesFromDb() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/real_estate/?list_images=false`, {
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
    const recentUserContext = extractRecentUserContext(history);
    const intentText = `${recentUserContext} ${String(message)}`.trim();
    const budget = extractBudget(intentText);
    const memoryProperties = selectMemoryProperties(intentText, properties, budget);
    const propertiesSnapshot = buildPropertiesSnapshot(memoryProperties);
    const memorySummary = buildMemorySummary(intentText, budget, memoryProperties);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction:
        "You are a real-estate assistant for SMART ESTATE. Treat provided DB memory as source of truth. Never invent properties not present in memory. If no property fits, say it clearly and suggest closest options.",
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
      "DB memory summary (JSON):",
      JSON.stringify(memorySummary),
      "",
      "Real-estate memory records (JSON):",
      JSON.stringify(propertiesSnapshot),
      "",
      "User question:",
      String(message),
      "",
      "Response rules: mention concrete property IDs when recommending.",
    ].join("\n");

    const result = await chat.sendMessage(contextualPrompt);
    let responseText = result.response.text();

    if (isRecommendationRequest(message) && properties.length) {
      const suggested = selectSuggestedProperties(intentText, properties, budget);
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
