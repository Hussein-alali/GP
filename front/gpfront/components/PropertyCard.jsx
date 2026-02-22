"use client";
import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

const PropertyCard = ({ property, onDelete }) => {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = property.images && property.images.length > 0
    ? property.images
    : [property.image || property.image_url].filter(Boolean);
  const title = property.title_en || property.title_ar || property.title || `Property #${property.id}`;
  const location = property.location_en || property.location_ar || property.location || "";
  const rooms = property.rooms ?? property.bedrooms ?? "-";
  const baths = property.baths ?? property.bathrooms ?? "-";
  const area = Number(property.area) || 0;
  const price = Number(property.price) || 0;
  const saleType = (property.searchType || "buy").toLowerCase();

  const handleCardClick = () => router.push(`/properties/${property.id}`);

  return (
    <div className="house-card" onClick={handleCardClick} style={{ position: "relative", cursor: "pointer" }}>
      {onDelete && (
        <button
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(property.id);
          }}
          style={{
            position: "absolute",
            top: "12px",
            right: isRTL ? "auto" : "12px",
            left: isRTL ? "12px" : "auto",
            zIndex: 15,
            background: "rgba(220, 53, 69, 0.9)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            cursor: "pointer",
          }}
        >
          x
        </button>
      )}

      <div
        className="card-media"
        style={{
          backgroundImage: `url(${images[currentImageIndex] || ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: 220,
          borderRadius: 12,
          position: "relative",
        }}
      >
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length); }} className="nav-arrow left-arrow">
              {isRTL ? ">" : "<"}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((currentImageIndex + 1) % images.length); }} className="nav-arrow right-arrow">
              {isRTL ? "<" : ">"}
            </button>
          </>
        )}
      </div>

      <div className="card-body">
        <div className="price-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, color: "#004d7a", fontSize: "1.2rem" }}>
            {price.toLocaleString()} {isRTL ? "ج.م" : "EGP"}
          </span>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: "bold",
              backgroundColor: saleType === "rent" ? "#e1f5fe" : "#e8f5e9",
              color: saleType === "rent" ? "#0288d1" : "#2e7d32",
            }}
          >
            {saleType === "rent" ? (isRTL ? "للإيجار" : "For Rent") : (isRTL ? "للبيع" : "For Sale")}
          </span>
        </div>

        <h3 style={{ margin: "12px 0", fontSize: "1.1rem", color: "#333" }}>{title}</h3>
        <div style={{ color: "#666", fontSize: "0.9rem" }}>{location}</div>
        <div style={{ display: "flex", gap: 15, margin: "15px 0", color: "#555", fontSize: "0.9rem" }}>
          <span>{rooms} bed</span>
          <span>{baths} bath</span>
          <span>{area || "-"} m2</span>
        </div>
      </div>

      <style jsx>{`
        .house-card {
          background: #fff;
          border-radius: 14px;
          padding: 12px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
        }
        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.4);
          color: white;
          border: none;
          padding: 8px 12px;
          cursor: pointer;
        }
        .left-arrow { left: 0; }
        .right-arrow { right: 0; }
      `}</style>
    </div>
  );
};

export default PropertyCard;
