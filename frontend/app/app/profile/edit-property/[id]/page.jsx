"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import { useRouter, useParams } from "next/navigation";
import { authAPI, realEstateAPI, valuationAPI } from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8003";

const PROPERTY_TYPES = [
  { id: "apartments",           ar: "شقة",           en: "Apartment" },
  { id: "furnished-apartments", ar: "شقة مفروشة",    en: "Furnished Apartment" },
  { id: "studios",              ar: "استوديو",        en: "Studio" },
  { id: "offices",              ar: "مكتب",           en: "Office" },
  { id: "rooms",                ar: "غرفة",           en: "Room" },
  { id: "villas",               ar: "فيلا",           en: "Villa" },
  { id: "chalets",              ar: "شاليه",          en: "Chalet" },
];

const AVAILABLE_FEATURES = [
  { key: "security",           en: "Security",           ar: "أمن" },
  { key: "balcony",            en: "Balcony",            ar: "شرفة" },
  { key: "elevator",           en: "Elevator",           ar: "مصعد" },
  { key: "ac",                 en: "AC",                 ar: "تكييف" },
  { key: "maid-room",          en: "Maid Room",          ar: "غرفة خدم" },
  { key: "water-meter",        en: "Water Meter",        ar: "عداد مياه" },
  { key: "landline",           en: "Landline",           ar: "هاتف أرضي" },
  { key: "covered-garage",     en: "Covered Garage",     ar: "جراج مغطى" },
  { key: "pool",               en: "Pool",               ar: "حمام سباحة" },
  { key: "private-garden",     en: "Private Garden",     ar: "حديقة خاصة" },
  { key: "electric-meter",     en: "Electric Meter",     ar: "عداد كهرباء" },
  { key: "kitchen-appliances", en: "Kitchen Appliances", ar: "أجهزة المطبخ" },
  { key: "kids-area",          en: "Kids Area",          ar: "منطقة ألعاب للأطفال" },
  { key: "pets-allowed",       en: "Pets Allowed",       ar: "مسموح بالحيوانات الأليفة" },
];

