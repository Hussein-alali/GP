"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { FiHeart, FiMapPin, FiPhoneCall, FiMaximize } from "react-icons/fi";
import { FaBed, FaBath, FaWhatsapp } from "react-icons/fa";

const formatCompactNumber = (n) => {
  const num = Number(n || 0);
  if (!Number.isFinite(num) || num <= 0) return "";
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    const txt = m >= 10 ? Math.round(m).toString() : (Math.round(m * 10) / 10).toString();
    return `${txt}M`;
  }
  if (abs >= 1_000) return `${Math.round(abs / 1_000)}K`;
  return abs.toLocaleString();
};

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean);
  return letters.join("") || "SE";
};

const normalizePhone = (raw) => {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  return digits.length >= 7 ? digits : "";
};

const formatTimeAgo = (dateValue, isRTL) => {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return isRTL ? "الآن" : "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isRTL ? `منذ ${diffMin} دقيقة` : `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return isRTL ? `منذ ${diffHr} ساعة` : `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return isRTL ? `منذ ${diffDay} يوم` : `${diffDay} day ago`;
  const diffMon = Math.floor(diffDay / 30);
  if (diffMon < 12) return isRTL ? `منذ ${diffMon} شهر` : `${diffMon} mo ago`;
  const diffYr = Math.floor(diffMon / 12);
  return isRTL ? `منذ ${diffYr} سنة` : `${diffYr} yr ago`;
};

const typeToLabel = (type, isRTL) => {
  if (!type) return isRTL ? "عقار" : "PROPERTY";
  const raw = String(type).toLowerCase();
  if (isRTL) {
    const arMap = {
      apartment: "شقة",
      apartments: "شقة",
      "furnished-apartments": "شقة مفروشة",
      villa: "فيلا",
      villas: "فيلا",
      chalet: "شاليه",
      chalets: "شاليه",
      duplex: "دوبلكس",
    };
    return arMap[raw] || String(type).replace(/[-_]/g, " ");
  }
  return String(type).replace(/[-_]/g, " ").toUpperCase();
};

