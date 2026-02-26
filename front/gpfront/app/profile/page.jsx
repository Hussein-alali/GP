"use client";
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { authAPI, realEstateAPI, userAPI } from "@/services/api";

const ProfilePage = () => {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const router = useRouter();

  const t = isRTL
    ? {
        defaultBio: "مهتم بالعقارات السكنية الحديثة.",
        memberSince: "عضو منذ",
        edit: "تعديل",
        account: "الحساب",
        name: "الاسم",
        email: "البريد الإلكتروني",
        contact: "معلومات التواصل",
        phone: "رقم الهاتف",
        bio: "نبذة",
        bioPlaceholder: "اكتب نبذة عنك",
        saving: "جارٍ الحفظ...",
        saveChanges: "حفظ التعديلات",
        cancel: "إلغاء",
        profileUpdated: "تم حفظ البيانات.",
        profileSaveFailed: "فشل حفظ البيانات.",
        myListings: "عقاراتي المنشورة",
        removeListing: "حذف الإعلان",
        deleting: "جارٍ الحذف...",
        confirmDeleteTitle: "تأكيد الحذف",
        confirmDeleteListing: "هل تريد حذف هذا العقار؟",
        deleteListingFailed: "فشل حذف العقار.",
        noListings: "لم تقم بنشر أي عقارات بعد.",
        myFavorites: "مفضلاتي",
        noFavorites: "لا توجد عقارات في المفضلة.",
      }
    : {
        defaultBio: "Interested in modern residential properties.",
        memberSince: "Member since",
        edit: "Edit",
        account: "Account",
        name: "Name",
        email: "Email",
        contact: "Contact",
        phone: "Phone Number",
        bio: "Bio",
        bioPlaceholder: "Write your bio",
        saving: "Saving...",
        saveChanges: "Save Changes",
        cancel: "Cancel",
        profileUpdated: "Profile updated.",
        profileSaveFailed: "Failed to save.",
        myListings: "My Listings",
        removeListing: "Remove Listing",
        deleting: "Deleting...",
        confirmDeleteTitle: "Confirm Deletion",
        confirmDeleteListing: "Do you want to delete this property?",
        deleteListingFailed: "Failed to delete property.",
        noListings: "No properties published yet.",
        myFavorites: "My Favorites",
        noFavorites: "No favorite properties yet.",
      };

  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({
    name: "User Name",
    email: "user@smartestate.com",
    phone: "",
    bio: "",
    joinDate: "2026",
    favorites: [],
  });
  const [draft, setDraft] = useState({ username: "", email: "", phone: "", bio: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPropertyId, setDeletingPropertyId] = useState(null);
  const [pendingDeletePropertyId, setPendingDeletePropertyId] = useState(null);
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
      bio: storedUser?.bio || t.defaultBio,
      joinDate: nowYear,
      favorites: Array.isArray(storedUser?.favorites) ? storedUser.favorites.map((x) => Number(x)) : [],
    }));
    setDraft({
      username: storedUser?.username || storedUser?.name || "",
      email: storedUser?.email || "",
      phone: storedUser?.phone || "",
      bio: storedUser?.bio || t.defaultBio,
    });
  }, [router, t.defaultBio]);

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
          username: profile?.username ?? prev.username,
          email: profile?.email ?? prev.email,
          phone: profile?.phone ?? prev.phone,
          bio: profile?.bio ?? prev.bio,
        }));
        setMyProperties(Array.isArray(listings) ? listings : []);
        setFavoriteProperties(Array.isArray(favorites) ? favorites : []);

        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (storedUser) {
          storedUser.username = profile?.username || storedUser.username;
          storedUser.name = profile?.username || storedUser.name;
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
        username: draft.username,
        email: draft.email,
        phone: draft.phone,
        bio: draft.bio,
      });
      setUser((prev) => ({
        ...prev,
        name: profile?.username || prev.name,
        email: profile?.email || prev.email,
        phone: profile?.phone || "",
        bio: profile?.bio || prev.bio,
      }));
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser) {
        storedUser.username = profile?.username || storedUser.username;
        storedUser.name = profile?.username || storedUser.name;
        storedUser.email = profile?.email || storedUser.email;
        storedUser.phone = profile?.phone || "";
        storedUser.bio = profile?.bio || "";
        localStorage.setItem("user", JSON.stringify(storedUser));
      }
      setSaveMsg(t.profileUpdated);
      setIsEditing(false);
    } catch (error) {
      const msg = error?.message || t.profileSaveFailed;
      setSaveMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = () => {
    setDraft({
      username: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      bio: user.bio || "",
    });
    setSaveMsg("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraft({
      username: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      bio: user.bio || "",
    });
    setSaveMsg("");
    setIsEditing(false);
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

  const handleDeleteMyProperty = async (propertyId) => {
    if (!propertyId) return;
    setPendingDeletePropertyId(propertyId);
  };

  const confirmDeleteMyProperty = async () => {
    if (!pendingDeletePropertyId) return;
    const propertyId = pendingDeletePropertyId;
    setPendingDeletePropertyId(null);

    setDeletingPropertyId(propertyId);
    try {
      await realEstateAPI.deleteProperty(propertyId);
      setMyProperties((prev) => prev.filter((p) => Number(p.id) !== Number(propertyId)));
      setFavoriteProperties((prev) => prev.filter((p) => Number(p.id) !== Number(propertyId)));

      const nextFavorites = user.favorites.filter((id) => Number(id) !== Number(propertyId));
      setUser((prev) => ({ ...prev, favorites: nextFavorites }));

      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser) {
        storedUser.favorites = nextFavorites;
        localStorage.setItem("user", JSON.stringify(storedUser));
      }
    } catch (error) {
      setSaveMsg(error?.message || t.deleteListingFailed);
    } finally {
      setDeletingPropertyId(null);
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
              {`${t.memberSince} ${user.joinDate}`}
            </span>
          </div>
          <div style={{ marginInlineStart: "auto" }}>
            <button
              type="button"
              onClick={handleStartEdit}
              style={{ border: "1px solid #0b79c7", background: "#fff", color: "#0b79c7", padding: "8px 16px", borderRadius: "999px", cursor: "pointer", fontWeight: 700 }}
            >
              {t.edit}
            </button>
          </div>
        </div>

        {isEditing && <div style={infoGrid}>
          <div style={infoCard}>
            <h3 style={{ color: "#004d7a", marginBottom: "10px" }}>{t.account}</h3>
            <input
              style={input}
              placeholder={t.name}
              value={draft.username}
              onChange={(e) => setDraft((prev) => ({ ...prev, username: e.target.value }))}
            />
            <input
              type="email"
              style={input}
              placeholder={t.email}
              value={draft.email}
              onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div style={infoCard}>
            <h3 style={{ color: "#004d7a", marginBottom: "10px" }}>{t.contact}</h3>
            <input
              style={input}
              placeholder={t.phone}
              value={draft.phone}
              onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div style={infoCard}>
            <h3 style={{ color: "#004d7a", marginBottom: "10px" }}>{t.bio}</h3>
            <textarea
              style={{ ...input, minHeight: "90px", resize: "vertical" }}
              placeholder={t.bioPlaceholder}
              value={draft.bio}
              onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </div>
        </div>}

        {isEditing && <div style={{ marginTop: "-8px", marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSaving}
            style={{ border: "none", background: "#0b79c7", color: "#fff", padding: "10px 18px", borderRadius: "999px", cursor: "pointer", fontWeight: 700 }}
          >
            {isSaving ? t.saving : t.saveChanges}
          </button>
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={isSaving}
            style={{ border: "1px solid #94a3b8", background: "#fff", color: "#334155", padding: "10px 18px", borderRadius: "999px", cursor: "pointer", fontWeight: 700 }}
          >
            {t.cancel}
          </button>
          {saveMsg && <span style={{ color: "#0b5fa8", fontWeight: 600 }}>{saveMsg}</span>}
        </div>}

        <div id="favorites" style={contentSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h2 style={{ color: "#004d7a", fontWeight: "800" }}>{t.myListings}</h2>
            <button onClick={() => router.push("/profile/add-property")} style={addBtn}>+</button>
          </div>

          {myProperties.length > 0 ? (
            <div style={propertyGrid}>
              {myProperties.map((prop, index) => (
                <div key={prop.id || index} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <PropertyCard
                    property={prop}
                    isFavorite={user.favorites.includes(Number(prop.id))}
                    onToggleFavorite={handleToggleFavorite}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteMyProperty(prop.id)}
                    disabled={deletingPropertyId === prop.id}
                    style={{
                      border: "1px solid #ef4444",
                      color: "#ef4444",
                      background: "#fff",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: deletingPropertyId === prop.id ? "not-allowed" : "pointer",
                      opacity: deletingPropertyId === prop.id ? 0.7 : 1,
                    }}
                  >
                    {deletingPropertyId === prop.id ? t.deleting : t.removeListing}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px", background: "#fff", borderRadius: "20px", border: "2px dashed #e2e8f0" }}>
              <p style={{ color: "#718096" }}>{t.noListings}</p>
            </div>
          )}
        </div>

        <div style={contentSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ color: "#004d7a", fontWeight: "800" }}>{t.myFavorites}</h2>
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
              <p style={{ color: "#718096" }}>{t.noFavorites}</p>
            </div>
          )}
        </div>
      </div>

      {pendingDeletePropertyId != null && (
        <div
          onClick={() => setPendingDeletePropertyId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#fff",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.15rem" }}>{t.confirmDeleteTitle}</h3>
            <p style={{ margin: "10px 0 20px 0", color: "#475569" }}>{t.confirmDeleteListing}</p>
            <div style={{ display: "flex", justifyContent: isRTL ? "flex-start" : "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setPendingDeletePropertyId(null)}
                style={{
                  border: "1px solid #94a3b8",
                  color: "#334155",
                  background: "#fff",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDeleteMyProperty}
                style={{
                  border: "1px solid #ef4444",
                  color: "#fff",
                  background: "#ef4444",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.removeListing}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
