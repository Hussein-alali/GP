"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

const PROPERTY_TYPES = [
  { id: "apartments",           ar: "شقة",           en: "Apartment" },
  { id: "villas",               ar: "فيلا",           en: "Villa" },
  { id: "studios",              ar: "استوديو",         en: "Studio" },
  { id: "offices",              ar: "مكتب",           en: "Office" },
  { id: "chalets",              ar: "شاليه",          en: "Chalet" },
  { id: "rooms",                ar: "غرفة",           en: "Room" },
  { id: "furnished-apartments", ar: "شقة مفروشة",     en: "Furnished Apartment" },
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
    property_type: "apartments",
    city: "",
    region: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    furnished: false,
    level: "0",
  });
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [showComps, setShowComps] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valTimerRef = useRef(null);

  // Called when user clicks the map — fills city field with reverse-geocoded city name
  const handleMapSelect = useCallback(({ city, address }) => {
    set("city", city || address);
  }, []);

  // Auto-estimate whenever any key field changes (same pattern as add-property)
  useEffect(() => {
    const { property_type, city, area, bedrooms, bathrooms } = form;
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
          body: JSON.stringify({
            property_type,
            city,
            region: form.region,
            area: parseFloat(area),
            bedrooms: parseInt(bedrooms),
            bathrooms: parseInt(bathrooms),
            furnished: form.furnished,
            level: parseInt(form.level) || 0,
          }),
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
  }, [form.property_type, form.city, form.area, form.bedrooms, form.bathrooms, form.region, form.furnished, form.level]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { property_type, city, area, bedrooms, bathrooms } = form;
    if (!area || !bedrooms || !bathrooms || !city || !property_type) {
      setError(isRTL ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill in all required fields.");
      return;
    }
    // result already showing from auto-estimate; button now just forces a fresh fetch
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/valuation/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_type,
          city,
          region: form.region,
          area: parseFloat(area),
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          furnished: form.furnished,
          level: parseInt(form.level) || 0,
        }),
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
  };
  const lbl = { display: "block", marginBottom: 5, fontWeight: 600, color: "#374151", fontSize: "0.85rem" };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }} dir={isRTL ? "rtl" : "ltr"}>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#004d7a,#008ccf)", borderRadius: 20, padding: "36px 32px", color: "#fff", marginBottom: 28, textAlign: "center" }}>
        <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>🏠</div>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0 }}>
          {isRTL ? "تقدير قيمة العقار" : "Property Value Estimator"}
        </h1>
        <p style={{ marginTop: 8, opacity: 0.9, fontSize: "0.95rem" }}>
          {isRTL
            ? "تقدير مبني على عقارات مشابهة فعلية مع إزالة الشذوذات بطريقة IQR"
            : "Comparable-based valuation with IQR outlier removal"}
        </p>
      </div>

      {/* Form */}
      <div style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

            {/* Property Type */}
            <div>
              <label style={lbl}>{isRTL ? "نوع العقار *" : "Property Type *"}</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.property_type} onChange={e => set("property_type", e.target.value)}>
                {PROPERTY_TYPES.map(t => <option key={t.id} value={t.id}>{isRTL ? t.ar : t.en}</option>)}
              </select>
            </div>

            {/* Area */}
            <div>
              <label style={lbl}>{isRTL ? "المساحة (م²) *" : "Area (m²) *"}</label>
              <input type="number" min="10" style={inp} placeholder={isRTL ? "مثال: 120" : "e.g. 120"} value={form.area} onChange={e => set("area", e.target.value)} />
            </div>

            {/* City */}
            <div>
              <label style={lbl}>{isRTL ? "المدينة *" : "City *"}</label>
              <input type="text" style={inp} placeholder={isRTL ? "مثال: القاهرة الجديدة" : "e.g. New Cairo"} value={form.city} onChange={e => set("city", e.target.value)} />
            </div>

            {/* Region */}
            <div>
              <label style={lbl}>{isRTL ? "المنطقة / الحي" : "Region / District"}</label>
              <input type="text" style={inp} placeholder={isRTL ? "مثال: التجمع الخامس" : "e.g. Fifth Settlement"} value={form.region} onChange={e => set("region", e.target.value)} />
            </div>

            {/* Bedrooms */}
            <div>
              <label style={lbl}>{isRTL ? "غرف النوم *" : "Bedrooms *"}</label>
              <input type="number" min="0" max="20" style={inp} placeholder="0" value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} />
            </div>

            {/* Bathrooms */}
            <div>
              <label style={lbl}>{isRTL ? "الحمامات *" : "Bathrooms *"}</label>
              <input type="number" min="0" max="10" style={inp} placeholder="0" value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)} />
            </div>

            {/* Level */}
            <div>
              <label style={lbl}>{isRTL ? "الدور" : "Floor Level"}</label>
              <input type="number" min="0" max="50" style={inp} placeholder="0" value={form.level} onChange={e => set("level", e.target.value)} />
            </div>

            {/* Furnished */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 24 }}>
              <input type="checkbox" id="furnished" checked={form.furnished} onChange={e => set("furnished", e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />
              <label htmlFor="furnished" style={{ fontWeight: 600, color: "#374151", cursor: "pointer", fontSize: "0.9rem" }}>
                {isRTL ? "مفروش" : "Furnished"}
              </label>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2", borderRadius: 10, color: "#dc2626", fontSize: "0.88rem" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", marginTop: 22, padding: "13px", border: "none", borderRadius: 12,
            background: loading ? "#94a3b8" : "linear-gradient(135deg,#004d7a,#008ccf)",
            color: "#fff", fontWeight: 800, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? (isRTL ? "جاري التحليل..." : "Analyzing...") : (isRTL ? "احسب القيمة التقديرية" : "Estimate Value")}
          </button>
        </form>
      </div>

      {/* Map */}
      <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 24 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5edf6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, color: "#004d7a", fontSize: "0.97rem" }}>
            📍 {isRTL ? "حدد الموقع على الخريطة" : "Pin Location on Map"}
          </span>
          {form.city && (
            <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>
              {form.city}
            </span>
          )}
        </div>
        <div style={{ padding: 16 }}>
          <MapPicker onSelect={handleMapSelect} isRTL={isRTL} />
        </div>
      </div>

      {/* Result */}
      {result && (
        <>
          {/* Price range card */}
          <div style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 20 }}>
            <h2 style={{ color: "#004d7a", fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>
              {isRTL ? "نتيجة التقييم" : "Valuation Result"}
            </h2>

            {/* Three price boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {[
                { label: isRTL ? "الحد الأدنى" : "Min Price",      value: result.min_price,      color: "#ef4444", bg: "#fef2f2" },
                { label: isRTL ? "السعر المتوقع" : "Expected Price",  value: result.expected_price, color: "#004d7a", bg: "#eaf6ff" },
                { label: isRTL ? "الحد الأقصى" : "Max Price",      value: result.max_price,      color: "#10b981", bg: "#f0fdf4" },
              ].map((box) => (
                <div key={box.label} style={{ background: box.bg, borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: 6 }}>{box.label}</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 900, color: box.color }}>
                    {Number(box.value).toLocaleString(isRTL ? "ar-EG" : "en-US")}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: 2 }}>{isRTL ? "ج.م" : "EGP"}</div>
                </div>
              ))}
            </div>

            <ConfidenceBar score={result.confidence_score} />

            {/* Stats row */}
            <div style={{ display: "flex", gap: 20, marginTop: 18, flexWrap: "wrap" }}>
              <Stat label={isRTL ? "عقارات مستخدمة" : "Comparables used"} value={result.comparables_used} />
              <Stat label={isRTL ? "شذوذات محذوفة" : "Outliers removed"}  value={result.outliers_removed} />
              {form.area && <Stat label={isRTL ? "سعر المتر" : "Price/m²"} value={`${Math.round(result.expected_price / parseFloat(form.area)).toLocaleString()} ${isRTL ? "ج.م" : "EGP"}`} />}
            </div>

            {result.comparables_used === 0 && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "#fffbeb", borderRadius: 10, color: "#92400e", fontSize: "0.85rem" }}>
                {isRTL
                  ? "⚠️ لا توجد عقارات مشابهة في قاعدة البيانات. التقدير مبني على معدلات السوق."
                  : "⚠️ No comparables found in DB. Estimate is based on market averages."}
              </div>
            )}

          </div>

          {/* Comparable properties table */}
          {result.comparable_properties.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <button
                onClick={() => setShowComps(v => !v)}
                style={{ width: "100%", padding: "16px 20px", background: "none", border: "none", textAlign: isRTL ? "right" : "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, color: "#004d7a", fontSize: "0.97rem" }}
              >
                <span>{isRTL ? `العقارات المقارنة (${result.comparable_properties.length})` : `Comparable Properties (${result.comparable_properties.length})`}</span>
                <span style={{ fontSize: "1.2rem" }}>{showComps ? "▲" : "▼"}</span>
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
                            <a href={comp.url} style={{ color: "#004d7a", fontWeight: 600, textDecoration: "none" }}>{comp.title}</a>
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

          {/* Popular listings in same area from Aqarmap */}
          {result.popular_in_area?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", marginTop: 4 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5edf6", fontWeight: 700, color: "#004d7a", fontSize: "0.97rem", display: "flex", alignItems: "center", gap: 8 }}>
                🔍 {isRTL ? `أبرز العقارات المدرجة في ${form.city}` : `Top Listings in ${form.city}`}
                <span style={{ fontSize: "0.72rem", background: "#eaf6ff", color: "#0369a1", borderRadius: 999, padding: "2px 8px", fontWeight: 600 }}>Aqarmap</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 0 }}>
                {result.popular_in_area.map((listing, i) => (
                  <a
                    key={i}
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block", padding: "14px 18px", borderBottom: "1px solid #f0f4f8", borderRight: "1px solid #f0f4f8", textDecoration: "none", transition: "background 0.15s" }}
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

      {/* Info cards */}
      {!result && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
          {[
            { icon: "📊", title: isRTL ? "بيانات حقيقية" : "Real Comparables",  text: isRTL ? "يبحث في العقارات المدرجة فعلاً" : "Searches actual listed properties" },
            { icon: "🔍", title: isRTL ? "إزالة الشذوذات" : "IQR Outlier Filter", text: isRTL ? "يستبعد الأسعار الشاذة تلقائياً" : "Automatically removes extreme prices" },
            { icon: "⚡", title: isRTL ? "فوري" : "Instant",                    text: isRTL ? "نتائج خلال ثوانٍ" : "Results in seconds" },
          ].map((c, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "20px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", textAlign: "center" }}>
              <div style={{ fontSize: "1.7rem", marginBottom: 8 }}>{c.icon}</div>
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
