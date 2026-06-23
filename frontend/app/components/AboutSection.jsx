// // components/AboutSection.jsx
// import React from 'react';
// import Link from 'next/link';

// const AboutSection = () => {
//   return (
//     <section className="about-section">
//       <div className="about-container">

//         {/* Right Column: Text Content */}
//         <div className="about-content-col">
//           <h2 className="about-heading">SMART ESTATE</h2>
//           <p className="about-text">
//             هو مشروع تقني متخصص يهدف إلى تقديم حل رقمي متكامل في مجال عرض وإدارة الوحدات العقارية، من خلال منصة إلكترونية حديثة تجمع بين سهولة الاستخدام ودقة عرض البيانات. يرتكز المشروع على توظيف أحدث تقنيات تطوير الويب لتوفير تجربة استخدام سلسة تساعد المستخدمين على استكشاف الوحدات العقارية ومتابعة أسعارها ومواصفاتها بكل وضوح وشفافية.
//           </p>
//            <h3 className="about-subheading">التكامل والقيمة المضافة</h3>
//           <p className="about-text">
//             يعمل الموقع على تسهيل عملية البحث والمقارنة بين الوحدات المختلفة من خلال عرض منظم للبيانات والأسعار، مما يعزز من كفاءة اتخاذ القرار لدى المستخدمين. ويأتي المشروع كخطوة متقدمة نحو رقمنة قطاع العرض العقاري، مع التركيز على تقديم قيمة حقيقية من خلال حلول ذكية قابلة للتطوير والنمو مستقبلاً.
//           </p>

//           {/* "Read More" Button */}
//           <Link href="/about" className="about-btn">
//             <span>قراءة المزيد</span>
//             {/* Left Arrow Icon for RTL */}
//             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <line x1="19" y1="12" x2="5" y2="12"></line>
//               <polyline points="12 19 5 12 12 5"></polyline>
//             </svg>
//           </Link>
//         </div>
//            {/* Left Column: Logo Image */}
//         <div className="about-logo-col">
//           {/* IMPORTANT: Replace '/tmg-logo-placeholder.png' with the actual path to your logo file in the 'public' folder */}
//           <img 
//             src="/RSLOGO.jpg" 
//             alt="مجموعة طلعت مصطفى - TMG" 
//             className="about-logo" 
//           />
//         </div>

//       </div>
//     </section>
//   );
// };

// export default AboutSection;
// components/AboutSection.jsx
"use client";
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext'; // 1. Import Hook

const AboutSection = () => {
  const { t, language } = useLanguage(); // 2. Get content and current language

  return (
    <section className="about-section">
      <div className="about-container">
        
        

        {/* Text Content Column */}
        <div className="about-content-col">
          <h2 className="about-heading">{t.about.title}</h2>
          <p className="about-text">{t.about.text1}</p>
          
          <h3 className="about-subheading">{t.about.subtitle}</h3>
          <p className="about-text">{t.about.text2}</p>

          {/* "Read More" Button */}
          <Link href="/about" className="about-btn">
            <span>{t.about.btn}</span>
            
            {/* Arrow Icon: Rotates 180deg for English so it points Right */}
            <svg 
              width="20" height="20" viewBox="0 0 24 24" 
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: language === 'en' ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
        </div>
        {/* Logo Column */}
        <div className="about-logo-col">
          <img 
            src="/RSLOGO2.png" 
            alt="مجموعة طلعت مصطفى - TMG" 
            className="about-logo" 
          />
        </div>

      </div>
    </section>
  );
};

export default AboutSection;