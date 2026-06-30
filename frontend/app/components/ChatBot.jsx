"use client";
import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

function renderMessageText(text, isUserMessage) {
  const parts = String(text || "").split(/(https?:\/\/[^\s]+)/g);

  return parts.map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return part;

    return (
      <a
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: isUserMessage ? "#fff" : "#005f99",
          fontWeight: 700,
          textDecoration: "underline",
          overflowWrap: "anywhere",
        }}
      >
        {part}
      </a>
    );
  });
}

function getStoredUser() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export default function ChatBot() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [open, setOpen] = useState(false);
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
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setLoading(true);

    try {
      const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const storedUser = getStoredUser();
      const userId = Number(storedUser?.id || 0) || null;

      const history = messages.slice(1).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ message: text, history, userId }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.ok
            ? data.text
            : data.error || (isRTL ? "تعذر الاتصال." : "Failed to connect."),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: isRTL ? "تعذر الاتصال." : "Failed to connect." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 28,
          [isRTL ? "left" : "right"]: 28,
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #004d7a, #008ccf)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,77,122,0.4)",
          zIndex: 1000,
        }}
        aria-label="Toggle chat"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          dir={isRTL ? "rtl" : "ltr"}
          style={{
            position: "fixed",
            bottom: 100,
            [isRTL ? "left" : "right"]: 20,
            width: 360,
            maxHeight: 520,
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            zIndex: 999,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #004d7a, #008ccf)", padding: "14px 18px", color: "#fff" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
              {isRTL ? "مساعد العقارات الذكي" : "Smart Real Estate Assistant"}
            </div>
            <div style={{ fontSize: "0.75rem", opacity: 0.85 }}>
              {isRTL ? "متاح الآن" : "Online now"}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.sender === "user" ? (isRTL ? "flex-start" : "flex-end") : (isRTL ? "flex-end" : "flex-start"),
                  maxWidth: "82%",
                  padding: "9px 12px",
                  borderRadius: 12,
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: m.sender === "user" ? "#008ccf" : "#f0f4f8",
                  color: m.sender === "user" ? "#fff" : "#1a1a2e",
                }}
              >
                {renderMessageText(m.text, m.sender === "user")}
              </div>
            ))}
            {loading && (
              <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                {isRTL ? "جاري الكتابة..." : "Typing..."}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: "1px solid #e5e7eb", padding: "10px 12px", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder={isRTL ? "اكتب سؤالك..." : "Ask about properties..."}
              style={{
                flex: 1,
                border: "1px solid #d1d5db",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
            <button
              onClick={send}
              disabled={loading}
              style={{
                border: "none",
                borderRadius: 10,
                padding: "0 14px",
                background: loading ? "#94a3b8" : "#004d7a",
                color: "#fff",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.85rem",
              }}
            >
              {isRTL ? "إرسال" : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
