"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8003";

const PROPERTY_TYPES = [
  { id: "apartments",           ar: "شقة",           en: "Apartment" },
  { id: "villas",               ar: "فيلا",           en: "Villa" },
  { id: "studios",              ar: "استوديو",         en: "Studio" },
  { id: "offices",              ar: "مكتب",           en: "Office" },
  { id: "chalets",              ar: "شاليه",          en: "Chalet" },
  { id: "rooms",                ar: "غرفة",           en: "Room" },
  { id: "furnished-apartments", ar: "شقة مفروشة",     en: "Furnished Apt" },
];

const FINISHING_OPTIONS = [
  { id: "core",          ar: "خام",               en: "Core / Shell" },
  { id: "semi_finished", ar: "نصف تشطيب",          en: "Semi Finished" },
  { id: "fully_finished",ar: "تشطيب كامل",         en: "Fully Finished" },
  { id: "luxury",        ar: "سوبر لوكس",          en: "Luxury / Super Lux" },
];

const STATUS_OPTIONS = [
  { id: "ready",              ar: "جاهز للسكن",       en: "Ready to Move" },
  { id: "under_construction", ar: "تحت الإنشاء",      en: "Under Construction" },
  { id: "off_plan",           ar: "على الخارطة",      en: "Off-Plan" },
];

const PAYMENT_OPTIONS = [
  { id: "cash",        ar: "كاش",    en: "Cash" },
  { id: "installment", ar: "تقسيط",  en: "Installment" },
];

const AMENITY_LIST = [
  { id: "pool",       ar: "حمام سباحة",  en: "Pool" },
  { id: "gym",        ar: "صالة رياضية", en: "Gym" },
  { id: "security",   ar: "أمن وحراسة",  en: "Security" },
  { id: "clubhouse",  ar: "نادي",        en: "Club House" },
  { id: "parking",    ar: "جراج",        en: "Parking" },
  { id: "elevator",   ar: "أسانسير",     en: "Elevator" },
  { id: "garden",     ar: "حديقة",       en: "Garden" },
  { id: "balcony",    ar: "بلكونة",      en: "Balcony" },
  { id: "central_ac", ar: "تكييف مركزي", en: "Central A/C" },
];

