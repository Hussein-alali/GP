"use client";
import React, { useRef, useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { recommendationsAPI } from "@/services/api";
import PropertyCard from "@/components/PropertyCard";

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

        const data = await recommendationsAPI.getRecommendations(userId);
        setItems(data?.recommended_properties || []);
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
            ? "لا توجد توصيات حتى الآن. أضف بعض العقارات لبدء التخصيص."
            : "No recommendations yet. Add some properties to get personalized suggestions."}
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
