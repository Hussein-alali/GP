"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { authAPI } from "@/services/api";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setAppLanguage } = useLanguage();
  const isRTL = language === "ar";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const profileWrapRef = useRef(null);
  const langWrapRef = useRef(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("authToken");
        const user = localStorage.getItem("user");
        setIsLoggedIn(Boolean(token || user));
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("focus", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("focus", checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const target = event.target;

      if (profileWrapRef.current && !profileWrapRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (langWrapRef.current && !langWrapRef.current.contains(target)) {
        setIsLangMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const [userRole, setUserRole] = useState("user");
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUserRole(JSON.parse(stored)?.role ?? "user");
    } catch {}
  }, [isLoggedIn]);

  const labels = {
    search: isRTL ? "ابحث" : "Search",
    know: isRTL ? "اعرف" : "Explore",
    announce: isRTL ? "اعلن" : "Advertise",
    valuation: isRTL ? "تقييم السعر" : "Price Valuation",
    addProperty: isRTL ? "إضافة عقار" : "Add Property",
    login: isRTL ? "تسجيل الدخول" : "Login",
    register: isRTL ? "تسجيل حساب" : "Register",
    profile: isRTL ? "الملف الشخصي" : "Profile",
    favorites: isRTL ? "مفضلاتي" : "Favorites",
    admin: isRTL ? "لوحة الإدارة" : "Admin Panel",
    logout: isRTL ? "تسجيل الخروج" : "Logout",
    langLabel: language === "ar" ? "AR" : "EN",
  };

  const modernTriggerBase = (isOpen) => ({
    height: "42px",
    borderRadius: "14px",
    border: isOpen ? "1px solid rgba(14, 165, 233, 0.55)" : "1px solid rgba(148, 163, 184, 0.45)",
    background: isOpen ? "rgba(236, 253, 255, 0.88)" : "rgba(156, 159, 180, 0.92)",
    boxShadow: isOpen ? "0 10px 24px rgba(14, 165, 233, 0.16)" : "0 6px 18px rgba(15, 23, 42, 0.09)",
    transition: "all 0.2s ease",
    backdropFilter: "blur(8px)",
  });

  const avatarOrb = {
    width: "26px",
    height: "26px",
    borderRadius: "10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
    color: "#f8fafc",
    position: "relative",
    flex: "0 0 auto",
  };

  const activeDot = {
    position: "absolute",
    width: "7px",
    height: "7px",
    borderRadius: "999px",
    background: "#22c55e",
    border: "1.5px solid #fff",
    right: "-2px",
    bottom: "-2px",
  };

  const langCodeText = {
    fontWeight: 800,
    fontSize: "0.76rem",
    letterSpacing: "0.04em",
    color: "#0f172a",
    lineHeight: 1,
    minWidth: "26px",
    textAlign: "center",
  };

  const handleLogout = () => {
    authAPI.logout();
    try {
      localStorage.removeItem("user");
    } catch {}
    setIsLoggedIn(false);
    setIsProfileMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="market-nav" dir={isRTL ? "rtl" : "ltr"}>
      <div className="market-nav-inner">
        <div className="market-nav-right">
          <Link href="/" className="market-brand" aria-label="Smart Estate">
            <img
              src="/RSLOGO2.png"
              alt="Smart Estate"
              className="market-brand-logo"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
              style={{
                transform: isLogoHovered ? "translateY(-2px) scale(1.04)" : "translateY(0) scale(1)",
                filter: isLogoHovered ? "drop-shadow(0 10px 18px rgba(2, 132, 199, 0.28)) brightness(1.04)" : "none",
                transition: "transform 0.2s ease, filter 0.2s ease",
              }}
            />
          </Link>

          <nav className="market-links">
            <Link href="/properties" className="market-link-item">
              <svg className="market-link-icon" width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M11.1288 16.4659C12.1853 16.4659 13.2181 16.1526 14.0966 15.5656C14.9751 14.9786 15.6598 14.1443 16.0641 13.1682C16.4684 12.1921 16.5742 11.118 16.3681 10.0818C16.162 9.04553 15.6532 8.09369 14.9061 7.3466C14.159 6.59952 13.2072 6.09075 12.171 5.88463C11.1347 5.67851 10.0606 5.7843 9.08453 6.18862C8.10842 6.59293 7.27409 7.27762 6.68711 8.1561C6.10013 9.03458 5.78687 10.0674 5.78687 11.1239C5.79109 12.5394 6.35525 13.8957 7.35614 14.8966C8.35703 15.8975 9.71331 16.4616 11.1288 16.4659ZM16.7382 15.4862L19.7652 18.5133C19.9228 18.6801 20.0091 18.9017 20.0058 19.1311C20.0025 19.3605 19.9099 19.5796 19.7477 19.7418C19.5855 19.904 19.3664 19.9966 19.137 19.9999C18.9076 20.0032 18.686 19.9169 18.5192 19.7594L15.4921 16.7323C14.2501 17.7147 12.7123 18.2481 11.1288 18.2458C9.72 18.2458 8.34286 17.8281 7.17151 17.0454C6.00015 16.2627 5.08718 15.1503 4.54807 13.8487C4.00895 12.5472 3.86789 11.115 4.14273 9.73331C4.41757 8.3516 5.09597 7.08242 6.09212 6.08626C7.08828 5.0901 8.35748 4.41171 9.73919 4.13687C11.1209 3.86203 12.5531 4.00309 13.8546 4.5422C15.1562 5.08132 16.2686 5.99428 17.0513 7.16564C17.834 8.337 18.2517 9.71414 18.2517 11.1229C18.2689 12.7092 17.7338 14.2522 16.7382 15.4872V15.4862Z" fill="currentColor"></path>
              </svg>
              {labels.search}
            </Link>
            <Link href="/about" className="market-link-item">
              <svg className="market-link-icon" width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12.2766 4C10.8791 4.00174 9.53922 4.55779 8.55109 5.54616C7.56297 6.53454 7.00725 7.87451 7.00586 9.2721C7.00586 13.421 11.2504 18.7663 12.2766 20C13.3023 18.7696 17.5481 13.4315 17.5481 9.27177C17.5465 7.87415 16.9906 6.53421 16.0024 5.54591C15.0142 4.55761 13.6743 4.00165 12.2766 4Z" fill="currentColor"></path>
              </svg>
              {labels.know}
            </Link>
            <Link href="/profile/add-property" className="market-link-item">
              <svg className="market-link-icon market-home-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 49 48" fill="none" aria-hidden="true">
                <path d="M42.6844 26.61L25.4254 9.27904C25.253 9.10835 25.0301 8.99788 24.7898 8.9641C24.5495 8.93032 24.3048 8.97502 24.0919 9.09154L6.69943 26.5321C6.50741 26.746 6.40063 27.023 6.39941 27.3105C6.40001 27.4572 6.43113 27.6022 6.49078 27.7363C6.55044 27.8703 6.63735 27.9904 6.74594 28.0891C6.95669 28.2831 7.23271 28.3909 7.5192 28.3909C7.80568 28.3909 8.08166 28.2831 8.2924 28.0891L11.6119 24.7591V38.2591C11.6063 38.4035 11.6296 38.5475 11.6804 38.6828C11.7313 38.8181 11.8087 38.9418 11.9081 39.0468C12.0074 39.1517 12.1268 39.2357 12.2591 39.2939C12.3914 39.3521 12.5339 39.3833 12.6784 39.3856H36.6049C36.9023 39.3828 37.1866 39.263 37.3963 39.0522C37.606 38.8413 37.7242 38.5564 37.7254 38.2591V24.7905L41.0329 28.1175C41.2538 28.3027 41.5199 28.4414 41.8069 28.44C41.9581 28.4454 42.1085 28.4168 42.2471 28.3563C42.3857 28.2958 42.5091 28.205 42.6079 28.0906C42.8163 27.8746 42.9311 27.5851 42.9274 27.285C42.9172 27.0405 42.8324 26.805 42.6844 26.61ZM35.4844 37.182H13.8244V22.5315L24.6274 11.637L35.4904 22.5315L35.4844 37.182Z" fill="currentColor"></path>
                <path d="M31.4136 27.3422C31.4136 27.474 31.3963 27.6054 31.3491 27.7285C31.302 27.8517 31.2305 27.9642 31.1391 28.0592C31.0572 28.1593 30.954 28.2396 30.8369 28.2944C30.7198 28.3492 30.5919 28.377 30.4626 28.3757H25.6896V33.2447C25.6734 33.5077 25.5607 33.7556 25.3731 33.9407C25.187 34.1065 24.9458 34.1969 24.6966 34.1942H24.6546C24.523 34.1909 24.3935 34.1612 24.2737 34.1068C24.1538 34.0525 24.0462 33.9745 23.9571 33.8777C23.8685 33.7815 23.8004 33.6684 23.7568 33.5452C23.7132 33.4219 23.6951 33.2911 23.7036 33.1607V28.3757H18.8196C18.6892 28.3705 18.5611 28.3396 18.4427 28.2848C18.3243 28.23 18.2179 28.1523 18.1296 28.0563C18.0412 27.9603 17.9727 27.8478 17.9279 27.7252C17.8831 27.6027 17.863 27.4725 17.8686 27.3422C17.8847 27.0852 17.9978 26.8439 18.1851 26.6672C18.3799 26.4905 18.6328 26.3974 18.8916 26.4137H23.7036V21.6286C23.7173 21.3812 23.822 21.1475 23.9976 20.9725C24.1731 20.7976 24.4071 20.6936 24.6546 20.6807H24.6966C24.9513 20.6843 25.1952 20.784 25.3796 20.9598C25.564 21.1355 25.6752 21.3744 25.6911 21.6286V26.4137H30.4701C30.7146 26.4237 30.9466 26.5243 31.1209 26.6959C31.2953 26.8675 31.3997 27.0979 31.4136 27.3422Z" fill="currentColor"></path>
              </svg>
              {labels.announce}
            </Link>
            <Link href="/price-prediction" className="market-link-item">
              <svg className="market-link-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              {labels.valuation}
            </Link>
          </nav>
        </div>

        <div className="market-nav-left">
          <div ref={profileWrapRef} className="profile-menu-wrap">
            <button
              type="button"
              className="profile-trigger"
              style={modernTriggerBase(isProfileMenuOpen)}
              onClick={() => setIsProfileMenuOpen((v) => !v)}
              aria-expanded={isProfileMenuOpen}
              aria-label={labels.profile}
            >
              <span style={avatarOrb} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <circle cx="12" cy="8" r="3.6"></circle>
                  <path d="M4.5 19.4c1.9-3.1 4.6-4.5 7.5-4.5s5.6 1.4 7.5 4.5"></path>
                </svg>
                <span style={activeDot} />
              </span>
              <svg className={`profile-caret ${isProfileMenuOpen ? "open" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>

            {isProfileMenuOpen && (
              <div className="profile-menu-panel">
                <div className="profile-menu-head">
                  <h4>{isLoggedIn ? labels.profile : labels.login}</h4>
                  <p>{isRTL ? "أضف اعلانات ، ملاحظات ، المفضلات وأكثر..." : "Add listings, notes, favorites, and more..."}</p>
                </div>

                <div className="profile-menu-actions">
                  {!isLoggedIn && (
                    <>
                      <Link href="/login" className="menu-primary" onClick={() => setIsProfileMenuOpen(false)}>
                        {labels.login}
                      </Link>
                      <Link href="/register" className="menu-secondary" onClick={() => setIsProfileMenuOpen(false)}>
                        {labels.register}
                      </Link>
                      <Link href="/profile" className="menu-secondary" onClick={() => setIsProfileMenuOpen(false)}>
                        {labels.profile}
                      </Link>
                      <Link href="/profile/add-property" className="menu-secondary" onClick={() => setIsProfileMenuOpen(false)}>
                        {labels.addProperty}
                      </Link>
                    </>
                  )}
                  {isLoggedIn && (
                    <>
                      <Link href="/profile" className="menu-primary" onClick={() => setIsProfileMenuOpen(false)}>
                        {labels.profile}
                      </Link>
                      <Link href="/profile/add-property" className="menu-secondary" onClick={() => setIsProfileMenuOpen(false)}>
                        {labels.addProperty}
                      </Link>
                      <Link href="/profile#favorites" className="menu-secondary" onClick={() => setIsProfileMenuOpen(false)}>
                        {labels.favorites}
                      </Link>
                      {userRole === "admin" && (
                        <Link href="/admin" className="menu-secondary" onClick={() => setIsProfileMenuOpen(false)}>
                          {labels.admin}
                        </Link>
                      )}
                      <button type="button" className="menu-secondary" onClick={handleLogout}>
                        {labels.logout}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lang-menu-wrap" ref={langWrapRef}>
            <button
              type="button"
              className="lang-btn"
              style={modernTriggerBase(isLangMenuOpen)}
              onClick={() => setIsLangMenuOpen((v) => !v)}
              aria-expanded={isLangMenuOpen}
              aria-label={isRTL ? "اختيار اللغة" : "Language selector"}
            >
              <span style={{ ...avatarOrb, borderRadius: "8px" }} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <circle cx="12" cy="12" r="8.5"></circle>
                  <path d="M3.8 12h16.4M12 3.8c2.2 2.4 3.4 5.2 3.4 8.2s-1.2 5.8-3.4 8.2M12 3.8c-2.2 2.4-3.4 5.2-3.4 8.2s1.2 5.8 3.4 8.2"></path>
                </svg>
              </span>
              <span style={langCodeText}>{labels.langLabel}</span>
              <span className={`lang-caret ${isLangMenuOpen ? "open" : ""}`} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </span>
            </button>

            {isLangMenuOpen && (
              <div className="lang-menu-panel">
                <div className="lang-menu-title">{isRTL ? "اللغة" : "Language"}</div>
                <button type="button" className="lang-option" onClick={() => { setAppLanguage("ar"); setIsLangMenuOpen(false); }}>
                  <span className="lang-option-label">العربية</span>
                  <span className={`lang-option-indicator ${language === "ar" ? "is-selected" : ""}`}>
                    {language === "ar" ? "✓" : ""}
                  </span>
                </button>
                <button type="button" className="lang-option" onClick={() => { setAppLanguage("en"); setIsLangMenuOpen(false); }}>
                  <span className="lang-option-label">English</span>
                  <span className={`lang-option-indicator ${language === "en" ? "is-selected" : ""}`}>
                    {language === "en" ? "✓" : ""}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  );
};

export default Navbar;