function ConfidenceBar({ score }) {
  const color = score >= 75 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "High" : score >= 40 ? "Medium" : "Low";
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.82rem", color: "#6b7280" }}>
        <span>Confidence</span>
        <span style={{ fontWeight: 700, color }}>{score}/100 · {label}</span>
      </div>
      <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

export default function PricePrediction() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [form, setForm] = useState({
    property_type:   "apartments",
    city:            "",
    region:          "",
    area:            "",
    bedrooms:        "",
    bathrooms:       "",
    furnished:       false,
    level:           "0",
    // ML extras
    reception_rooms:  "1",
    total_floors:     "5",
    handover_year:    "",
    finishing:        "fully_finished",
    property_status:  "ready",
    payment_method:   "cash",
    amenities:        [],
  });

  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [showComps, setShowComps] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleAmenity = (id) =>
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(id)
        ? f.amenities.filter(a => a !== id)
        : [...f.amenities, id],
    }));

  const valTimerRef = useRef(null);

  const handleMapSelect = useCallback(({ city, address }) => {
    set("city", city || address);
  }, []);

  const buildBody = () => ({
    property_type:   form.property_type,
    city:            form.city,
    region:          form.region,
    area:            parseFloat(form.area),
    bedrooms:        parseInt(form.bedrooms),
    bathrooms:       parseInt(form.bathrooms),
    furnished:       form.furnished,
    level:           parseInt(form.level) || 0,
    reception_rooms: parseInt(form.reception_rooms) || 1,
    total_floors:    parseInt(form.total_floors) || 5,
    handover_year:   form.handover_year ? parseInt(form.handover_year) : null,
    finishing:       form.finishing,
    property_status: form.property_status,
    payment_method:  form.payment_method,
    amenities:       form.amenities,
  });

  // Auto-estimate on any field change
  useEffect(() => {
    const { city, area, bedrooms, bathrooms } = form;
    if (!area || !bedrooms || !bathrooms || !city) {
      clearTimeout(valTimerRef.current);
      setResult(null);
      setLoading(false);
      return;
    }
    setResult(null);
    setLoading(true);
    clearTimeout(valTimerRef.current);
    valTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/valuation/estimate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildBody()),
        });
        if (!res.ok) throw new Error(await res.text());
        setResult(await res.json());
        setShowComps(false);
      } catch (err) {
        setError(err.message || (isRTL ? "حدث خطأ." : "An error occurred."));
      } finally {
        setLoading(false);
      }
    }, 800);
    return () => clearTimeout(valTimerRef.current);
  }, [form.property_type, form.city, form.area, form.bedrooms, form.bathrooms,
      form.region, form.furnished, form.level, form.reception_rooms,
      form.total_floors, form.handover_year, form.finishing,
      form.property_status, form.payment_method, form.amenities]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.area || !form.bedrooms || !form.bathrooms || !form.city) {
      setError(isRTL ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill in all required fields.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/valuation/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
      setShowComps(false);
    } catch (err) {
      setError(err.message || (isRTL ? "حدث خطأ." : "An error occurred."));
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", padding: "11px 14px", border: "1.5px solid #d1d5db",
    borderRadius: 10, fontSize: "0.95rem", outline: "none", boxSizing: "border-box",
    background: "#fff",
  };
  const lbl = { display: "block", marginBottom: 5, fontWeight: 600, color: "#374151", fontSize: "0.85rem" };
  const sectionTitle = { fontSize: "0.92rem", fontWeight: 700, color: "#004d7a", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #e5edf6" };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }} dir={isRTL ? "rtl" : "ltr"}>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#004d7a,#008ccf)", borderRadius: 20, padding: "36px 32px", color: "#fff", marginBottom: 28, textAlign: "center" }}>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0 }}>
          {isRTL ? "تقدير قيمة العقار" : "Property Value Estimator"}
        </h1>
        <p style={{ marginTop: 8, opacity: 0.9, fontSize: "0.95rem" }}>
          {isRTL
            ? "نموذج LightGBM مُدرَّب على أكثر من 100,000 صفقة عقارية مصرية"
            : "LightGBM model trained on 100,000+ Egyptian real estate transactions"}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
          {[
            { label: isRTL ? "نموذج LightGBM" : "LightGBM Model", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
            { label: isRTL ? "دقة عالية"      : "MAPE 35%",         icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
            { label: isRTL ? "فوري"           : "Instant",          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          ].map((b, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 30, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              {b.icon} {b.label}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>

          {/* ── Section 1: Core Details ── */}
          <div style={sectionTitle}>{isRTL ? "التفاصيل الأساسية" : "Core Details"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22 }}>
            <div>
              <label style={lbl}>{isRTL ? "نوع العقار *" : "Property Type *"}</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.property_type} onChange={e => set("property_type", e.target.value)}>
                {PROPERTY_TYPES.map(t => <option key={t.id} value={t.id}>{isRTL ? t.ar : t.en}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>{isRTL ? "المساحة (م²) *" : "Area (m²) *"}</label>
              <input type="number" min="10" style={inp} placeholder={isRTL ? "مثال: 120" : "e.g. 120"} value={form.area} onChange={e => set("area", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>{isRTL ? "المدينة *" : "City *"}</label>
              <input type="text" style={inp} placeholder={isRTL ? "مثال: القاهرة الجديدة" : "e.g. New Cairo"} value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>{isRTL ? "المنطقة / الحي" : "Region / District"}</label>
              <input type="text" style={inp} placeholder={isRTL ? "مثال: التجمع الخامس" : "e.g. Fifth Settlement"} value={form.region} onChange={e => set("region", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>{isRTL ? "غرف النوم *" : "Bedrooms *"}</label>
              <input type="number" min="0" max="20" style={inp} placeholder="0" value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>{isRTL ? "الحمامات *" : "Bathrooms *"}</label>
              <input type="number" min="0" max="10" style={inp} placeholder="0" value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>{isRTL ? "غرف المعيشة" : "Reception Rooms"}</label>
              <input type="number" min="0" max="5" style={inp} placeholder="1" value={form.reception_rooms} onChange={e => set("reception_rooms", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>{isRTL ? "الدور" : "Floor Level"}</label>
              <input type="number" min="0" max="50" style={inp} placeholder="0" value={form.level} onChange={e => set("level", e.target.value)} />
            </div>
          </div>

          {/* ── Section 2: Property Details (ML-specific) ── */}
          <div style={sectionTitle}>{isRTL ? "تفاصيل العقار" : "Property Details"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22 }}>
            <div>
              <label style={lbl}>{isRTL ? "التشطيب" : "Finishing"}</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.finishing} onChange={e => set("finishing", e.target.value)}>
                {FINISHING_OPTIONS.map(o => <option key={o.id} value={o.id}>{isRTL ? o.ar : o.en}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>{isRTL ? "حالة العقار" : "Property Status"}</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.property_status} onChange={e => set("property_status", e.target.value)}>
                {STATUS_OPTIONS.map(o => <option key={o.id} value={o.id}>{isRTL ? o.ar : o.en}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>{isRTL ? "طريقة الدفع" : "Payment Method"}</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.payment_method} onChange={e => set("payment_method", e.target.value)}>
                {PAYMENT_OPTIONS.map(o => <option key={o.id} value={o.id}>{isRTL ? o.ar : o.en}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>{isRTL ? "عدد الأدوار الكلي" : "Total Floors in Building"}</label>
              <input type="number" min="1" max="60" style={inp} placeholder="5" value={form.total_floors} onChange={e => set("total_floors", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>{isRTL ? "سنة التسليم" : "Handover Year"}</label>
              <input type="number" min="2000" max="2035" style={inp} placeholder={isRTL ? "مثال: 2024" : "e.g. 2024"} value={form.handover_year} onChange={e => set("handover_year", e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 24 }}>
              <input type="checkbox" id="furnished" checked={form.furnished} onChange={e => set("furnished", e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />
              <label htmlFor="furnished" style={{ fontWeight: 600, color: "#374151", cursor: "pointer", fontSize: "0.9rem" }}>
                {isRTL ? "مفروش" : "Furnished"}
              </label>
            </div>
          </div>

          {/* ── Section 3: Amenities ── */}
          <div style={sectionTitle}>{isRTL ? "المرافق والمميزات" : "Amenities & Features"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 22 }}>
            {AMENITY_LIST.map(a => {
              const active = form.amenities.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAmenity(a.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: active ? "1.5px solid #004d7a" : "1.5px solid #e5e7eb",
                    background: active ? "#eaf4ff" : "#f9fafb",
                    color: active ? "#004d7a" : "#6b7280",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "center",
                  }}
                >
                  {isRTL ? a.ar : a.en}
                </button>
              );
            })}
          </div>

          {error && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2", borderRadius: 10, color: "#dc2626", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 8, border: "1px solid #fecaca" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", marginTop: 22, padding: "13px", border: "none", borderRadius: 12,
            background: loading ? "#94a3b8" : "linear-gradient(135deg,#004d7a,#008ccf)",
            color: "#fff", fontWeight: 800, fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            {loading && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            )}
            {loading ? (isRTL ? "جاري التحليل..." : "Analyzing...") : (isRTL ? "احسب القيمة التقديرية" : "Estimate Value")}
          </button>
        </form>
      </div>

      {/* Map */}
      <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 24 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5edf6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, color: "#004d7a", fontSize: "0.97rem", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004d7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {isRTL ? "حدد الموقع على الخريطة" : "Pin Location on Map"}
          </span>
          {form.city && <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>{form.city}</span>}
        </div>
        <div style={{ padding: 16 }}>
          <MapPicker onSelect={handleMapSelect} isRTL={isRTL} />
        </div>
      </div>

      {/* Result */}
      {result && (
        <>
          {/* ── Main price card ── */}
          <div style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 16 }}>
            <h2 style={{ color: "#004d7a", fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>
              {isRTL ? "نتيجة التقييم" : "Valuation Result"}
            </h2>

            {/* Three price boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {[
                { label: isRTL ? "الحد الأدنى"    : "Min Price",      value: result.min_price,      color: "#ef4444", bg: "#fef2f2" },
                { label: isRTL ? "السعر المتوقع"  : "Expected Price", value: result.expected_price, color: "#004d7a", bg: "#eaf6ff" },
                { label: isRTL ? "الحد الأقصى"    : "Max Price",      value: result.max_price,      color: "#10b981", bg: "#f0fdf4" },
              ].map((box) => (
                <div key={box.label} style={{ background: box.bg, borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: 6 }}>{box.label}</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: box.color }}>
                    {Number(box.value).toLocaleString(isRTL ? "ar-EG" : "en-US")}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: 2 }}>{isRTL ? "ج.م" : "EGP"}</div>
                </div>
              ))}
            </div>

            <ConfidenceBar score={result.confidence_score} />

            <div style={{ display: "flex", gap: 20, marginTop: 18, flexWrap: "wrap" }}>
              <Stat label={isRTL ? "عقارات مستخدمة" : "Comparables"} value={result.comparables_used} />
              <Stat label={isRTL ? "شذوذات محذوفة"  : "Outliers removed"} value={result.outliers_removed} />
              {form.area && <Stat label={isRTL ? "سعر المتر" : "Price/m²"} value={`${Math.round(result.expected_price / parseFloat(form.area)).toLocaleString()} ${isRTL ? "ج.م" : "EGP"}`} />}
            </div>

            {result.comparables_used === 0 && !result.ml_available && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "#fffbeb", borderRadius: 10, color: "#92400e", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {isRTL ? "لا توجد عقارات مشابهة. التقدير مبني على معدلات السوق." : "No comparables found. Estimate is based on market averages."}
              </div>
            )}
          </div>

          {/* ── ML Model breakdown ── */}
          {result.ml_available && (
            <div style={{ background: "#fff", borderRadius: 18, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 16, border: "1.5px solid #e0f0ff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "linear-gradient(135deg,#004d7a,#008ccf)", borderRadius: 10, padding: "8px 10px", display: "flex" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#004d7a", fontSize: "0.97rem" }}>
                    {isRTL ? "تقدير نموذج الذكاء الاصطناعي" : "AI Model Prediction"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                    {isRTL ? "LightGBM — مُدرَّب على 100,000+ عقار مصري" : "LightGBM · trained on 100,000+ Egyptian properties"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: isRTL ? "الحد الأدنى (ML)" : "ML Min",      value: result.ml_price_min, color: "#ef4444", bg: "#fef9f9" },
                  { label: isRTL ? "السعر المتوقع (ML)" : "ML Estimate", value: result.ml_price,    color: "#004d7a", bg: "#f0f7ff" },
                  { label: isRTL ? "الحد الأقصى (ML)" : "ML Max",      value: result.ml_price_max, color: "#10b981", bg: "#f6fef9" },
                ].map((box) => (
                  <div key={box.label} style={{ background: box.bg, borderRadius: 12, padding: "14px 12px", textAlign: "center", border: `1px solid ${box.color}22` }}>
                    <div style={{ fontSize: "0.74rem", color: "#6b7280", marginBottom: 5 }}>{box.label}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: box.color }}>
                      {Number(box.value).toLocaleString(isRTL ? "ar-EG" : "en-US")}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 2 }}>{isRTL ? "ج.م" : "EGP"}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, padding: "8px 12px", background: "#f0f7ff", borderRadius: 8, fontSize: "0.78rem", color: "#4b6cb7" }}>
                {isRTL
                  ? "نطاق السعر: ±10% من التقدير المتوقع"
                  : "Price range: ±10% around the expected estimate"}
              </div>
            </div>
          )}

          {/* ── Comparable properties ── */}
          {result.comparable_properties.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 16 }}>
              <button
                onClick={() => setShowComps(v => !v)}
                style={{ width: "100%", padding: "16px 20px", background: "none", border: "none", textAlign: isRTL ? "right" : "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, color: "#004d7a", fontSize: "0.97rem" }}
              >
                <span>{isRTL ? `العقارات المقارنة (${result.comparable_properties.length})` : `Comparable Properties (${result.comparable_properties.length})`}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: showComps ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              {showComps && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {[isRTL?"العقار":"Property", isRTL?"السعر":"Price", isRTL?"المساحة":"Area", isRTL?"غرف":"Beds", isRTL?"حمامات":"Baths", isRTL?"سعر/م²":"EGP/m²", isRTL?"التشابه":"Similarity"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: isRTL?"right":"left", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5edf6", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparable_properties.map((comp, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f0f4f8" }}>
                          <td style={{ padding: "10px 14px" }}>
                            <a href={comp.url} target="_blank" rel="noopener noreferrer" style={{ color: "#004d7a", fontWeight: 600, textDecoration: "none" }}>{comp.title}</a>
                          </td>
                          <td style={{ padding: "10px 14px" }}>{Number(comp.price).toLocaleString()}</td>
                          <td style={{ padding: "10px 14px" }}>{comp.area} m²</td>
                          <td style={{ padding: "10px 14px" }}>{comp.bedrooms}</td>
                          <td style={{ padding: "10px 14px" }}>{comp.bathrooms}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#004d7a" }}>{Number(comp.price_per_sqm).toLocaleString()}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700, background: comp.similarity_score >= 80 ? "#f0fdf4" : "#fef9c3", color: comp.similarity_score >= 80 ? "#15803d" : "#92400e" }}>
                              {comp.similarity_score}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Popular listings ── */}
          {result.popular_in_area?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5edf6", fontWeight: 700, color: "#004d7a", fontSize: "0.97rem", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004d7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                {isRTL ? `أبرز العقارات في ${form.city}` : `Top Listings in ${form.city}`}
                <span style={{ fontSize: "0.72rem", background: "#eaf6ff", color: "#0369a1", borderRadius: 999, padding: "2px 8px", fontWeight: 600 }}>Dubizzle</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 0 }}>
                {result.popular_in_area.map((listing, i) => (
                  <a
                    key={i}
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block", padding: "14px 18px", borderBottom: "1px solid #f0f4f8", borderRight: "1px solid #f0f4f8", textDecoration: "none", transition: "background 0.15s", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ fontWeight: 800, color: "#004d7a", fontSize: "1rem", marginBottom: 4 }}>
                      {Number(listing.price).toLocaleString()} <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280" }}>{isRTL ? "ج.م" : "EGP"}</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {listing.area} m² · {listing.bedrooms} {isRTL ? "غرف" : "BR"} · {listing.bathrooms} {isRTL ? "حمام" : "Bath"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 3 }}>{listing.title}</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Info cards (shown before any result) */}
      {!result && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
          {[
            {
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#004d7a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polyline points="7 10 10 7 13 10 17 6"/></svg>,
              title: isRTL ? "نموذج LightGBM" : "LightGBM Model",
              text:  isRTL ? "مُدرَّب على أكثر من 100,000 عقار مصري" : "Trained on 100,000+ Egyptian properties"
            },
            {
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#004d7a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
              title: isRTL ? "نطاق ±10%" : "±10% Range",
              text:  isRTL ? "نطاق سعري واقعي حول التقدير المتوقع" : "Realistic price band around the estimate"
            },
            {
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#004d7a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              title: isRTL ? "فوري" : "Instant",
              text:  isRTL ? "نتائج خلال ثوانٍ" : "Results in seconds"
            },
          ].map((c, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "20px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, color: "#004d7a", marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>{c.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: "center", flex: 1, minWidth: 100 }}>
      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{label}</div>
      <div style={{ fontWeight: 800, color: "#004d7a", fontSize: "1.1rem" }}>{value}</div>
    </div>
  );
}