const PropertyCard = ({
  property,
  isFavorite = false,
  onToggleFavorite,
  variant = "grid",
  showFavorite = true,
}) => {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const router = useRouter();

  const images = property?.images && property.images.length > 0 ? property.images : [property?.image || property?.image_url].filter(Boolean);
  const mainImage = images[0] || "";

  const location =
    (isRTL ? (property?.location_ar || property?.location) : (property?.location_en || property?.location)) ||
    property?.city ||
    "";
  const computedTitle = (() => {
    const t = String(property?.type || "").replace(/[-_]/g, " ").trim();
    const loc = String(property?.city || property?.location || "").trim();
    if (!t && !loc) return "";
    if (!loc) return t;
    if (!t) return loc;
    return isRTL ? `${t} في ${loc}` : `${t} in ${loc}`;
  })();
  const title =
    (isRTL ? (property?.title_ar || property?.title) : (property?.title_en || property?.title)) ||
    computedTitle ||
    (isRTL ? `عقار #${property?.id ?? "-"}` : `Property #${property?.id ?? "-"}`);
  const rooms = property?.rooms ?? property?.bedrooms ?? "-";
  const baths = property?.baths ?? property?.bathrooms ?? "-";
  const area = Number(property?.area) || 0;
  const price = Number(property?.price) || 0;
  const floor = property?.floor ?? property?.level ?? property?.story ?? null;
  const finishing = property?.finishing ?? property?.finish ?? property?.finishing_type ?? "";
  const views = property?.views ?? null;
  const createdAt = property?.created_at ?? property?.createdAt ?? property?.date ?? null;
  const timeAgo = formatTimeAgo(createdAt, isRTL);
  const typeLabel = typeToLabel(property?.type, isRTL);

  const agentName =
    property?.agent_name ||
    property?.owner_name ||
    property?.owner_username ||
    property?.owner?.username ||
    "Smart Estate";
  const agentInitials = getInitials(agentName);
  const phone = normalizePhone(property?.phone || property?.owner_phone || property?.contact_phone || "");

  const priceBadgeText = price ? `${formatCompactNumber(price)} ${isRTL ? "ج.م" : "EGP"}` : isRTL ? "السعر" : "Price";
  const bedsLabel = isRTL ? "غرف" : "Beds";
  const bathsLabel = isRTL ? "حمام" : "Baths";
  const floorLabel = isRTL ? "الدور" : "Floor";
  const areaLabel = isRTL ? "م²" : "m²";
  const viewsLabel = isRTL ? "مشاهدة" : "views";

  const isList = variant === "list";
  const isCarousel = variant === "carousel";

  const handleCardClick = () => {
    const id = property?.id;
    router.push(id != null ? `/properties/${id}` : "/properties");
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(property);
  };

  const handleCall = (e) => {
    e.stopPropagation();
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (!phone) return;
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
  };

  return (
    <article
      onClick={handleCardClick}
      style={{
        ...card,
        ...(isList ? cardList : null),
        ...(isCarousel ? cardCarousel : null),
      }}
    >
      <div
        style={{
          ...media,
          ...(isList ? mediaList : null),
          ...(isCarousel ? mediaCarousel : null),
          backgroundImage: mainImage ? `url(${mainImage})` : "none",
          backgroundColor: mainImage ? undefined : "#e2e8f0",
        }}
      >
        {!mainImage && (
          <div style={noImageOverlay}>{isRTL ? "لا توجد صورة" : "No Image"}</div>
        )}
        <div style={priceBadge}>{priceBadgeText}</div>

        {showFavorite && (
          <button
            type="button"
            aria-label={isFavorite ? (isRTL ? "إزالة من المفضلة" : "Remove from favorites") : (isRTL ? "إضافة إلى المفضلة" : "Add to favorites")}
            style={{ ...favBtn, color: isFavorite ? "#ef4444" : "#64748b" }}
            onClick={handleFavoriteClick}
          >
            <FiHeart size={18} />
          </button>
        )}

        <div style={typeBadge}>{typeLabel}</div>
      </div>

      <div style={{ ...body, ...(isList ? bodyList : null), ...(isCarousel ? bodyCarousel : null) }}>
        <h3 style={titleStyle} title={title}>
          {title}
        </h3>

        <div style={locationRow} title={location}>
          <FiMapPin size={14} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{location}</span>
        </div>

        <div style={divider} />

        <div style={specRow}>
          <div style={specItem}>
            <FiMaximize />
            <span style={specText}>
              {Math.round(area)} {areaLabel}
            </span>
          </div>
          <div style={specItem}>
            <FaBed />
            <span style={specText}>
              {rooms} {bedsLabel}
            </span>
          </div>
          <div style={specItem}>
            <FaBath />
            <span style={specText}>
              {baths} {bathsLabel}
            </span>
          </div>
          {floor != null && floor !== "" && (
            <div style={specItem}>
              <span style={specText}>
                {floorLabel} {floor}
              </span>
            </div>
          )}
          {finishing ? <div style={finishPill}>{finishing}</div> : null}
        </div>

        <div style={bottomRow}>
          <div style={agentBox}>
            <div style={agentAvatar}>{agentInitials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={agentNameStyle} title={agentName}>
                {agentName}
              </div>
              <div style={agentMeta}>
                {timeAgo ? <span>{timeAgo}</span> : null}
                {timeAgo && views != null ? <span>•</span> : null}
                {views != null ? <span>{views} {viewsLabel}</span> : null}
                {!timeAgo && views == null ? <span style={{ color: "#94a3b8" }}>{isRTL ? "بيانات الوكيل" : "Agent info"}</span> : null}
              </div>
            </div>
          </div>

          <div style={actionsRow}>
            <button type="button" style={{ ...callBtn, ...(phone ? null : btnDisabled) }} onClick={handleCall} disabled={!phone}>
              <FiPhoneCall />
              <span>{isRTL ? "اتصال" : "Call"}</span>
            </button>
            <button type="button" style={{ ...waBtn, ...(phone ? null : btnDisabled) }} onClick={handleWhatsApp} disabled={!phone}>
              <FaWhatsapp />
              <span>{isRTL ? "واتساب" : "WhatsApp"}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const card = {
  background: "#fff",
  borderRadius: "18px",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
};

const media = {
  height: "180px",
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
};

const noImageOverlay = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  color: "#475569",
  fontWeight: 800,
  letterSpacing: "0.02em",
};

const priceBadge = {
  position: "absolute",
  top: "12px",
  left: "12px",
  background: "rgba(17,24,39,0.8)",
  color: "#fff",
  borderRadius: "8px",
  padding: "6px 10px",
  fontWeight: 800,
  fontSize: "0.9rem",
};

const favBtn = {
  position: "absolute",
  top: "12px",
  right: "12px",
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "none",
  background: "rgba(255,255,255,0.92)",
  color: "#64748b",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const typeBadge = {
  position: "absolute",
  left: "12px",
  bottom: "12px",
  background: "rgba(0,0,0,0.45)",
  color: "#fff",
  borderRadius: "6px",
  padding: "5px 9px",
  fontSize: "0.75rem",
  fontWeight: 900,
  letterSpacing: "0.02em",
};

const body = { padding: "14px 16px 14px" };

const titleStyle = {
  margin: 0,
  fontSize: "1.05rem",
  color: "#0f172a",
  fontWeight: 800,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const locationRow = {
  marginTop: "6px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  color: "#475569",
  fontSize: "0.95rem",
  minWidth: 0,
};

const divider = { marginTop: "12px", height: "1px", background: "#e5e7eb" };

const specRow = { marginTop: "10px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" };
const specItem = { display: "flex", alignItems: "center", gap: "6px", color: "#334155", fontSize: "0.9rem" };
const specText = { fontWeight: 700 };

const finishPill = {
  marginInlineStart: "auto",
  background: "#eafff1",
  color: "#067647",
  border: "1px solid #86efac",
  borderRadius: "999px",
  padding: "6px 10px",
  fontWeight: 800,
  fontSize: "0.82rem",
  whiteSpace: "nowrap",
};

const bottomRow = { marginTop: "12px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between" };

const agentBox = { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 };
const agentAvatar = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  background: "#065f46",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: "0.85rem",
  flex: "0 0 auto",
};
const agentNameStyle = { fontSize: "0.92rem", fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const agentMeta = { fontSize: "0.8rem", color: "#94a3b8", display: "flex", gap: "6px", alignItems: "center" };

const actionsRow = { display: "flex", gap: "8px", flex: "0 0 auto" };
const callBtn = { border: "1px solid #86efac", background: "#f0fdf4", color: "#166534", borderRadius: "10px", padding: "9px 12px", display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", fontWeight: 800 };
const waBtn = { border: "none", background: "#22c55e", color: "#fff", borderRadius: "10px", padding: "9px 12px", display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", fontWeight: 900 };
const btnDisabled = { opacity: 0.55, cursor: "not-allowed" };

const cardList = { display: "grid", gridTemplateColumns: "260px 1fr" };
const mediaList = { height: "100%" };
const bodyList = { padding: "16px 18px" };

const cardCarousel = { width: "320px" };
const mediaCarousel = { height: "150px" };
const bodyCarousel = { padding: "12px 14px 12px" };

export default PropertyCard;
