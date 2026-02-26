"use client";
import React, { useRef, useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { realEstateAPI, recommendationsAPI, userAPI } from "@/services/api";
import PropertyCard from "@/components/PropertyCard";

const CACHE_TTL_MS = 1000 * 60 * 10;

const toNumber = (v) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const normalizeText = (v) => String(v || "").trim().toLowerCase();

const similarityScore = (candidate, favorite) => {
  let score = 0;

  const cType = normalizeText(candidate.type);
  const fType = normalizeText(favorite.type);
  if (cType && fType && cType === fType) score += 35;

  const cLoc = normalizeText(candidate.location || candidate.city);
  const fLoc = normalizeText(favorite.location || favorite.city);
  if (cLoc && fLoc) {
    if (cLoc === fLoc) score += 30;
    else if (cLoc.includes(fLoc) || fLoc.includes(cLoc)) score += 18;
  }

  const cRooms = toNumber(candidate.bedrooms ?? candidate.rooms);
  const fRooms = toNumber(favorite.bedrooms ?? favorite.rooms);
  const roomDiff = Math.abs(cRooms - fRooms);
  score += Math.max(0, 18 - roomDiff * 6);

  const cArea = toNumber(candidate.area);
  const fArea = toNumber(favorite.area);
  if (cArea > 0 && fArea > 0) {
    const areaDiffRatio = Math.abs(cArea - fArea) / Math.max(fArea, 1);
    score += Math.max(0, 15 - areaDiffRatio * 30);
  }

  const cPrice = toNumber(candidate.price);
  const fPrice = toNumber(favorite.price);
  if (cPrice > 0 && fPrice > 0) {
    const priceDiffRatio = Math.abs(cPrice - fPrice) / Math.max(fPrice, 1);
    score += Math.max(0, 12 - priceDiffRatio * 18);
  }

  return score;
};

const makeCacheKey = (userId) => `recommendation_cache_user_${userId}`;

const readCache = (cacheKey) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeCache = (cacheKey, payload) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch {
    // ignore localStorage failures
  }
};

const enrichWithOwnerNames = async (list) => {
  const source = Array.isArray(list) ? list : [];
  const ownerIds = Array.from(
    new Set(
      source
        .map((item) => Number(item?.owner_id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  );

  if (!ownerIds.length) return source;

  const profileResults = await Promise.allSettled(ownerIds.map((id) => userAPI.getProfile(id)));
  const ownerNameById = new Map();
  profileResults.forEach((result, idx) => {
    if (result.status !== "fulfilled") return;
    const username = result.value?.username;
    if (username) ownerNameById.set(ownerIds[idx], username);
  });

  return source.map((item) => ({
    ...item,
    owner_username:
      ownerNameById.get(Number(item?.owner_id)) ||
      item?.owner_username ||
      item?.owner_name ||
      item?.owner?.username,
  }));
};

const Recommendation = () => {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const scrollRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError("");

        let userId = 1;
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed && parsed.id) {
                userId = parsed.id;
              }
            } catch {
              // Ignore malformed local storage and use default user id
            }
          }
        }

        const cacheKey = makeCacheKey(userId);
        const favoriteProperties = await userAPI.getFavorites(userId);
        const favoritesList = Array.isArray(favoriteProperties) ? favoriteProperties : [];
        const favoriteIds = favoritesList
          .map((p) => Number(p?.id))
          .filter(Boolean)
          .sort((a, b) => a - b);

        const cached = readCache(cacheKey);
        const isCacheFresh = cached && Date.now() - Number(cached.updatedAt || 0) <= CACHE_TTL_MS;
        const sameFavorites =
          cached &&
          Array.isArray(cached.favoriteIds) &&
          cached.favoriteIds.length === favoriteIds.length &&
          cached.favoriteIds.every((id, idx) => id === favoriteIds[idx]);

        if (isCacheFresh && sameFavorites && Array.isArray(cached.items)) {
          const enrichedCached = await enrichWithOwnerNames(cached.items);
          setItems(enrichedCached);
          return;
        }

        const allProperties = await realEstateAPI.getProperties();
        const allList = Array.isArray(allProperties) ? allProperties : [];
        const favoriteSet = new Set(favoriteIds);

        let computed = [];
        if (favoritesList.length > 0 && allList.length > 0) {
          computed = allList
            .filter((p) => !favoriteSet.has(Number(p?.id)))
            .map((candidate) => {
              const bestScore = favoritesList.reduce((best, fav) => {
                const s = similarityScore(candidate, fav);
                return s > best ? s : best;
              }, 0);
              return { ...candidate, _score: bestScore };
            })
            .filter((p) => p._score > 0)
            .sort((a, b) => b._score - a._score)
            .slice(0, 12)
            .map((item) => {
              const cleaned = { ...item };
              delete cleaned._score;
              return cleaned;
            });
        }

        if (computed.length === 0) {
          const data = await recommendationsAPI.getRecommendations(userId);
          computed = data?.recommended_properties || [];
        }

        const enriched = await enrichWithOwnerNames(computed);
        setItems(enriched);
        writeCache(cacheKey, {
          updatedAt: Date.now(),
          favoriteIds,
          items: enriched,
        });
      } catch (err) {
        setError(err.message || "Failed to load recommendations.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (!current) return;

    const scrollAmount = 350;
    current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  return (
    <section className="compounds-section" dir={isRTL ? "rtl" : "ltr"}>
      <div className="section-header">
        <h2 className="section-title">{isRTL ? "عقارات مقترحة لك" : "Recommended Properties for You"}</h2>
        <Link href="/properties" className="modern-show-more">
          <span>{isRTL ? "أظهر المزيد" : "Show More"}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Link>
      </div>

      {loading && <p style={{ padding: "0 1.5rem", fontSize: "0.95rem" }}>{isRTL ? "جاري تحميل التوصيات..." : "Loading recommendations..."}</p>}

      {error && !loading && <p style={{ padding: "0 1.5rem", color: "#c33", fontSize: "0.9rem" }}>{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p style={{ padding: "0 1.5rem", fontSize: "0.95rem" }}>
          {isRTL
            ? "لا توجد توصيات حتى الآن. أضف بعض العقارات إلى المفضلة لبدء التخصيص."
            : "No recommendations yet. Add some properties to favorites to start personalization."}
        </p>
      )}

      {items.length > 0 && (
        <div className="carousel-wrapper">
          <button className="arrow-btn prev" onClick={() => scroll("left")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <div className="scroll-container" ref={scrollRef}>
            <div className="discover-card">
              <Link href="/properties" className="discover-link">
                <span>{isRTL ? "اكتشف أكثر" : "Discover More"}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isRTL ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>

            {items.map((item, index) => {
              const mapped = {
                id: item?.id,
                type: item?.type,
                price: item?.price,
                area: item?.area,
                bedrooms: item?.bedrooms,
                bathrooms: item?.bathrooms,
                location: item?.city || item?.location || "",
                owner_username: item?.owner_username || item?.owner_name || item?.owner?.username,
                title_en: item?.title || (item?.type ? `${item.type} in ${item.city || item.location || ""}`.trim() : ""),
                images: Array.isArray(item?.images) ? item.images : [],
                image_url: item?.image_url,
              };

              return (
                <div key={item?.id ?? index} style={{ flex: "0 0 auto" }}>
                  <PropertyCard property={mapped} variant="carousel" showFavorite={false} />
                </div>
              );
            })}
          </div>

          <button className="arrow-btn next" onClick={() => scroll("right")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      )}
    </section>
  );
};

export default Recommendation;
