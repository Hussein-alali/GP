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
      subtitle: "التكامل والقيمة المضافة",
      text2: "يعمل الموقع على تسهيل عملية البحث والمقارنة بين الوحدات المختلفة من خلال عرض منظم للبيانات والأسعار، مما يعزز من كفاءة اتخاذ القرار لدى المستخدمين. ويأتي المشروع كخطوة متقدمة نحو رقمنة قطاع العرض العقاري، مع التركيز على تقديم قيمة حقيقية من خلال حلول ذكية قابلة للتطوير والنمو مستقبل",
      btn: "قراءة المزيد"
    },
  footer: {
      rights: "جميع الحقوق محفوظة لنا © 2026.",
      privacy: "سياسة الخصوصية",
      terms: "الشروط و الأحكام"
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
      title: "SMART ESTATE",
      text1: "It is a specialized technology project that aims to provide a comprehensive digital solution for displaying and managing real estate units, through a modern electronic platform that combines ease of use with accurate data presentation. The project relies on employing the latest web development technologies to provide a seamless user experience that helps users explore real estate units and track their prices and specifications with complete clarity and transparency.",
      subtitle: "Integration and added value",
      text2: "The website facilitates the search and comparison of different properties by presenting data and prices in an organized manner, thus enhancing user decision-making efficiency. This project represents a significant step towards digitizing the real estate sector, focusing on delivering genuine value through smart, scalable, and future-proof solutions.",
      btn: "Read More"
    },
 footer: {
      rights: "All rights reserved © 2026.",
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