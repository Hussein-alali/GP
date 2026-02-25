"use client";
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { authAPI, userAPI } from "@/services/api";

const ProfilePage = () => {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const router = useRouter();

  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({
    name: "User Name",
    email: "user@smartestate.com",
    phone: "",
    bio: "",
    joinDate: "2026",
    favorites: [],
  });
  const [draft, setDraft] = useState({ phone: "", bio: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [myProperties, setMyProperties] = useState([]);
  const [favoriteProperties, setFavoriteProperties] = useState([]);

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.replace("/login");
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const id = Number(storedUser?.id || 0);
    if (!id) return;

    setUserId(id);
    const nowYear = new Date().getFullYear().toString();
    setUser((prev) => ({
      ...prev,
      name: storedUser?.username || storedUser?.name || prev.name,
      email: storedUser?.email || prev.email,
      phone: storedUser?.phone || "",
      bio:
        storedUser?.bio ||
        (isRTL ? "مهتم بالعقارات السكنية الحديثة." : "Interested in modern residential properties."),
      joinDate: nowYear,
      favorites: Array.isArray(storedUser?.favorites) ? storedUser.favorites.map((x) => Number(x)) : [],
    }));
    setDraft({
      phone: storedUser?.phone || "",
      bio:
        storedUser?.bio ||
        (isRTL ? "مهتم بالعقارات السكنية الحديثة." : "Interested in modern residential properties."),
    });
  }, [isRTL, router]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      try {
        const [profile, listings, favorites] = await Promise.all([
          userAPI.getProfile(userId),
          userAPI.getUserRealEstates(userId),
          userAPI.getFavorites(userId),
        ]);
        if (!active) return;

        const favoriteIds = Array.isArray(profile?.favorites) ? profile.favorites.map((x) => Number(x)) : [];
        setUser((prev) => ({
          ...prev,
          name: profile?.username || prev.name,
          email: profile?.email || prev.email,
          phone: profile?.phone || "",
          bio: profile?.bio || prev.bio,
          favorites: favoriteIds,
        }));
        setDraft((prev) => ({
          phone: profile?.phone ?? prev.phone,
          bio: profile?.bio ?? prev.bio,
        }));
        setMyProperties(Array.isArray(listings) ? listings : []);
        setFavoriteProperties(Array.isArray(favorites) ? favorites : []);

        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (storedUser) {
          storedUser.username = profile?.username || storedUser.username;
          storedUser.email = profile?.email || storedUser.email;
          storedUser.phone = profile?.phone || "";
          storedUser.bio = profile?.bio || "";
          storedUser.favorites = favoriteIds;
          localStorage.setItem("user", JSON.stringify(storedUser));
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsSaving(true);
    setSaveMsg("");
    try {
      const profile = await userAPI.updateProfile(userId, {
        phone: draft.phone,
        bio: draft.bio,
      });
      setUser((prev) => ({
        ...prev,
        phone: profile?.phone || "",
        bio: profile?.bio || prev.bio,
      }));
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser) {
        storedUser.phone = profile?.phone || "";
        storedUser.bio = profile?.bio || "";
        localStorage.setItem("user", JSON.stringify(storedUser));
      }
      setSaveMsg(isRTL ? "تم حفظ البيانات." : "Profile updated.");
    } catch (error) {
      const msg = error?.message || (isRTL ? "فشل حفظ البيانات." : "Failed to save.");
      setSaveMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async (property) => {
    if (!userId || !property?.id) return;
    const propertyId = Number(property.id);
    const isFav = user.favorites.includes(propertyId);
    const nextFavorites = isFav
      ? user.favorites.filter((id) => id !== propertyId)
      : [...user.favorites, propertyId];

    setUser((prev) => ({ ...prev, favorites: nextFavorites }));
    setFavoriteProperties((prev) =>
      isFav ? prev.filter((p) => Number(p.id) !== propertyId) : [property, ...prev]
    );

    try {
      if (isFav) {
        await userAPI.removeFavorite(userId, propertyId);
      } else {
        await userAPI.addFavorite(userId, propertyId);
      }
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser) {
        storedUser.favorites = nextFavorites;
        localStorage.setItem("user", JSON.stringify(storedUser));
      }
    } catch {
      setUser((prev) => ({ ...prev, favorites: user.favorites }));
      setFavoriteProperties((prev) => (isFav ? [...prev, property] : prev.filter((p) => Number(p.id) !== propertyId)));
    }
  };

  const nameInfo = useMemo(
    () => ({
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      textAlign: isRTL ? "right" : "left",
    }),
    [isRTL]
  );

  const contentSection = useMemo(
    () => ({
      marginTop: "40px",
      textAlign: isRTL ? "right" : "left",
    }),
    [isRTL]
  );

  const pageBg = { backgroundColor: "#f4f7f9", minHeight: "100vh", paddingTop: "0", paddingBottom: "60px" };
  const container = { maxWidth: "1100px", margin: "0 auto", padding: "0 20px" };
  const profileHeaderCard = {
    background: "#fff",
    padding: "30px",
    borderRadius: "24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    display: "flex",
    alignItems: "center",
    gap: "25px",
    flexDirection: isRTL ? "row-reverse" : "row",
  };
  const avatarCircle = {
    width: "90px",
    height: "90px",
    background: "#e2e8f0",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "2.5rem",
  };
  const infoGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    margin: "30px 0",
  };
  const infoCard = { background: "#fff", padding: "20px", borderRadius: "15px", border: "1px solid #edf2f7" };
  const propertyGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" };
  const addBtn = { background: "#008ccf", color: "#fff", border: "none", width: "45px", height: "45px", borderRadius: "50%", cursor: "pointer", fontSize: "1.8rem" };
  const input = { width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", marginTop: "8px" };

  return (
    <div style={pageBg} dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      <div style={container}>
        <div style={profileHeaderCard}>
          <div style={avatarCircle}>👤</div>
          <div style={nameInfo}>
            <h1 style={{ fontSize: "1.8rem", color: "#004d7a", margin: "0 0 5px 0" }}>{user.name}</h1>
            <p style={{ color: "#718096", margin: "0 0 10px 0" }}>{user.email}</p>
            <span style={{ background: "#ebf8ff", color: "#008ccf", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", width: "fit-content" }}>
              {isRTL ? `عضو منذ ${user.joinDate}` : `Member since ${user.joinDate}`}
            </span>
          </div>
        </div>

        <div style={infoGrid}>
          <div style={infoCard}>
            <h3 style={{ color: "#004d7a", marginBottom: "10px" }}>{isRTL ? "معلومات التواصل" : "Contact"}</h3>
            <input
              style={input}
              placeholder={isRTL ? "رقم الهاتف" : "Phone Number"}
              value={draft.phone}
              onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div style={infoCard}>
            <h3 style={{ color: "#004d7a", marginBottom: "10px" }}>{isRTL ? "نبذة" : "Bio"}</h3>
            <textarea
              style={{ ...input, minHeight: "90px", resize: "vertical" }}
              placeholder={isRTL ? "اكتب نبذة عنك" : "Write your bio"}
              value={draft.bio}
              onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ marginTop: "-8px", marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSaving}
            style={{ border: "none", background: "#0b79c7", color: "#fff", padding: "10px 18px", borderRadius: "999px", cursor: "pointer", fontWeight: 700 }}
          >
            {isSaving ? (isRTL ? "جارٍ الحفظ..." : "Saving...") : isRTL ? "حفظ التعديلات" : "Save Changes"}
          </button>
          {saveMsg && <span style={{ color: "#0b5fa8", fontWeight: 600 }}>{saveMsg}</span>}
        </div>

        <div id="favorites" style={contentSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h2 style={{ color: "#004d7a", fontWeight: "800" }}>{isRTL ? "عقاراتي المنشورة" : "My Listings"}</h2>
            <button onClick={() => router.push("/profile/add-property")} style={addBtn}>+</button>
          </div>

          {myProperties.length > 0 ? (
            <div style={propertyGrid}>
              {myProperties.map((prop, index) => (
                <PropertyCard
                  key={prop.id || index}
                  property={prop}
                  isFavorite={user.favorites.includes(Number(prop.id))}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px", background: "#fff", borderRadius: "20px", border: "2px dashed #e2e8f0" }}>
              <p style={{ color: "#718096" }}>{isRTL ? "لم تقم بنشر أي عقارات بعد." : "No properties published yet."}</p>
            </div>
          )}
        </div>

        <div style={contentSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ color: "#004d7a", fontWeight: "800" }}>{isRTL ? "مفضلاتي" : "My Favorites"}</h2>
            <span style={{ color: "#64748b", fontWeight: 700 }}>{favoriteProperties.length}</span>
          </div>

          {favoriteProperties.length > 0 ? (
            <div style={propertyGrid}>
              {favoriteProperties.map((prop, index) => (
                <PropertyCard
                  key={`fav-${prop.id || index}`}
                  property={prop}
                  isFavorite={user.favorites.includes(Number(prop.id))}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "20px", border: "2px dashed #e2e8f0" }}>
              <p style={{ color: "#718096" }}>{isRTL ? "لا توجد عقارات في المفضلة." : "No favorite properties yet."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
