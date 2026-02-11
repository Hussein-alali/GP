// context/LanguageContext.jsx
"use client";
import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

// --- Translations Dictionary ---
const translations = {
  ar: {
    nav: {
      menu: "القائمة",
      login: "دخول",
      register: "تسجيل الاهتمام",
      langBtn: "English", // Text shown on the button
    },
    hero: {
      slides: [
        {
          id: 1,
          tag: "بيبان",
          title: "فنادق ومنتجعات راقية",
          subtitle: "إمتلك سجل المجموعة بكوكبة من الفنادق والمنتجعات السياحية والتي تعد بمثابة نقاط جذب فى مصر والشرق الأوسط.",
          buttonText: "اعرف المزيد"
        },
        {
          id: 2,
          tag: "منتجع",
          title: "إطلالات بحرية خلابة",
          subtitle: "استمتع بأفضل الأوقات مع العائلة في أفخم المنتجعات المطلة على البحر.",
          buttonText: "احجز الآن"
        },
        {
          id: 3,
          tag: "سكن",
          title: "فلل عصرية فاخرة",
          subtitle: "تصاميم معمارية فريدة تجمع بين الرفاهية والطبيعة.",
          buttonText: "شاهد الوحدات"
        }
      ]
    },
    about: {
      title: "العقارات الذكية",
      text1:"هو مشروع تقني متخصص يهدف إلى تقديم حل رقمي متكامل في مجال عرض وإدارة الوحدات العقارية، من خلال منصة إلكترونية حديثة تجمع بين سهولة الاستخدام ودقة عرض البيانات. يرتكز المشروع على توظيف أحدث تقنيات تطوير الويب لتوفير تجربة استخدام سلسة تساعد المستخدمين على استكشاف الوحدات العقارية ومتابعة أسعارها ومواصفاتها بكل وضوح وشفافية",
      subtitle: "مجموعة طلعت مصطفى السعودية",
      text2: "وفي خطوة ثابتة لدخول السوق السعودي بنجاح، تم توقيع اتفاقية شراكة استراتيجية لتطوير مشاريع مدن ذكية ومستدامة في المملكة.",
      btn: "قراءة المزيد"
    },
    footer: {
      rights: "جميع الحقوق محفوظة لمجموعة طلعت مصطفى السعودية © 2026.",
      privacy: "سياسة الخصوصية",
      terms: "الشروط والأحكام"
    }
  },
  en: {
    nav: {
      menu: "Menu",
      login: "Login",
      register: "Register Interest",
      langBtn: "العربية", // Text shown on the button
    },
    hero: {
      slides: [
        {
          id: 1,
          tag: "Beban",
          title: "Luxury Hotels & Resorts",
          subtitle: "Own a piece of our portfolio of luxury hotels and resorts, which are major attractions in Egypt and the Middle East.",
          buttonText: "Learn More"
        },
        {
          id: 2,
          tag: "Resort",
          title: "Breathtaking Sea Views",
          subtitle: "Enjoy the best times with your family in the most luxurious resorts overlooking the sea.",
          buttonText: "Book Now"
        },
        {
          id: 3,
          tag: "Living",
          title: "Modern Luxury Villas",
          subtitle: "Unique architectural designs combining luxury and nature.",
          buttonText: "View Units"
        }
      ]
    },
    about: {
      title: "Talaat Moustafa Group",
      text1: "Talaat Moustafa Group is the leading Egyptian real estate developer with over 50 years of experience, changing the map of urban development.",
      subtitle: "TMG Saudi Arabia",
      text2: "In a solid step towards successfully entering the Saudi market, a strategic partnership agreement was signed to develop smart sustainable cities.",
      btn: "Read More"
    },
    footer: {
      rights: "All rights reserved to TMG Saudi Arabia © 2026.",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions"
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ar'); // Default is Arabic

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
  };

  // Automatically update the HTML direction (RTL/LTR) when language changes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);