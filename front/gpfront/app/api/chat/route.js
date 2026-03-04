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
    link: `${FRONT_BASE_URL}/properties/${p.id}`, // Add this line
    owner_name: p.owner_name || "",
    owner_phone: p.owner_phone || "",
  }));
}

async function fetchUserProfileFromDb(userId, authHeader = "") {
  const id = Number(userId || 0);
  if (!id) return null;

  try {
    const headers = {};
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const res = await fetch(`${API_BASE_URL}/api/user/user/${id}/profile`, {
      method: "GET",
      cache: "no-store",
      headers,
    });
    if (!res.ok) return null;

    const data = await res.json();
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

async function enrichPropertiesWithOwnerContact(properties, authHeader = "") {
  if (!Array.isArray(properties) || !properties.length) return [];

  const ownerIds = [...new Set(
    properties
      .map((p) => Number(p?.owner_id || 0))
      .filter((id) => Number.isInteger(id) && id > 0)
  )];

  const ownerEntries = await Promise.all(
    ownerIds.map(async (ownerId) => {
      const profile = await fetchUserProfileFromDb(ownerId, authHeader);
      return [
        ownerId,
        {
          owner_name: profile?.username || "",
          owner_phone: profile?.phone || "",
        },
      ];
    })
  );

  const ownerMap = new Map(ownerEntries);
  return properties.map((p) => {
    const ownerInfo = ownerMap.get(Number(p?.owner_id || 0)) || {};
    return {
      ...p,
      owner_name: ownerInfo.owner_name || "",
      owner_phone: ownerInfo.owner_phone || "",
    };
  });
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

  const lines = suggestedProperties.map((p) => {
    const name = p.owner_name || "Owner";
    const phone = p.owner_phone || "N/A";
    const propertyUrl = `${FRONT_BASE_URL}/properties/${p.id}`;
    
    // Markdown format: [Visible Text](Actual Link)
    return `- ${p.type || "Property"} in ${p.location || "Unknown"}: ${propertyUrl} | Contact: ${name} (${phone})`;
  });

  return `\n\nSuggested Properties:\n${lines.join("\n")}`;
}

function normalizeGeneratedLinks(text) {
  return String(text || "")
    .replace(/\*\*\((https?:\/\/[^\s)]+)\)\*\*/g, "$1")
    .replace(/\((https?:\/\/[^\s)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$2")
    .replace(/<(https?:\/\/[^\s>]+)>/g, "$1")
    .replace(/(https?:\/\/[^\s)\],;!?]+)[)\],;!?]+/g, "$1");
}

export async function POST(req) {
  try {
    const { message, history = [], userId } = await req.json();

    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const authHeader = String(req.headers.get("authorization") || "");
    const rawProperties = await fetchPropertiesFromDb();
    const properties = await enrichPropertiesWithOwnerContact(rawProperties, authHeader);
    const recentUserContext = extractRecentUserContext(history);
    const intentText = `${recentUserContext} ${String(message)}`.trim();
    const budget = extractBudget(intentText);
    const memoryProperties = selectMemoryProperties(intentText, properties, budget);
    const propertiesSnapshot = buildPropertiesSnapshot(memoryProperties);
    const memorySummary = buildMemorySummary(intentText, budget, memoryProperties);
    const currentUserProfile = await fetchUserProfileFromDb(userId, authHeader);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `
    You are a real-estate assistant for SMART ESTATE. 
    1. For every property you mention, provide a plain direct URL.
    2. URL format must be: ${FRONT_BASE_URL}/properties/{id}
    3. Do not wrap URLs in parentheses, markdown, or angle brackets.
    3. Treat the provided DB memory as source of truth.
    4. Never invent properties not present in memory.
  `,
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
      "Current user profile from DB (JSON):",
      JSON.stringify(
        currentUserProfile || {
          id: Number(userId || 0) || null,
          username: "",
          phone: "",
        }
      ),
      "",
      "User question:",
      String(message),
      "",
      "Response rules: do not show property IDs in normal text. When user asks to contact seller, use owner_name and owner_phone from DB memory only. Print links as plain URLs like ${FRONT_BASE_URL}/properties/{id} and never inside parentheses.",
    ].join("\n");

    const result = await chat.sendMessage(contextualPrompt);
    let responseText = result.response.text();
    responseText = responseText
      .replace(/\bProperty\s*#\s*\d+\b/gi, "Property")
      .replace(/\(\s*ID\s*:\s*\d+\s*\)/gi, "")
      .replace(/\bID\s*:\s*\d+\b/gi, "");
    responseText = normalizeGeneratedLinks(responseText);

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


