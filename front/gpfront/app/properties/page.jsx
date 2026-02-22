"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { realEstateAPI } from "@/services/api";

function normalizeProperty(p) {
  const title = `${p.type || "Property"} in ${p.location || "Unknown"}`;
  return {
    ...p,
    title_en: p.title_en || p.title || title,
    title_ar: p.title_ar || p.title || title,
    location_en: p.location_en || p.location || "",
    location_ar: p.location_ar || p.location || "",
    rooms: p.rooms ?? p.bedrooms ?? 0,
    baths: p.baths ?? p.bathrooms ?? 0,
    image:
      p.image ||
      p.image_url ||
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop",
    images: p.images && p.images.length ? p.images : p.image_url ? [p.image_url] : [],
  };
}

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const minPriceParam = searchParams.get("minPrice");
        const maxPriceParam = searchParams.get("maxPrice");
        const data = await realEstateAPI.getProperties({
          min_price: minPriceParam ? Number(minPriceParam) : undefined,
          max_price: maxPriceParam ? Number(maxPriceParam) : undefined,
        });
        if (!active) return;
        setProperties(Array.isArray(data) ? data.map(normalizeProperty) : []);
      } catch (e) {
        if (!active) return;
        setError("Failed to load properties from database.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [searchParams]);

  const filtered = useMemo(() => {
    const location = (searchParams.get("location") || "").toLowerCase().trim();
    const type = (searchParams.get("type") || "").toLowerCase().trim();
    const minArea = Number(searchParams.get("minArea") || 0);
    const searchType = (searchParams.get("searchType") || "all").toLowerCase();

    return properties.filter((p) => {
      const pLocation = (p.location_en || p.location || "").toLowerCase();
      const pTitle = (p.title_en || "").toLowerCase();
      const pType = (p.type || "").toLowerCase();
      const pSearchType = (p.searchType || "buy").toLowerCase();

      const matchLocation = !location || pLocation.includes(location) || pTitle.includes(location);
      const matchType = !type || type === "all" || pType === type;
      const matchArea = !minArea || Number(p.area || 0) >= minArea;
      const matchSearchType = searchType === "all" || pSearchType === searchType;
      return matchLocation && matchType && matchArea && matchSearchType;
    });
  }, [properties, searchParams]);

  if (loading) {
    return <div style={{ paddingTop: 140, textAlign: "center" }}>Loading properties...</div>;
  }

  if (error) {
    return <div style={{ paddingTop: 140, textAlign: "center", color: "#b91c1c" }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: 1250, margin: "0 auto", padding: "130px 25px 80px" }}>
      <h1 style={{ color: "#004d7a", marginBottom: 24 }}>
        Properties <span style={{ color: "#008ccf" }}>({filtered.length})</span>
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 30 }}>
        {filtered.length ? (
          filtered.map((p) => <PropertyCard key={p.id} property={p} />)
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", background: "#fff", padding: 40, borderRadius: 14 }}>
            No properties found.
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ paddingTop: 140, textAlign: "center" }}>Loading...</div>}>
        <PropertiesContent />
      </Suspense>
    </>
  );
}