// ── Valuation Widget ──────────────────────────────────────────────────────────
function ValuationWidget({ data, loading, isRTL }) {
  if (loading) {
    return (
      <div style={{ marginTop: 16, padding: "14px 18px", background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, color: "#0369a1", fontSize: "0.9rem" }}>
        <span style={spinnerStyle} />
        {isRTL ? "جارٍ تقدير السعر..." : "Estimating market value..."}
      </div>
    );
  }
  if (!data) return null;
  const fmt = (n) => n?.toLocaleString("en-EG") ?? "—";
  return (
    <div style={{ marginTop: 16, padding: "20px", background: "linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)", border: "1.5px solid #7dd3fc", borderRadius: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <strong style={{ color: "#0369a1", fontSize: "1rem" }}>
          {isRTL ? "تقدير السعر السوقي" : "Market Valuation Estimate"}
        </strong>
        <span style={{ background: "#0369a1", color: "#fff", borderRadius: 99, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700 }}>
          {isRTL ? "ثقة" : "Conf"} {data.confidence_score}%
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { label: isRTL ? "الأدنى"   : "Min",      val: data.min_price },
          { label: isRTL ? "المتوقع"  : "Expected", val: data.expected_price },
          { label: isRTL ? "الأعلى"   : "Max",      val: data.max_price },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 10, padding: "12px 10px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0c4a6e" }}>{fmt(val)} EGP</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EditPropertyPage() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id;

  const [form, setForm] = useState({
    type: "apartments",
    price: "",
    area: "",
    location: "",
    rooms: "",
    baths: "",
    description: "",
    features: [],
    status: "available",
    latitude: null,
    longitude: null,
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles]   = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [ownerId, setOwnerId]         = useState(null);

  // Valuation
  const [valuation, setValuation]   = useState(null);
  const [valLoading, setValLoading] = useState(false);
  const valTimerRef = useRef(null);

  const currentType = PROPERTY_TYPES.find((t) => t.id === form.type) || PROPERTY_TYPES[0];

  // ── Auth & load property ──────────────────────────────────────────────────
  useEffect(() => {
    if (!authAPI.isAuthenticated()) { router.replace("/login"); return; }
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    const uid = Number(stored?.id || 0);
    if (!uid) { router.replace("/login"); return; }
    setOwnerId(uid);
  }, [router]);

  useEffect(() => {
    if (!propertyId || !ownerId) return;
    (async () => {
      try {
        const prop = await realEstateAPI.getProperty(propertyId);
        if (Number(prop.owner_id) !== ownerId) {
          router.replace("/profile");
          return;
        }
        setForm({
          type:        prop.type        || "apartments",
          price:       String(prop.price || ""),
          area:        String(prop.area  || ""),
          location:    prop.location    || "",
          rooms:       String(prop.bedrooms  ?? ""),
          baths:       String(prop.bathrooms ?? ""),
          description: prop.description || "",
          features:    Array.isArray(prop.features) ? prop.features : [],
          status:      prop.status      || "available",
          latitude:    prop.latitude    || null,
          longitude:   prop.longitude   || null,
        });
        setExistingImages(Array.isArray(prop.images) ? prop.images : []);
      } catch {
        setError(isRTL ? "فشل تحميل بيانات العقار." : "Failed to load property.");
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId, ownerId, router, isRTL]);

  // ── Auto-valuation ────────────────────────────────────────────────────────
  useEffect(() => {
    const { type, area, rooms, baths, location } = form;
    if (!area || !rooms || !baths || !location) {
      clearTimeout(valTimerRef.current);
      setValuation(null);
      setValLoading(false);
      return;
    }
    setValuation(null);
    setValLoading(true);
    clearTimeout(valTimerRef.current);
    valTimerRef.current = setTimeout(async () => {
      try {
        const result = await valuationAPI.estimate({
          property_type: type, city: location, region: "",
          area: parseFloat(area), bedrooms: parseInt(rooms, 10), bathrooms: parseInt(baths, 10),
        });
        setValuation(result);
      } catch { setValuation(null); }
      finally { setValLoading(false); }
    }, 800);
    return () => clearTimeout(valTimerRef.current);
  }, [form.type, form.area, form.rooms, form.baths, form.location]);

  // ── Image handling ────────────────────────────────────────────────────────
  const handleNewImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const combined = [...newImageFiles, ...files].slice(0, 10);
    setNewImageFiles(combined);
    combined.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setNewImagePreviews((prev) => [...prev.filter((_, i) => i < combined.length - 1), reader.result].slice(0, 10));
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Map ───────────────────────────────────────────────────────────────────
  const handleMapSelect = useCallback(({ lat, lng, address, city }) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng, location: city || address }));
  }, []);

  // ── Features ──────────────────────────────────────────────────────────────
  const toggleFeature = (key) =>
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(key)
        ? prev.features.filter((f) => f !== key)
        : [...prev.features, key],
    }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ownerId) return;
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("owner_id",    String(ownerId));
      fd.append("area",        form.area);
      fd.append("bedrooms",    form.rooms);
      fd.append("bathrooms",   form.baths);
      fd.append("location",    form.location);
      fd.append("type",        form.type);
      fd.append("price",       form.price);
      fd.append("status",      form.status);
      fd.append("description", form.description);
      fd.append("features",    JSON.stringify(form.features));
      if (form.latitude)  fd.append("latitude",  String(form.latitude));
      if (form.longitude) fd.append("longitude", String(form.longitude));
      if (newImageFiles.length > 0) {
        newImageFiles.forEach((f) => fd.append("files", f));
      }
      await realEstateAPI.updateProperty(propertyId, fd);
      setShowSuccess(true);
    } catch (err) {
      setError(err?.message || (isRTL ? "فشل التحديث." : "Failed to update property."));
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: "#f4f7f9", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
          <span style={{ ...spinnerStyle, width: 36, height: 36, borderWidth: 4 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f4f7f9", minHeight: "100vh" }} dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      {showSuccess && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={successIconWrap}>✓</div>
            <h2 style={modalTitle}>{isRTL ? "تم تحديث العقار بنجاح" : "Property Updated Successfully"}</h2>
            <p style={modalSubtitle}>
              {isRTL ? "تم حفظ التغييرات. يمكنك العودة إلى صفحتك الشخصية." : "Your changes have been saved. You can go back to your profile."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setShowSuccess(false)} style={modalGhostBtn}>
                {isRTL ? "متابعة التعديل" : "Continue Editing"}
              </button>
              <button onClick={() => router.push("/profile")} style={modalBtn}>
                {isRTL ? "صفحتي الشخصية" : "Go to Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 850, margin: "0 auto", padding: "120px 20px 80px" }}>
        <h1 style={{ color: "#004d7a", fontSize: "2rem", fontWeight: 800, marginBottom: 40 }}>
          {isRTL ? "تعديل العقار" : "Edit Property"}
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 30 }}>

          {/* Type & Status */}
          <div style={formSection}>
            <div style={gridRow}>
              <div style={{ flex: 1, position: "relative" }}>
                <h3 style={sectionTitleSmall}>{isRTL ? "نوع العقار" : "Property Type"}</h3>
                <div style={dropdownTrigger} onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}>
                  <span>{isRTL ? currentType.ar : currentType.en}</span>
                  <span>▾</span>
                </div>
                {isTypeDropdownOpen && (
                  <div style={dropdownMenu}>
                    {PROPERTY_TYPES.map((t) => (
                      <div key={t.id} style={dropdownOption}
                        onClick={() => { setForm((prev) => ({ ...prev, type: t.id })); setIsTypeDropdownOpen(false); }}>
                        {isRTL ? t.ar : t.en}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={sectionTitleSmall}>{isRTL ? "حالة العقار" : "Status"}</h3>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="available">{isRTL ? "متاح" : "Available"}</option>
                  <option value="sold">{isRTL ? "مباع" : "Sold"}</option>
                  <option value="rented">{isRTL ? "مؤجر" : "Rented"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? "1. المعلومات الأساسية" : "1. Basic Information"}</h3>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={labelStyle}>{isRTL ? "وصف العقار" : "Description"}</label>
              <span style={{ fontSize: "0.8rem", color: form.description.length >= 500 ? "red" : "#888" }}>
                {form.description.length}/500
              </span>
            </div>
            <textarea
              style={{ ...inputStyle, minHeight: 100, resize: "vertical", marginBottom: 20 }}
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />

            <div style={gridRow}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? "السعر (جنيه)" : "Price (EGP)"}</label>
                <input type="number" min="1" style={inputStyle} value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? "المساحة (م²)" : "Area (m²)"}</label>
                <input type="number" min="1" style={inputStyle} value={form.area}
                  onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))} required />
              </div>
            </div>
          </div>

          {/* Details & Location */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? "2. التفاصيل والموقع" : "2. Details & Location"}</h3>
            <div style={gridRow}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? "الغرف" : "Bedrooms"}</label>
                <input type="number" min="0" style={inputStyle} value={form.rooms}
                  onChange={(e) => setForm((prev) => ({ ...prev, rooms: e.target.value }))} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? "الحمامات" : "Bathrooms"}</label>
                <input type="number" min="1" style={inputStyle} value={form.baths}
                  onChange={(e) => setForm((prev) => ({ ...prev, baths: e.target.value }))} required />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>{isRTL ? "الموقع / المدينة" : "Location / City"}</label>
              <input style={inputStyle} value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder={isRTL ? "مثال: القاهرة الجديدة، مدينة نصر..." : "e.g. New Cairo, Nasr City..."}
                required />
            </div>

            <ValuationWidget data={valuation} loading={valLoading} isRTL={isRTL} />

            <div style={{ marginTop: 20 }}>
              <label style={{ ...labelStyle, marginBottom: 12 }}>
                {isRTL ? "تحديد الموقع على الخريطة" : "Pin Location on Map"}
              </label>
              <MapPicker
                onSelect={handleMapSelect}
                initialLat={form.latitude}
                initialLng={form.longitude}
                isRTL={isRTL}
              />
              {form.latitude && (
                <p style={{ marginTop: 8, fontSize: "0.85rem", color: "#6b7280" }}>
                  📍 {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                </p>
              )}
            </div>
          </div>

          {/* Photos */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? "3. الصور" : "3. Photos"}</h3>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 10 }}>
                  {isRTL ? "الصور الحالية (انقر × للحذف):" : "Current images (click × to remove):"}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12, marginBottom: 20 }}>
                  {existingImages.map((src, i) => (
                    <div key={i} style={{ position: "relative", height: 100, borderRadius: 10, overflow: "hidden", border: "2px solid #e2e8f0" }}>
                      <img
                        src={src.startsWith("data:") ? src : `${API_BASE}${src}`}
                        alt="existing"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button type="button" onClick={() => removeExistingImage(i)} style={removeBadge}>×</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Upload new images */}
            <label style={uploadBox}>
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleNewImages} />
              <div style={{ textAlign: "center", color: "#64748b" }}>
                📷<br />
                {isRTL
                  ? "أضف صور جديدة (ستحل محل الصور الحالية)"
                  : "Add new photos (will replace current images)"}
              </div>
            </label>

            {newImagePreviews.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12, marginTop: 16 }}>
                {newImagePreviews.map((src, i) => (
                  <div key={i} style={{ position: "relative", height: 100, borderRadius: 10, overflow: "hidden", border: "2px solid #93c5fd" }}>
                    <img src={src} alt="new" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button type="button" onClick={() => removeNewImage(i)} style={removeBadge}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Features */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? "4. مميزات العقار" : "4. Property Features"}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {AVAILABLE_FEATURES.map((f) => {
                const active = form.features.includes(f.key);
                return (
                  <button key={f.key} type="button" onClick={() => toggleFeature(f.key)}
                    style={{
                      border: `1px solid ${active ? "#bfdbfe" : "#d1d5db"}`,
                      borderRadius: 999, padding: "10px 14px", cursor: "pointer",
                      fontWeight: 600, background: active ? "#e7f0f8" : "#fff",
                      color: active ? "#0b5fa8" : "#374151",
                    }}>
                    {isRTL ? f.ar : f.en}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={() => router.push("/profile")}
              style={{ flex: 1, padding: 16, background: "#fff", border: "1.5px solid #cbd5e1", color: "#334155", borderRadius: 12, fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}>
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, padding: 16, background: saving ? "#94a3b8" : "linear-gradient(135deg,#008ccf,#005f8c)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: "1rem", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? (isRTL ? "جارٍ الحفظ..." : "Saving...") : (isRTL ? "حفظ التعديلات" : "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const formSection     = { background: "#fff", borderRadius: 16, padding: 30, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #edf2f7" };
const sectionTitle    = { fontSize: "1.1rem", color: "#004d7a", marginBottom: 20, borderBottom: "2px solid #f0f4f8", paddingBottom: 10, fontWeight: 700 };
const sectionTitleSmall = { fontSize: "1rem", color: "#004d7a", marginBottom: 10, fontWeight: 600 };
const gridRow         = { display: "flex", gap: 20, flexWrap: "wrap" };
const labelStyle      = { fontSize: "0.95rem", fontWeight: 600, color: "#4a5568", marginBottom: 8, display: "block" };
const inputStyle      = { padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: "1rem", outline: "none", backgroundColor: "#f9fbff", width: "100%", boxSizing: "border-box" };
const uploadBox       = { width: "100%", padding: 20, border: "2px dashed #cbd5e0", borderRadius: 15, cursor: "pointer", display: "block", backgroundColor: "#fcfdff" };
const removeBadge     = { position: "absolute", top: 5, right: 5, background: "red", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", width: 20, height: 20, fontWeight: 700, lineHeight: "20px", textAlign: "center", padding: 0 };
const dropdownTrigger = { padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", backgroundColor: "#f9fbff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" };
const dropdownMenu    = { position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 100, border: "1px solid #edf2f7" };
const dropdownOption  = { padding: "12px 16px", cursor: "pointer" };
const modalOverlay    = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, backdropFilter: "blur(5px)" };
const modalBox        = { background: "#fff", padding: "34px 28px", borderRadius: 22, textAlign: "center", maxWidth: 460, width: "92%", boxShadow: "0 20px 45px rgba(0,0,0,0.18)" };
const successIconWrap = { width: 68, height: 68, borderRadius: "50%", margin: "0 auto 16px", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg,#dcfce7,#bbf7d0)", color: "#15803d", fontSize: "2rem", fontWeight: 800 };
const modalTitle      = { color: "#0f172a", margin: "0 0 10px 0", fontSize: "1.4rem", fontWeight: 800 };
const modalSubtitle   = { color: "#475569", margin: "0 0 22px 0", lineHeight: 1.6 };
const modalBtn        = { padding: "11px 22px", background: "#008ccf", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700 };
const modalGhostBtn   = { padding: "11px 22px", background: "#fff", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 10, cursor: "pointer", fontWeight: 700 };
const spinnerStyle    = { display: "inline-block", width: 16, height: 16, border: "2px solid #e2e8f0", borderTop: "2px solid #008ccf", borderRadius: "50%", animation: "spin 0.8s linear infinite" };
