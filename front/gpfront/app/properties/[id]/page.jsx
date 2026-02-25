"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PropertyDetails from "@/components/PropertyDetails";
import { authAPI, realEstateAPI } from "@/services/api";

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

export default function PropertyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.replace("/login");
      return;
    }

    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await realEstateAPI.getProperty(id);
        if (!active) return;
        setProperty(normalizeProperty(data));
      } catch {
        if (!active) return;
        setError("Property not found.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, router]);

  return (
    <div style={{ backgroundColor: "#f4f7f9", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ paddingTop: 130, paddingBottom: 80, paddingLeft: 20, paddingRight: 20 }}>
        {loading && <div style={{ textAlign: "center" }}>Loading property details...</div>}
        {!loading && error && (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "#dc2626" }}>{error}</h2>
            <button
              onClick={() => router.push("/properties")}
              style={{ padding: "12px 25px", background: "#008ccf", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold" }}
            >
              Back to Properties
            </button>
          </div>
        )}
        {!loading && !error && property && <PropertyDetails property={property} />}
      </main>
    </div>
  );
}
