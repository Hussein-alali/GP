"use client";

import React, { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/context/LanguageContext";

export default function ChatBotPage() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: isRTL
        ? "مرحبا! أنا مساعدك العقاري. اسألني عن السعر أو المنطقة أو نوع العقار."
        : "Hi! I am your real-estate assistant. Ask me about price, location, or property type.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const historyForApi = useMemo(
    () =>
      messages.slice(1).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      })),
    [messages]
  );

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: historyForApi }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setMessages((prev) => [...prev, { sender: "ai", text: data.text }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: isRTL ? "تعذر الاتصال بخدمة الذكاء." : "Failed to reach AI service." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f9" }} dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "130px 20px 30px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            height: "70vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #e5e7eb", fontWeight: 700 }}>
            {isRTL ? "مساعد العقارات الذكي" : "Smart Real Estate Assistant"}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  whiteSpace: "pre-wrap",
                  background: m.sender === "user" ? "#008ccf" : "#eef2f7",
                  color: m.sender === "user" ? "#fff" : "#111827",
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && <div style={{ color: "#6b7280", fontSize: "14px" }}>{isRTL ? "جاري الكتابة..." : "Typing..."}</div>}
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", padding: "12px", display: "flex", gap: "10px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder={isRTL ? "اكتب سؤالك..." : "Ask about properties..."}
              style={{
                flex: 1,
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                padding: "10px 12px",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "0 16px",
                background: "#004d7a",
                color: "#fff",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {isRTL ? "إرسال" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
