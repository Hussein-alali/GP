"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/context/LanguageContext";
import { authAPI } from "@/services/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function apiFetch(endpoint, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function MessagesPage() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const router = useRouter();

  const [userId, setUserId] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [tab, setTab] = useState("inbox");
  const [loading, setLoading] = useState(true);

  // New message form
  const [receiverId, setReceiverId] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const stored = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
    if (stored?.id) setUserId(stored.id);
  }, [router]);

  const loadMessages = async (uid) => {
    setLoading(true);
    try {
      const [inboxData, sentData] = await Promise.all([
        apiFetch(`/api/messages/inbox/${uid}`),
        apiFetch(`/api/messages/sent/${uid}`),
      ]);
      setInbox(Array.isArray(inboxData) ? inboxData : []);
      setSent(Array.isArray(sentData) ? sentData : []);
    } catch {
      setInbox([]);
      setSent([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadMessages(userId);
  }, [userId]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSendError("");
    setSendSuccess(false);
    if (!receiverId || !content.trim()) {
      setSendError(isRTL ? "يرجى ملء جميع الحقول." : "Please fill in all fields.");
      return;
    }
    setSending(true);
    try {
      await apiFetch(`/api/messages/send?sender_id=${userId}`, {
        method: "POST",
        body: JSON.stringify({ receiver_id: parseInt(receiverId), content: content.trim() }),
      });
      setSendSuccess(true);
      setReceiverId("");
      setContent("");
      loadMessages(userId);
    } catch (err) {
      setSendError(err.message || (isRTL ? "فشل الإرسال." : "Failed to send."));
    } finally {
      setSending(false);
    }
  };

  const messages = tab === "inbox" ? inbox : sent;

  const formatDate = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleString(isRTL ? "ar-EG" : "en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #d1d5db",
    borderRadius: 10,
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ backgroundColor: "#f4f7f9", minHeight: "100vh" }} dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "130px 20px 60px" }}>
        <h1 style={{ color: "#004d7a", fontWeight: 800, fontSize: "1.8rem", marginBottom: 24 }}>
          {isRTL ? "الرسائل" : "Messages"}
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left: inbox/sent list */}
          <div style={{ background: "#fff", borderRadius: 18, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["inbox", "sent"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    border: "none",
                    borderRadius: 10,
                    background: tab === t ? "#004d7a" : "#f0f4f8",
                    color: tab === t ? "#fff" : "#374151",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {t === "inbox" ? (isRTL ? "الوارد" : "Inbox") : (isRTL ? "المُرسَل" : "Sent")}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", color: "#6b7280", padding: 20 }}>
                {isRTL ? "جاري التحميل..." : "Loading..."}
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>
                {isRTL ? "لا توجد رسائل." : "No messages yet."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: m.is_read === 0 && tab === "inbox" ? "#eaf6ff" : "#f8fafc",
                      border: "1px solid #e5edf6",
                      borderRadius: 12,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#004d7a", fontSize: "0.9rem" }}>
                        {tab === "inbox"
                          ? `${isRTL ? "من:" : "From:"} ${m.sender_name || `#${m.sender_id}`}`
                          : `${isRTL ? "إلى:" : "To:"} ${m.receiver_name || `#${m.receiver_id}`}`}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{formatDate(m.created_at)}</span>
                    </div>
                    <p style={{ margin: 0, color: "#374151", fontSize: "0.9rem", wordBreak: "break-word" }}>{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: compose */}
          <div style={{ background: "#fff", borderRadius: 18, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", height: "fit-content" }}>
            <h2 style={{ color: "#004d7a", fontSize: "1.1rem", fontWeight: 700, marginBottom: 18 }}>
              {isRTL ? "إرسال رسالة جديدة" : "Send New Message"}
            </h2>
            <form onSubmit={handleSend}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 6, fontSize: "0.88rem" }}>
                  {isRTL ? "ID المستقبل" : "Receiver ID"}
                </label>
                <input
                  type="number"
                  style={inputStyle}
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  placeholder={isRTL ? "أدخل ID المستخدم" : "Enter user ID"}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 6, fontSize: "0.88rem" }}>
                  {isRTL ? "الرسالة" : "Message"}
                </label>
                <textarea
                  style={{ ...inputStyle, height: 100, resize: "vertical" }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={isRTL ? "اكتب رسالتك هنا..." : "Write your message here..."}
                />
              </div>

              {sendError && (
                <div style={{ padding: "8px 12px", background: "#fef2f2", borderRadius: 8, color: "#dc2626", marginBottom: 12, fontSize: "0.87rem" }}>
                  {sendError}
                </div>
              )}
              {sendSuccess && (
                <div style={{ padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, color: "#15803d", marginBottom: 12, fontSize: "0.87rem" }}>
                  {isRTL ? "تم الإرسال بنجاح!" : "Message sent successfully!"}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "none",
                  borderRadius: 10,
                  background: sending ? "#94a3b8" : "#004d7a",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? (isRTL ? "جاري الإرسال..." : "Sending...") : (isRTL ? "إرسال" : "Send")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
