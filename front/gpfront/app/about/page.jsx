// app/about/page.jsx
"use client";
import React from 'react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext'; // Import Hook

const AboutPage = () => {
  const { t, language } = useLanguage(); // Get translations
  const isRTL = language === 'ar';

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      {/* Page Content Container */}
      <div className="page-content-wrapper" style={{ paddingTop: '120px', paddingBottom: '50px' }}>
        
        <div className="about-container" style={{ flexDirection: 'column', gap: '40px' }}>
            
            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ color: '#004d7a', fontSize: '3rem', fontWeight: '800' }}>
                    {t.aboutPage.mainTitle}
                </h1>
                <p style={{ color: '#666', marginTop: '10px' }}>
                    {t.aboutPage.subTitle}
                </p>
            </div>

            {/* Detailed Content */}
            <div 
                className="about-content-col" 
                style={{ 
                    textAlign: isRTL ? 'right' : 'left', // Align text based on language
                    maxWidth: '800px', 
                    margin: '0 auto' 
                }}
            >
                
                {/* Vision */}
                <h2 className="about-heading" style={{ fontSize: '2rem' }}>{t.aboutPage.visionTitle}</h2>
                <p className="about-text">
                    {t.aboutPage.visionText}
                </p>
                <br />

                {/* Mission */}
                <h2 className="about-heading" style={{ fontSize: '2rem' }}>{t.aboutPage.missionTitle}</h2>
                <p className="about-text">
                    {t.aboutPage.missionText}
                </p>
                <br />

                {/* Why Us? */}
                <h2 className="about-heading" style={{ fontSize: '2rem' }}>{t.aboutPage.whyUsTitle}</h2>
                <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    textAlign: isRTL ? 'right' : 'left' 
                }}>
                    {t.aboutPage.whyUsList.map((item, index) => (
                        <li key={index} className="about-text" style={{ marginBottom: '10px' }}>
                            {item}
                        </li>
                    ))}
                </ul>

            </div>

        </div>
      </div>
    </div>
  );
};

export default AboutPage;