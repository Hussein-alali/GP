"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const PropertyDetails = ({ property }) => {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [activeImg, setActiveImg] = useState(0);

  const images = property.images?.length ? property.images : [property.image || property.image_url].filter(Boolean);
  const title = property.title_en || property.title_ar || property.title || `Property #${property.id}`;
  const location = property.location_en || property.location_ar || property.location || "";
  const rooms = property.rooms ?? property.bedrooms ?? 0;
  const baths = property.baths ?? property.bathrooms ?? 0;
  const area = property.area ?? 0;
  const type = property.type || "-";
  const description = property.description || (isRTL ? "لا يوجد وصف إضافي." : "No additional description.");

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }} dir={isRTL ? "rtl" : "ltr"}>
      <div style={{ marginBottom: 30 }}>
        <div
          style={{
            width: "100%",
            height: 500,
            borderRadius: 20,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: `url(${images[activeImg] || ""})`,
          }}
        />
        {images.length > 1 && (
          <div style={{ display: "flex", gap: 10, marginTop: 12, overflowX: "auto" }}>
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImg(idx)}
                style={{
                  width: 120,
                  height: 80,
                  borderRadius: 10,
                  backgroundImage: `url(${img})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  cursor: "pointer",
                  border: activeImg === idx ? "3px solid #008ccf" : "2px solid transparent",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 350 }}>
          <h1 style={{ fontSize: "2.1rem", color: "#004d7a", marginBottom: 10 }}>{title}</h1>
          <p style={{ color: "#666" }}>{location}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 20, marginTop: 24 }}>
            <Spec label={isRTL ? "غرف نوم" : "Bedrooms"} value={rooms} />
            <Spec label={isRTL ? "حمامات" : "Bathrooms"} value={baths} />
            <Spec label={isRTL ? "المساحة" : "Area"} value={`${area} m2`} />
            <Spec label={isRTL ? "النوع" : "Type"} value={type} />
          </div>

          <div style={{ marginTop: 28, background: "#fff", padding: 20, borderRadius: 14 }}>
            <h3 style={{ marginBottom: 10 }}>{isRTL ? "الوصف" : "Description"}</h3>
            <p style={{ color: "#4a5568", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{description}</p>
          </div>

          <div style={{ marginTop: 16, background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)", padding: 22, borderRadius: 16, border: "1px solid #e5edf6", boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)" }}>
            <h3 style={{ marginBottom: 10 }}>{isRTL ? "كامل البيانات" : "All Property Data"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <DataRow label="type" value={type} />
              <DataRow label="location" value={location} />
              <DataRow label="price" value={property.price ?? "-"} />
              <DataRow label="area" value={area} />
              <DataRow label="bedrooms" value={rooms} />
              <DataRow label="bathrooms" value={baths} />
              <DataRow label="description" value={description} />
              <DataRow label="images_count" value={images.length} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 280, background: "#fff", padding: 24, borderRadius: 18, height: "fit-content" }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ color: "#718096", fontSize: "0.9rem" }}>{isRTL ? "السعر" : "Price"}</div>
            <h2 style={{ color: "#008ccf", fontWeight: 900, margin: 0 }}>
              {Number(property.price || 0).toLocaleString()} {isRTL ? "ج.م" : "EGP"}
            </h2>
          </div>
          <button style={btnPrimary}>{isRTL ? "اتصل الآن" : "Call Now"}</button>
          <button style={btnSecondary}>{isRTL ? "واتساب" : "WhatsApp"}</button>
        </div>
      </div>
    </div>
  );
};

function Spec({ label, value }) {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 14, textAlign: "center" }}>
      <div style={{ fontWeight: 800, color: "#004d7a" }}>{value}</div>
      <div style={{ fontSize: "0.85rem", color: "#718096" }}>{label}</div>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div style={{ border: "1px solid #dbe8f5", borderRadius: 12, padding: 12, background: "#fff" }}>
      <div style={{ display: "inline-flex", alignItems: "center", fontSize: "0.72rem", color: "#0b79c7", background: "#eaf6ff", borderRadius: 999, padding: "4px 9px", fontWeight: 700, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, color: "#0f172a", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.45 }}>
        {String(value)}
      </div>
    </div>
  );
}

const btnPrimary = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "none",
  background: "#008ccf",
  color: "#fff",
  fontWeight: 700,
  marginBottom: 10,
  cursor: "pointer",
};
const btnSecondary = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "2px solid #25d366",
  background: "transparent",
  color: "#25d366",
  fontWeight: 700,
  cursor: "pointer",
};

export default PropertyDetails;
