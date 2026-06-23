"use client";
import React from 'react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';

const AboutPage = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  if (!t || !t.aboutPage) {
    return <div style={{ paddingTop: '150px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', color: '#333' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      {/* 1. Modern Hero Section */}
      <section style={{ 
        height: '60vh', 
        background: 'linear-gradient(rgba(0, 56, 88, 0.8), rgba(0, 56, 88, 0.8)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: '#fff',
        padding: '0 20px'
      }}>
        <div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '20px' }}>
            {t.aboutPage.mainTitle}
          </h1>
          <p style={{ fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', opacity: '0.9' }}>
            {t.aboutPage.subTitle}
          </p>
        </div>
      </section>

      {/* 2. Project Story & Deep Info */}
      <section style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#004d7a', fontSize: '2.5rem', marginBottom: '20px' }}>
              {isRTL ? 'قصتنا' : 'Our Story'}
            </h2>
          <p style={{ lineHeight: '1.8', color: '#666', fontSize: '1.1rem' }}>
  {isRTL 
    ? (
      <>
        بدأت رحلتنا من قلب القاهرة كفريق من الأصدقاء الذين واجهوا بأنفسهم صعوبة البحث عن مسكن مناسب. لقد رأينا كيف يمكن لرحلة البحث عن منزل أن تتحول من حلم جميل إلى عبء ثقيل مليء بالحيرة والشكوك. 
        لذلك، قررنا بناء &quot;العقارات الذكية&quot; لتكون أكثر من مجرد موقع للبحث؛ أردناها أن تكون رفيقاً ذكياً يساعدكم في تقدير القيمة الحقيقية لكل عقار بلمسة واحدة. 
        لقد وضعنا شغفنا في كل زاوية من هذا المشروع، لضمان أن يحصل كل شخص على معلومات واضحة وشفافة تساعده في تأمين مستقبل أسرته. 
        رؤيتنا تتجاوز مجرد البيع والشراء؛ نحن نسعى لخلق مجتمع عقاري رقمي يضع الصدق والسهولة في مقدمة أولوياته، لنحول كل ضغطة زر إلى خطوة واثقة نحو باب منزلك الجديد.
      </>
    ) : (
      <>
        Our journey began in the heart of Cairo as a team of friends who experienced firsthand the struggles of finding the right home. We saw how the search for a dream house could turn from an exciting milestone into a stressful burden filled with uncertainty. 
        Because of this, we decided to build &quot;Smart Estate&quot; to be more than just a search tool; we wanted it to be a smart companion that helps you understand the true value of every property with a single touch. 
        We poured our passion into every corner of this project, ensuring that every person has access to clear, honest information to help secure their family&apos;s future. 
        Our vision goes beyond simple transactions; we strive to create a digital community that prioritizes trust and simplicity, turning every click into a confident step toward the front door of your new home.
      </>
    )
  }
</p>
          </div>
          <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <img src="/RSLOGO2.png" alt="About Us" style={{ width: '100%', height: 'auto', padding: '40px', backgroundColor: '#f9f9f9' }} />
          </div>
        </div>
      </section>

      {/* 3. Vision & Mission Cards */}
      <section style={{ backgroundColor: '#f8f9fa', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          
          {/* Vision Card */}
          <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🔭</div>
            <h3 style={{ color: '#004d7a', marginBottom: '15px' }}>{t.aboutPage.visionTitle}</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>{t.aboutPage.visionText}</p>
          </div>

          {/* Mission Card */}
          <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🎯</div>
            <h3 style={{ color: '#004d7a', marginBottom: '15px' }}>{t.aboutPage.missionTitle}</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>{t.aboutPage.missionText}</p>
          </div>

        </div>
      </section>

      {/* 4. Core Values (Checklist) */}
      <section style={{ padding: '80px 20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: '#004d7a', fontSize: '2.5rem', marginBottom: '40px' }}>{t.aboutPage.whyUsTitle}</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px' 
        }}>
          {t.aboutPage.whyUsList.map((item, index) => (
            <div key={index} style={{ 
              padding: '20px', 
              border: '1px solid #eee', 
              borderRadius: '12px',
              transition: 'transform 0.3s ease',
              backgroundColor: '#fff'
            }}>
              <p style={{ fontWeight: '600', color: '#004d7a' }}>{item}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
