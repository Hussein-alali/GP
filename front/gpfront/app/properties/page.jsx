"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { realEstateAPI, userAPI } from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";

const AVAILABLE_FEATURES = [
  { key: "security", en: "Security", ar: "أمن" },
  { key: "balcony", en: "Balcony", ar: "شرفة" },
  { key: "elevator", en: "Elevator", ar: "مصعد" },
  { key: "ac", en: "AC", ar: "تكييف" },
  { key: "maid-room", en: "Maid Room", ar: "غرفة خدم" },
  { key: "water-meter", en: "Water Meter", ar: "عداد مياه" },
  { key: "landline", en: "Landline", ar: "هاتف أرضي" },
  { key: "covered-garage", en: "Covered Garage", ar: "جراج مغطى" },
  { key: "pool", en: "Pool", ar: "حمام سباحة" },
  { key: "private-garden", en: "Private Garden", ar: "حديقة خاصة" },
  { key: "electric-meter", en: "Electric Meter", ar: "عداد كهرباء" },
  { key: "kitchen-appliances", en: "Kitchen Appliances", ar: "أجهزة المطبخ" },
  { key: "kids-area", en: "Kids Area", ar: "منطقة ألعاب للأطفال" },
  { key: "pets-allowed", en: "Pets Allowed", ar: "مسموح بالحيوانات الأليفة" },
];
const PRICE_BARS = [8, 14, 22, 34, 46, 44, 66, 58, 88, 96, 90, 74, 50, 94, 76, 64, 60, 56, 46, 36, 28, 16, 10];
const AREA_BARS = [6, 10, 14, 18, 58, 18, 66, 18, 50, 24, 20, 16, 14, 12, 16, 10, 8];

const parseFeaturesParam = (raw) => {
  if (!raw) return [];
  const list = String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(list));
};

