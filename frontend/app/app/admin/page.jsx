"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/context/LanguageContext";

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

export default function AdminPage() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const router = useRouter();

  const [adminId, setAdminId] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
    if (!stored?.id) {
      router.replace("/login");
      return;
    }
    setAdminId(stored.id);
  }, [router]);

  useEffect(() => {
    if (!adminId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [s, u, p] = await Promise.all([
          apiFetch(`/api/admin/stats?admin_id=${adminId}`),
          apiFetch(`/api/admin/users?admin_id=${adminId}`),
          apiFetch(`/api/admin/properties?admin_id=${adminId}`),
        ]);
        setStats(s);
        setUsers(Array.isArray(u) ? u : []);
        setProperties(Array.isArray(p) ? p : []);
        setError("");
      } catch (err) {
        setError(err.message || (isRTL ? "فشل التحميل. تأكد من صلاحيات المدير." : "Failed to load. Ensure admin permissions."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [adminId]);

  const updateUserRole = async (userId, role) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/role?role=${role}&admin_id=${adminId}`, { method: "PUT" });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (err) {
      alert(err.message);
    }
  };

  const updatePropertyStatus = async (propId, status) => {
    try {
      await apiFetch(`/api/admin/properties/${propId}/status?status=${status}&admin_id=${adminId}`, { method: "PUT" });
      setProperties((prev) => prev.map((p) => (p.id === propId ? { ...p, status } : p)));
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteProperty = async (propId) => {
    if (!confirm(isRTL ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) return;
    try {
      await apiFetch(`/api/admin/properties/${propId}?admin_id=${adminId}`, { method: "DELETE" });
      setProperties((prev) => prev.filter((p) => p.id !== propId));
    } catch (err) {
      alert(err.message);
    }
  };

  const cardStyle = (color) => ({
    background: "#fff",
    borderRadius: 16,
    padding: "24px 20px",
    textAlign: "center",
    borderTop: `4px solid ${color}`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
  });

  const tabStyle = (active) => ({
    padding: "10px 20px",
    border: "none",
    borderRadius: 10,
    background: active ? "#004d7a" : "#f0f4f8",
    color: active ? "#fff" : "#374151",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.9rem",
  });

  return (
    <div style={{ backgroundColor: "#f4f7f9", minHeight: "100vh" }} dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "130px 20px 60px" }}>
        <h1 style={{ color: "#004d7a", fontWeight: 800, fontSize: "2rem", marginBottom: 28 }}>
          {isRTL ? "لوحة تحكم المدير" : "Admin Dashboard"}
        </h1>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "16px 20px", color: "#dc2626", marginBottom: 24 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            {isRTL ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 28 }}>
                <div style={cardStyle("#008ccf")}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#004d7a" }}>{stats.total_users}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 4 }}>{isRTL ? "مستخدمين" : "Users"}</div>
                </div>
                <div style={cardStyle("#10b981")}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#065f46" }}>{stats.total_properties}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 4 }}>{isRTL ? "عقارات" : "Properties"}</div>
                </div>
                <div style={cardStyle("#3b82f6")}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#1e3a8a" }}>{stats.available_properties}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 4 }}>{isRTL ? "متاح" : "Available"}</div>
                </div>
                <div style={cardStyle("#f59e0b")}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#92400e" }}>{stats.sold_properties}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 4 }}>{isRTL ? "مباع" : "Sold"}</div>
                </div>
                <div style={cardStyle("#8b5cf6")}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#4c1d95" }}>{stats.rented_properties}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 4 }}>{isRTL ? "مؤجر" : "Rented"}</div>
                </div>
                <div style={cardStyle("#ec4899")}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#831843" }}>{stats.total_messages}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 4 }}>{isRTL ? "رسائل" : "Messages"}</div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <button style={tabStyle(tab === "users")} onClick={() => setTab("users")}>
                {isRTL ? "المستخدمون" : "Users"}
              </button>
              <button style={tabStyle(tab === "properties")} onClick={() => setTab("properties")}>
                {isRTL ? "العقارات" : "Properties"}
              </button>
            </div>

            {/* Users table */}
            {tab === "users" && (
              <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["ID", isRTL ? "الاسم" : "Username", isRTL ? "البريد" : "Email", isRTL ? "الهاتف" : "Phone", isRTL ? "الدور" : "Role", isRTL ? "العقارات" : "Props", isRTL ? "إجراء" : "Action"].map((h) => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: isRTL ? "right" : "left", fontSize: "0.85rem", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5edf6" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #f0f4f8" }}>
                        <td style={{ padding: "12px 14px", fontSize: "0.88rem", color: "#374151" }}>{u.id}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: "#004d7a" }}>{u.username}</td>
                        <td style={{ padding: "12px 14px", fontSize: "0.85rem", color: "#6b7280" }}>{u.email}</td>
                        <td style={{ padding: "12px 14px", fontSize: "0.85rem", color: "#6b7280" }}>{u.phone || "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700,
                            background: u.role === "admin" ? "#dbeafe" : u.role === "suspended" ? "#fef2f2" : "#f0fdf4",
                            color: u.role === "admin" ? "#1e40af" : u.role === "suspended" ? "#dc2626" : "#15803d",
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#374151" }}>{u.properties_count}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: "0.83rem", cursor: "pointer" }}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                            <option value="suspended">suspended</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Properties table */}
            {tab === "properties" && (
              <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["ID", isRTL ? "النوع" : "Type", isRTL ? "الموقع" : "Location", isRTL ? "السعر" : "Price", isRTL ? "الحالة" : "Status", isRTL ? "المالك" : "Owner", isRTL ? "إجراء" : "Action"].map((h) => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: isRTL ? "right" : "left", fontSize: "0.85rem", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5edf6" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f0f4f8" }}>
                        <td style={{ padding: "12px 14px", fontSize: "0.88rem", color: "#374151" }}>{p.id}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: "#004d7a" }}>{p.type}</td>
                        <td style={{ padding: "12px 14px", fontSize: "0.85rem", color: "#6b7280" }}>{p.location}</td>
                        <td style={{ padding: "12px 14px", fontSize: "0.85rem" }}>{Number(p.price).toLocaleString()} {isRTL ? "ج.م" : "EGP"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700,
                            background: p.status === "available" ? "#f0fdf4" : p.status === "sold" ? "#fef2f2" : "#fef9c3",
                            color: p.status === "available" ? "#15803d" : p.status === "sold" ? "#dc2626" : "#92400e",
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "0.85rem" }}>{p.owner_name || `#${p.owner_id}`}</td>
                        <td style={{ padding: "12px 14px", display: "flex", gap: 6 }}>
                          <select
                            value={p.status}
                            onChange={(e) => updatePropertyStatus(p.id, e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: "0.83rem", cursor: "pointer" }}
                          >
                            <option value="available">available</option>
                            <option value="sold">sold</option>
                            <option value="rented">rented</option>
                          </select>
                          <button
                            onClick={() => deleteProperty(p.id)}
                            style={{ padding: "4px 10px", border: "none", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontWeight: 700, cursor: "pointer", fontSize: "0.83rem" }}
                          >
                            {isRTL ? "حذف" : "Del"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