const formatPriceShort = (value) => {
  const n = Number(value || 0);
  if (n >= 1000000) {
    const m = n / 1000000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  return `${Math.round(n / 1000)}K`;
};

const normalizeProperty = (p) => {
  const title = `${p.type || "Property"} in ${p.location || "Unknown"}`;
  return {
    ...p,
    title_en: p.title_en || p.title || title,
    title_ar: p.title_ar || p.title || title,
    location_en: p.location_en || p.location || "",
    location_ar: p.location_ar || p.location || "",
    rooms: p.rooms ?? p.bedrooms ?? 0,
    baths: p.baths ?? p.bathrooms ?? 0,
    searchType: (p.searchType || "buy").toLowerCase(),
    image:
      p.image ||
      p.image_url ||
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop",
    images: p.images && p.images.length ? p.images : p.image_url ? [p.image_url] : [],
  };
};

const houseMatchesFilters = (house, filters) => {
  const houseLocation = `${house.location_ar || ""} ${house.location_en || ""} ${house.location || ""}`.toLowerCase();
  const houseType = (house.type || "").toLowerCase();
  const selectedFeatures = Array.isArray(filters.features) ? filters.features : [];
  const houseFeatures = Array.isArray(house.features) ? house.features : [];

  const matchLocation = !filters.location || houseLocation.includes(String(filters.location).toLowerCase());
  const matchType = filters.type === "all" || houseType.includes(String(filters.type).toLowerCase());
  const matchSearchType = filters.searchType === "all" || (house.searchType || "buy").toLowerCase() === String(filters.searchType).toLowerCase();
  const matchMinPrice = !filters.minPrice || parseFloat(house.price) >= parseFloat(filters.minPrice);
  const matchMaxPrice = !filters.maxPrice || parseFloat(house.price) <= parseFloat(filters.maxPrice);
  const matchMinArea = !filters.minArea || parseFloat(house.area) >= parseFloat(filters.minArea);
  const matchMaxArea = !filters.maxArea || parseFloat(house.area) <= parseFloat(filters.maxArea);
  const matchRooms = filters.rooms === "all" || parseInt(house.rooms, 10) <= parseInt(filters.rooms, 10);
  const matchBaths = filters.baths === "all" || parseInt(house.baths, 10) <= parseInt(filters.baths, 10);
  const matchFeatures = selectedFeatures.length === 0 || selectedFeatures.every((f) => houseFeatures.includes(f));

  return matchLocation && matchType && matchSearchType && matchMinPrice && matchMaxPrice && matchMinArea && matchMaxArea && matchRooms && matchBaths && matchFeatures;
};

const PropertiesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [allHouses, setAllHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [showSidebarFilters, setShowSidebarFilters] = useState(false);
  const [sidebarFilters, setSidebarFilters] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const sortMenuRef = useRef(null);
  const t = isRTL
    ? {
        loading: "جاري تحميل العقارات...",
        loadFailed: "فشل تحميل العقارات من قاعدة البيانات.",
        found: "عقار متاح",
        newest: "الأحدث",
        priceAsc: "أقل سعر",
        priceDesc: "أعلى سعر",
        areaDesc: "أكبر مساحة",
        areaAsc: "أصغر مساحة",
        filters: "الفلاتر",
        purpose: "الغرض",
        all: "الكل",
        forSale: "للبيع",
        forRent: "للإيجار",
        type: "النوع",
        allProperties: "كل العقارات",
        apartment: "شقة",
        villa: "فيلا",
        chalet: "شاليه",
        duplex: "دوبلكس",
        location: "الموقع",
        locationPlaceholder: "المدينة / الحي",
        maxPrice: "أقصى سعر",
        minArea: "أقل مساحة",
        rooms: "الغرف",
        baths: "الحمامات",
        features: "مميزات العقار",
        reset: "إعادة ضبط الفلاتر",
        noMatch: "لا توجد عقارات تطابق الفلاتر الحالية.",
        moreFilters: "مزيد من الفلاتر",
        hideFilters: "إخفاء الفلاتر",
        close: "إغلاق",
        search: "بحث",
        sortByLabel: "ترتيب حسب",
        sortDefault: "الافتراضي",
      }
    : {
        loading: "Loading properties...",
        loadFailed: "Failed to load properties from database.",
        found: "Properties Found",
        newest: "Most Recent",
        priceAsc: "Lowest Price",
        priceDesc: "Highest Price",
        areaDesc: "Largest Area",
        areaAsc: "Smallest Area",
        filters: "Filters",
        purpose: "Purpose",
        all: "All",
        forSale: "For Sale",
        forRent: "For Rent",
        type: "Type",
        allProperties: "All Properties",
        apartment: "Apartment",
        villa: "Villa",
        chalet: "Chalet",
        duplex: "Duplex",
        location: "Location",
        locationPlaceholder: "City / district",
        maxPrice: "Max Price",
        minArea: "Min Area",
        rooms: "Rooms",
        baths: "Baths",
        features: "Property Features",
        reset: "Reset Filters",
        noMatch: "No properties match your filters.",
        moreFilters: "More Filters",
        hideFilters: "Hide Filters",
        close: "Close",
        search: "Search",
        sortByLabel: "Sort By",
        sortDefault: "Default",
      };

  const [filters, setFilters] = useState({
    location: searchParams.get("location") || "",
    type: searchParams.get("type") || "all",
    searchType: searchParams.get("searchType") || "all",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    minArea: searchParams.get("minArea") || "",
    maxArea: searchParams.get("maxArea") || "",
    rooms: searchParams.get("rooms") || "all",
    baths: searchParams.get("baths") || "all",
    features: parseFeaturesParam(searchParams.get("features")),
  });

  const updateURL = (newFilters) => {
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach((key) => {
      const value = newFilters[key];
      if (Array.isArray(value)) {
        if (value.length) params.set(key, value.join(","));
        return;
      }
      if (value && value !== "all") {
        params.set(key, value);
      }
    });
    router.replace(`/properties?${params.toString()}`, { scroll: false });
  };

  const handleFilterChange = (name, value) => {
    let processedValue = value;
    if ((name === "minPrice" || name === "maxPrice" || name === "minArea" || name === "maxArea") && value !== "") {
      processedValue = Math.max(0, parseFloat(value) || 0).toString();
    }
    const updated = { ...filters, [name]: processedValue };
    setFilters(updated);
    updateURL(updated);
  };

  const handleSidebarFilterChange = (name, value) => {
    const base = sidebarFilters || filters;
    let processedValue = value;
    if ((name === "minPrice" || name === "maxPrice" || name === "minArea" || name === "maxArea") && value !== "") {
      processedValue = Math.max(0, parseFloat(value) || 0).toString();
    }
    setSidebarFilters({ ...base, [name]: processedValue });
  };

  const toggleSidebarFeatureFilter = (featureKey) => {
    const base = sidebarFilters || filters;
    const current = Array.isArray(base.features) ? base.features : [];
    const next = current.includes(featureKey) ? current.filter((f) => f !== featureKey) : [...current, featureKey];
    setSidebarFilters({ ...base, features: next });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await realEstateAPI.getProperties();
        if (!active) return;
        setAllHouses(Array.isArray(data) ? data.map(normalizeProperty) : []);
      } catch {
        if (!active) return;
        setError(t.loadFailed);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [t.loadFailed]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        const userId = Number(storedUser?.id || 0);
        if (!userId) return;
        setCurrentUserId(userId);

        const profile = await userAPI.getProfile(userId);
        if (!active) return;
        const favorites = Array.isArray(profile?.favorites) ? profile.favorites.map((id) => Number(id)) : [];
        setFavoriteIds(favorites);
      } catch {
        if (!active) return;
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        const localFav = Array.isArray(storedUser?.favorites) ? storedUser.favorites.map((id) => Number(id)) : [];
        setFavoriteIds(localFav);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (showSidebarFilters) {
      setSidebarFilters({ ...filters, features: [...(filters.features || [])] });
    }
  }, [filters, showSidebarFilters]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const toggleFavorite = async (property) => {
    const propertyId = Number(property?.id);
    if (!propertyId || !currentUserId) return;

    const wasFavorite = favoriteIds.includes(propertyId);
    const nextFavorites = wasFavorite
      ? favoriteIds.filter((id) => id !== propertyId)
      : [...favoriteIds, propertyId];
    setFavoriteIds(nextFavorites);

    try {
      if (wasFavorite) {
        await userAPI.removeFavorite(currentUserId, propertyId);
      } else {
        await userAPI.addFavorite(currentUserId, propertyId);
      }

      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser) {
        storedUser.favorites = nextFavorites;
        localStorage.setItem("user", JSON.stringify(storedUser));
      }
    } catch {
      setFavoriteIds(favoriteIds);
    }
  };

  const filteredHouses = useMemo(() => {
    return allHouses.filter((house) => houseMatchesFilters(house, filters));
  }, [allHouses, filters]);

  const qualifiedSidebarCount = useMemo(() => {
    const targetFilters = sidebarFilters || filters;
    return allHouses.filter((house) => houseMatchesFilters(house, targetFilters)).length;
  }, [allHouses, filters, sidebarFilters]);

  const displayedHouses = useMemo(() => {
    const list = [...filteredHouses];
    switch (sortBy) {
      case "price_asc":
        return list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      case "price_desc":
        return list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      case "area_desc":
        return list.sort((a, b) => Number(b.area || 0) - Number(a.area || 0));
      case "area_asc":
        return list.sort((a, b) => Number(a.area || 0) - Number(b.area || 0));
      default:
        return list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }
  }, [filteredHouses, sortBy]);

  const sortOptions = [
    { value: "newest", label: t.newest },
    { value: "price_asc", label: t.priceAsc },
    { value: "price_desc", label: t.priceDesc },
    { value: "area_asc", label: t.areaAsc },
    { value: "area_desc", label: t.areaDesc },
  ];

  const resetSidebarDraftFilters = () => {
    setSidebarFilters({
      location: "",
      type: "all",
      searchType: "all",
      minPrice: "",
      maxPrice: "",
      minArea: "",
      maxArea: "",
      rooms: "all",
      baths: "all",
      features: [],
    });
  };

  const applySidebarFilters = () => {
    if (!sidebarFilters) return;
    setFilters(sidebarFilters);
    updateURL(sidebarFilters);
  };

  if (loading) {
    return <div style={{ paddingTop: 140, textAlign: "center" }}>{t.loading}</div>;
  }

  if (error) {
    return <div style={{ paddingTop: 140, textAlign: "center", color: "#b91c1c" }}>{error}</div>;
  }

  const currentSidebarFilters = sidebarFilters || filters;
  const priceMinValue = Math.min(10000000, Math.max(5000, Number(currentSidebarFilters.minPrice || 5000)));
  const priceMaxValue = Math.min(10000000, Math.max(priceMinValue, Number(currentSidebarFilters.maxPrice || 10000000)));
  const areaMinValue = Math.min(5000, Math.max(10, Number(currentSidebarFilters.minArea || 10)));
  const areaMaxValue = Math.min(5000, Math.max(areaMinValue, Number(currentSidebarFilters.maxArea || 5000)));
  const priceMinPercent = ((priceMinValue - 5000) / (10000000 - 5000)) * 100;
  const priceMaxPercent = ((priceMaxValue - 5000) / (10000000 - 5000)) * 100;
  const areaMinPercent = ((areaMinValue - 10) / (5000 - 10)) * 100;
  const areaMaxPercent = ((areaMaxValue - 10) / (5000 - 10)) * 100;
  const typeTitleEn = {
    all: "Properties",
    apartment: "Apartments",
    villa: "Villas",
    chalet: "Chalets",
    duplex: "Duplexes",
  };
  const typeTitleAr = {
    all: "عقارات",
    apartment: "شقق",
    villa: "فلل",
    chalet: "شاليهات",
    duplex: "دوبلكسات",
  };
  const selectedTypeTitle = isRTL ? (typeTitleAr[filters.type] || typeTitleAr.all) : (typeTitleEn[filters.type] || typeTitleEn.all);
  const listingTitle =
    filters.searchType === "rent"
      ? `${selectedTypeTitle} ${t.forRent}`
      : filters.searchType === "buy"
      ? `${selectedTypeTitle} ${t.forSale}`
      : selectedTypeTitle;

  return (
    <div style={pageWrap}>
      <div style={container}>
        <section style={topFilterWrap}>
          <div style={topLocationWrap}>
            <span style={topLocationIcon}>📍</span>
            <input
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              style={topLocationInput}
              placeholder={t.locationPlaceholder}
            />
          </div>
          <div style={topRowFilters}>
            <div style={topSelectWrap}>
              <select value={filters.searchType} onChange={(e) => handleFilterChange("searchType", e.target.value)} style={topSelectNoNative}>
                <option value="all">{t.all}</option>
                <option value="buy">{t.forSale}</option>
                <option value="rent">{t.forRent}</option>
              </select>
              <span style={topSelectArrow}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 14 12 8 18 14"></polyline>
                </svg>
              </span>
            </div>
            <div style={topSelectWrap}>
              <select value={filters.type} onChange={(e) => handleFilterChange("type", e.target.value)} style={topSelectNoNative}>
                <option value="all">{t.allProperties}</option>
                <option value="apartment">{t.apartment}</option>
                <option value="villa">{t.villa}</option>
                <option value="chalet">{t.chalet}</option>
                <option value="duplex">{t.duplex}</option>
              </select>
              <span style={topSelectArrow}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 14 12 8 18 14"></polyline>
                </svg>
              </span>
            </div>
            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
              style={topSelect}
              placeholder={t.maxPrice}
            />
            <input
              type="number"
              min="0"
              value={filters.minArea}
              onChange={(e) => handleFilterChange("minArea", e.target.value)}
              style={topSelect}
              placeholder={t.minArea}
            />
            <button
              type="button"
              onClick={() => setShowSidebarFilters((prev) => !prev)}
              style={topMoreBtn}
            >
              {showSidebarFilters ? t.hideFilters : t.moreFilters}
            </button>
          </div>
        </section>

        <div style={headerRow}>
          <section style={{ ...bottomFilterBar, position: "static", marginBottom: 0, flexDirection: isRTL ? "row-reverse" : "row" }}>
            <div style={bottomSortWrap} ref={sortMenuRef}>
              <button type="button" style={bottomSortTrigger} onClick={() => setIsSortOpen((prev) => !prev)}>
                <span style={bottomSortLabelWrap}>
                  <span style={bottomSortIcon}>⇅</span>
                  <span>{t.sortByLabel}</span>
                </span>
                <span style={{ ...bottomSortCaret, transform: isSortOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 14 12 8 18 14"></polyline>
                  </svg>
                </span>
              </button>
              {isSortOpen && (
                <div style={bottomSortMenu}>
                  <button type="button" style={{ ...bottomSortItem, ...(sortBy === "newest" ? bottomSortItemActive : null) }} onClick={() => { setSortBy("newest"); setIsSortOpen(false); }}>
                    {t.sortDefault}
                  </button>
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      style={{ ...bottomSortItem, ...(sortBy === option.value ? bottomSortItemActive : null) }}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={bottomToggleWrap}>
              <button type="button" style={{ ...bottomToggleBtn, ...(viewMode === "list" ? toggleBtnActive : null) }} onClick={() => setViewMode("list")}>☰</button>
              <button type="button" style={{ ...bottomToggleBtn, ...(viewMode === "grid" ? toggleBtnActive : null) }} onClick={() => setViewMode("grid")}>▦</button>
            </div>
          </section>
          <div style={headerTitleWrap}>
            <div style={headerTitleText}>{listingTitle}</div>
            <div style={countText}><strong>{displayedHouses.length}</strong> {t.found}</div>
          </div>
        </div>

        {showSidebarFilters && <div style={sideBackdrop} onClick={() => setShowSidebarFilters(false)} />}

        <div style={layoutRow}>
          {showSidebarFilters && <aside style={sideFilter} onClick={(e) => e.stopPropagation()}>
            <div style={sideHeaderRow}>
              <h3 style={sideTitle}>{t.filters}</h3>
              <button type="button" style={sideCloseBtn} onClick={() => setShowSidebarFilters(false)}>{t.close}</button>
            </div>

            <label style={inputLabel}>{t.purpose}</label>
            <select value={(sidebarFilters || filters).searchType} onChange={(e) => handleSidebarFilterChange("searchType", e.target.value)} style={sideInput}>
              <option value="all">{t.all}</option>
              <option value="buy">{t.forSale}</option>
              <option value="rent">{t.forRent}</option>
            </select>

            <label style={inputLabel}>{t.type}</label>
            <select value={(sidebarFilters || filters).type} onChange={(e) => handleSidebarFilterChange("type", e.target.value)} style={sideInput}>
              <option value="all">{t.allProperties}</option>
              <option value="apartment">{t.apartment}</option>
              <option value="villa">{t.villa}</option>
              <option value="chalet">{t.chalet}</option>
              <option value="duplex">{t.duplex}</option>
            </select>

            <label style={inputLabel}>{t.location}</label>
            <input value={(sidebarFilters || filters).location} onChange={(e) => handleSidebarFilterChange("location", e.target.value)} style={sideInput} placeholder={t.locationPlaceholder} />

            <div style={rangeBlock}>
              <div style={rangeTitleRow}>
                <span style={rangeIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="price">
                    <path d="M20.036 10.733C20.013 10.4141 19.899 10.1085 19.7076 9.85235C19.5162 9.59624 19.2553 9.40038 18.956 9.288C18.4559 9.05153 17.9159 8.9111 17.364 8.874L12.022 4L4 11.319L4.844 12.244L5.573 11.579V18.122C5.57379 18.6198 5.77191 19.097 6.12393 19.4491C6.47595 19.8011 6.95317 19.9992 7.451 20H11.9C12.6076 20.0123 13.3088 19.8643 13.951 19.567C14.1115 19.4879 14.2636 19.3927 14.405 19.283C14.5463 19.3928 14.6985 19.4879 14.859 19.567C15.5 19.8637 16.1998 20.0117 16.906 20C17.6136 20.0123 18.3148 19.8643 18.957 19.567C19.2565 19.4545 19.5174 19.2585 19.7089 19.0022C19.9003 18.7459 20.0142 18.4401 20.037 18.121V10.827C20.037 10.796 20.037 10.765 20.037 10.733H20.036ZM18.784 10.733C18.784 10.755 18.717 10.898 18.397 11.058C17.9283 11.2669 17.4191 11.3694 16.906 11.358C16.3929 11.3693 15.8838 11.2669 15.415 11.058C15.095 10.898 15.028 10.758 15.028 10.733C15.028 10.708 15.095 10.568 15.415 10.408C15.8838 10.1991 16.3929 10.0967 16.906 10.108C17.4191 10.0966 17.9283 10.1991 18.397 10.408C18.717 10.568 18.784 10.711 18.784 10.733ZM6.825 18.121V10.436L12.025 5.695L15.647 9C15.373 9.06557 15.1071 9.16115 14.854 9.285C14.5547 9.39738 14.2938 9.59324 14.1024 9.84935C13.911 10.1055 13.797 10.4111 13.774 10.73C13.774 10.762 13.774 10.793 13.774 10.824V14.133C13.1806 13.8855 12.5429 13.762 11.9 13.77C11.1924 13.7576 10.4912 13.9056 9.849 14.203C9.54966 14.3154 9.28882 14.5112 9.0974 14.7673C8.90598 15.0235 8.79201 15.3291 8.769 15.648C8.769 15.659 8.769 15.669 8.769 15.679V18.121C8.7688 18.3398 8.82383 18.5551 8.929 18.747H7.451C7.28506 18.7467 7.12598 18.6807 7.00864 18.5634C6.8913 18.446 6.82526 18.2869 6.825 18.121ZM13.775 15.679C13.775 15.698 13.705 15.835 13.395 15.985C12.9214 16.1873 12.4099 16.2859 11.895 16.274C11.3819 16.2853 10.8728 16.1829 10.404 15.974C10.084 15.814 10.017 15.674 10.017 15.649C10.017 15.624 10.084 15.484 10.404 15.324C10.8728 15.1151 11.3819 15.0127 11.895 15.024C12.4067 15.0136 12.9139 15.1203 13.378 15.336C13.678 15.492 13.778 15.643 13.778 15.681L13.775 15.679ZM13.388 18.446C12.9192 18.6549 12.4101 18.7573 11.897 18.746C11.3839 18.7573 10.8748 18.6549 10.406 18.446C10.086 18.286 10.019 18.146 10.019 18.121V17.173C10.6154 17.4142 11.2538 17.5342 11.897 17.526C12.5392 17.5374 13.1773 17.4222 13.775 17.187V18.121C13.775 18.143 13.708 18.286 13.388 18.446ZM18.397 18.446C17.9283 18.6549 17.4191 18.7574 16.906 18.746C16.3929 18.7573 15.8838 18.6549 15.415 18.446C15.095 18.286 15.028 18.146 15.028 18.121V17.173C16.236 17.6442 17.577 17.6442 18.785 17.173V18.121C18.785 18.143 18.718 18.286 18.398 18.446H18.397ZM18.397 15.973C17.9283 16.1819 17.4191 16.2844 16.906 16.273C16.3929 16.2843 15.8838 16.1819 15.415 15.973C15.095 15.813 15.028 15.673 15.028 15.648V14.762C16.236 15.2332 17.577 15.2332 18.785 14.762V15.648C18.785 15.67 18.718 15.813 18.398 15.973H18.397ZM18.397 13.562C17.9283 13.7709 17.4191 13.8734 16.906 13.862C16.3929 13.8733 15.8838 13.7709 15.415 13.562C15.095 13.402 15.028 13.262 15.028 13.237V12.257C16.236 12.7282 17.577 12.7282 18.785 12.257V13.237C18.785 13.259 18.718 13.402 18.398 13.562H18.397Z" fill="currentColor"></path>
                  </svg>
                </span>
                <span style={rangeTitleText}>{`${t.maxPrice} (EGP)`}</span>
              </div>
              <div style={histogramWrap}>
                {PRICE_BARS.map((h, i) => <span key={`p-${i}`} style={{ ...histBar, height: `${h}px` }} />)}
              </div>
              <div style={sliderWrap}>
                <div style={rangeTrackWrap}>
                  <div style={rangeBaseLine} />
                  <div style={{ ...rangeFillLine, left: `${priceMinPercent}%`, right: `${100 - priceMaxPercent}%` }} />
                  <input
                    className="dual-range-input"
                    type="range"
                    min="5000"
                    max="10000000"
                    step="5000"
                    value={priceMinValue}
                    onChange={(e) => {
                      const next = Math.min(Number(e.target.value), priceMaxValue - 5000);
                      handleSidebarFilterChange("minPrice", String(next));
                    }}
                    style={rangeInputOverlay}
                  />
                  <input
                    className="dual-range-input"
                    type="range"
                    min="5000"
                    max="10000000"
                    step="5000"
                    value={priceMaxValue}
                    onChange={(e) => {
                      const next = Math.max(Number(e.target.value), priceMinValue + 5000);
                      handleSidebarFilterChange("maxPrice", String(next));
                    }}
                    style={rangeInputOverlay}
                  />
                </div>
              </div>
              <div style={rangeScaleRow}>
                <span>{formatPriceShort(priceMaxValue)}</span>
                <span>{formatPriceShort(priceMinValue)}</span>
              </div>
            </div>

            <div style={rangeDivider} />

            <div style={rangeBlock}>
              <div style={rangeTitleRow}>
                <span style={rangeIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" aria-label="area" viewBox="0 0 24 24" fill="none">
                    <path d="M10.65 13.35H7.95M10.65 13.35V16.05M10.65 13.35L7.5 16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M13.3496 10.65H16.0496M13.3496 10.65V7.95M13.3496 10.65L16.4996 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M10.65 10.65H7.95M10.65 10.65V7.95M10.65 10.65L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M13.3496 13.35H16.0496M13.3496 13.35V16.05M13.3496 13.35L16.4996 16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M3 12C3 7.75736 3 5.63604 4.31802 4.31802C5.63604 3 7.75736 3 12 3C16.2426 3 18.364 3 19.682 4.31802C21 5.63604 21 7.75736 21 12C21 16.2426 21 18.364 19.682 19.682C18.364 21 16.2426 21 12 21C7.75736 21 5.63604 21 4.31802 19.682C3 18.364 3 16.2426 3 12Z" stroke="currentColor" strokeWidth="1.2"></path>
                  </svg>
                </span>
                <span style={rangeTitleText}>{t.minArea}</span>
              </div>
              <div style={histogramWrap}>
                {AREA_BARS.map((h, i) => <span key={`a-${i}`} style={{ ...histBar, height: `${h}px` }} />)}
              </div>
              <div style={sliderWrap}>
                <div style={rangeTrackWrap}>
                  <div style={rangeBaseLine} />
                  <div style={{ ...rangeFillLine, left: `${areaMinPercent}%`, right: `${100 - areaMaxPercent}%` }} />
                  <input
                    className="dual-range-input"
                    type="range"
                    min="10"
                    max="5000"
                    step="10"
                    value={areaMinValue}
                    onChange={(e) => {
                      const next = Math.min(Number(e.target.value), areaMaxValue - 10);
                      handleSidebarFilterChange("minArea", String(next));
                    }}
                    style={rangeInputOverlay}
                  />
                  <input
                    className="dual-range-input"
                    type="range"
                    min="10"
                    max="5000"
                    step="10"
                    value={areaMaxValue}
                    onChange={(e) => {
                      const next = Math.max(Number(e.target.value), areaMinValue + 10);
                      handleSidebarFilterChange("maxArea", String(next));
                    }}
                    style={rangeInputOverlay}
                  />
                </div>
              </div>
              <div style={rangeScaleRow}>
                <span>{`${areaMaxValue} Meter`}</span>
                <span>{`${areaMinValue} Meter`}</span>
              </div>
            </div>

            <label style={inputLabel}>{t.rooms}</label>
            <select value={(sidebarFilters || filters).rooms} onChange={(e) => handleSidebarFilterChange("rooms", e.target.value)} style={sideInput}>
              <option value="all">{t.all}</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>

            <label style={inputLabel}>{t.baths}</label>
            <select value={(sidebarFilters || filters).baths} onChange={(e) => handleSidebarFilterChange("baths", e.target.value)} style={sideInput}>
              <option value="all">{t.all}</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>

            <label style={inputLabel}>{t.features}</label>
            <div style={featureFilterWrap}>
              {AVAILABLE_FEATURES.map((f) => {
                const active = ((sidebarFilters || filters).features || []).includes(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleSidebarFeatureFilter(f.key)}
                    style={{
                      ...featureFilterChip,
                      backgroundColor: active ? "#e7f0f8" : "#fff",
                      borderColor: active ? "#bfdbfe" : "#d1d5db",
                      color: active ? "#0b5fa8" : "#374151",
                    }}
                  >
                    {isRTL ? f.ar : f.en}
                  </button>
                );
              })}
            </div>

            <button type="button" style={searchBtn} onClick={applySidebarFilters}>{`${t.search} (${qualifiedSidebarCount})`}</button>
            <button type="button" style={resetBtn} onClick={resetSidebarDraftFilters}>{t.reset}</button>
          </aside>}

          <section style={cardsSection}>
            {displayedHouses.length === 0 ? (
              <div style={emptyBox}>{t.noMatch}</div>
            ) : viewMode === "grid" ? (
              <div style={gridWrap}>
                {displayedHouses.map((house) => (
                  <PropertyCard
                    key={house.id}
                    property={house}
                    isFavorite={favoriteIds.includes(Number(house.id))}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div style={listWrap}>
                {displayedHouses.map((house) => (
                  <PropertyCard
                    key={house.id}
                    property={house}
                    isFavorite={favoriteIds.includes(Number(house.id))}
                    onToggleFavorite={toggleFavorite}
                    variant="list"
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const pageWrap = { background: "#f3f4f6", minHeight: "100vh", paddingTop: "0", paddingBottom: "40px", borderTop: "1px solid #d1d5db" };
const container = { maxWidth: "1400px", margin: "0 auto", padding: "0 18px" };
const headerRow = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "14px" };
const headerTitleWrap = { display: "grid", gap: "2px" };
const headerTitleText = { fontSize: "1.35rem", color: "#0f172a", fontWeight: 800 };
const countText = { fontSize: "1rem", color: "#475569", fontWeight: 600 };
const toggleBtnActive = { background: "#1f7ae0", color: "#fff" };
const topFilterWrap = {
  position: "sticky",
  top: "0px",
  zIndex: 800,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 0,
  marginInline: "-18px",
  padding: "14px",
  marginBottom: "14px",
  display: "grid",
  gap: "10px",
};
const topLocationWrap = { position: "relative" };
const topLocationIcon = { position: "absolute", top: "50%", transform: "translateY(-50%)", insetInlineStart: "12px", color: "#0b79c7", fontSize: "1rem" };
const topLocationInput = { width: "100%", border: "1px solid #d1d5db", borderRadius: "12px", padding: "11px 12px 11px 34px", outline: "none", fontSize: "1.02rem" };
const topRowFilters = { display: "grid", gridTemplateColumns: "repeat(5, minmax(150px, 1fr))", gap: "10px" };
const topSelectWrap = { position: "relative" };
const topSelect = { width: "100%", border: "1px solid #d1d5db", borderRadius: "12px", padding: "11px 12px", outline: "none", fontSize: "1rem", background: "#fff", color: "#334155" };
const topSelectNoNative = { ...topSelect, appearance: "none", WebkitAppearance: "none", MozAppearance: "none", paddingInlineEnd: "38px" };
const topSelectArrow = { position: "absolute", top: "50%", insetInlineEnd: "12px", transform: "translateY(-50%)", color: "#4b5563", pointerEvents: "none", display: "inline-flex", alignItems: "center" };
const topMoreBtn = { width: "100%", border: "1px solid #d1d5db", borderRadius: "12px", padding: "11px 12px", outline: "none", fontSize: "1rem", background: "#fff", color: "#334155", cursor: "pointer", fontWeight: 600 };
const bottomFilterBar = { position: "sticky", bottom: "10px", zIndex: 40, display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" };
const bottomToggleWrap = { border: "1px solid #cbd5e1", borderRadius: "12px", background: "#e8edf3", padding: "3px", display: "flex", gap: "3px", minWidth: "110px" };
const bottomToggleBtn = { width: "50px", height: "40px", border: "none", borderRadius: "10px", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: "1.05rem", fontWeight: 700 };
const bottomSortWrap = { position: "relative", width: "260px" };
const bottomSortTrigger = { width: "100%", height: "46px", border: "1px solid #d1d5db", background: "#fff", borderRadius: "12px", padding: "8px 12px", fontSize: "0.92rem", color: "#0f172a", fontWeight: 500, lineHeight: 1.2, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" };
const bottomSortLabelWrap = { display: "inline-flex", alignItems: "center", gap: "8px" };
const bottomSortIcon = { color: "#6b7280", fontSize: "1.05rem", lineHeight: 1 };
const bottomSortCaret = { color: "#4b5563", display: "inline-flex", alignItems: "center", lineHeight: 1, transition: "transform 0.2s ease" };
const bottomSortMenu = { position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1px solid #d1d5db", borderRadius: "12px", boxShadow: "0 10px 24px rgba(2,6,23,0.1)", zIndex: 1200, padding: "4px 0" };
const bottomSortItem = { width: "100%", border: "none", background: "#fff", textAlign: "start", padding: "12px 14px", fontSize: "0.95rem", color: "#374151", cursor: "pointer", borderBottom: "1px solid #e5e7eb" };
const bottomSortItemActive = { color: "#0b79c7", fontWeight: 700 };
const layoutRow = { display: "grid", gridTemplateColumns: "1fr", gap: "16px", alignItems: "start" };
const sideBackdrop = { position: "fixed", inset: 0, background: "rgba(15,23,42,0.25)", zIndex: 1200 };
const sideFilter = { position: "fixed", top: "0", insetInlineEnd: 0, width: "min(380px, 95vw)", height: "100vh", overflowY: "auto", overflowX: "hidden", background: "#fff", borderInlineStart: "1px solid #e5e7eb", padding: "18px", display: "grid", gap: "12px", alignContent: "start", zIndex: 1300, boxShadow: "-8px 0 24px rgba(0,0,0,0.12)", boxSizing: "border-box" };
const sideHeaderRow = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "2px" };
const sideTitle = { margin: 0, marginBottom: "4px", fontSize: "1.05rem", color: "#111827" };
const sideCloseBtn = { border: "1px solid #d1d5db", borderRadius: "8px", background: "#fff", padding: "6px 10px", color: "#334155", cursor: "pointer", fontWeight: 700 };
const inputLabel = { fontSize: "0.82rem", fontWeight: 700, color: "#475569", marginTop: "8px" };
const sideInput = { width: "100%", border: "1px solid #d1d5db", borderRadius: "10px", padding: "10px 10px", minHeight: "42px", outline: "none", boxSizing: "border-box" };
const rangeBlock = { display: "grid", gap: "12px", marginTop: "12px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px", background: "#fcfdff" };
const rangeTitleRow = { display: "flex", alignItems: "center", gap: "8px" };
const rangeIcon = { fontSize: "0.95rem", color: "#0f172a" };
const rangeTitleText = { fontWeight: 800, color: "#0f172a" };
const histogramWrap = { height: "64px", display: "flex", alignItems: "flex-end", gap: "3px", paddingInline: "6px", overflow: "hidden" };
const histBar = { display: "inline-block", width: "12px", background: "#7bb6dd", borderRadius: "2px 2px 0 0", flex: "0 0 auto" };
const sliderWrap = { display: "grid", alignItems: "center", gap: "10px" };
const rangeTrackWrap = { position: "relative", height: "20px", display: "grid", alignItems: "center", direction: "rtl" };
const rangeBaseLine = { position: "absolute", left: 0, right: 0, top: "50%", height: "4px", transform: "translateY(-50%)", background: "#cbd5e1", borderRadius: "999px" };
const rangeFillLine = { position: "absolute", top: "50%", height: "4px", transform: "translateY(-50%)", background: "#1d8ace", borderRadius: "999px" };
const rangeInputOverlay = { position: "absolute", inset: 0, width: "100%", height: "20px", margin: 0, background: "transparent", pointerEvents: "none", accentColor: "#1d8ace", direction: "ltr" };
const rangeScaleRow = { display: "flex", justifyContent: "space-between", color: "#0f172a", fontSize: "0.95rem" };
const rangeDivider = { height: "1px", background: "#e5e7eb", margin: "16px 0" };
const searchBtn = { width: "100%", boxSizing: "border-box", marginTop: "12px", border: "none", borderRadius: "10px", background: "#0b79c7", padding: "11px", color: "#fff", cursor: "pointer", fontWeight: 800 };
const resetBtn = { width: "100%", boxSizing: "border-box", marginTop: "8px", border: "1px solid #d1d5db", borderRadius: "10px", background: "#fff", padding: "10px", color: "#334155", cursor: "pointer", fontWeight: 700 };
const featureFilterWrap = { display: "flex", flexWrap: "wrap", gap: "10px", paddingTop: "6px" };
const featureFilterChip = { border: "1px solid #d1d5db", borderRadius: "999px", padding: "9px 12px", cursor: "pointer", fontWeight: 600, background: "#fff", fontSize: "0.9rem" };
const cardsSection = { minWidth: 0 };
const gridWrap = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" };
const listWrap = { display: "grid", gap: "12px" };
const emptyBox = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "50px", textAlign: "center", color: "#64748b" };

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
