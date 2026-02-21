"use client";
import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const PropertyDetails = ({ property }) => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [activeImg, setActiveImg] = useState(0);

  // التأكد من وجود مصفوفة صور أو استخدام الصورة الرئيسية كاحتياط
  const images = property.images?.length > 0 ? property.images : [property.image];

  return (
    <div style={containerStyle} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* 1. قسم معرض الصور (Gallery) */}
      <div style={imageGallerySection}>
        <div style={{ ...mainImageWrapper, backgroundImage: `url(${images[activeImg]})` }}>
          <div style={imageBadge}>
            {isRTL ? 'صور العقار' : 'Property Photos'} ({activeImg + 1}/{images.length})
          </div>
        </div>
        
        {/* الصور المصغرة (Thumbnails) */}
        {images.length > 1 && (
          <div style={thumbnailsGrid}>
            {images.map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveImg(idx)}
                style={{ 
                  ...thumbnailItem, 
                  backgroundImage: `url(${img})`,
                  border: activeImg === idx ? '3px solid #008ccf' : '2px solid transparent'
                }} 
              />
            ))}
          </div>
        )}
      </div>

      <div style={contentLayout}>
        {/* 2. قسم المعلومات الأساسية (Main Info) */}
        <div style={mainInfoSection}>
          <div style={headerInfo}>
            <h1 style={titleStyle}>{isRTL ? property.title_ar : property.title_en}</h1>
            <p style={locationText}>
              <span style={{ fontSize: '1.2rem' }}>📍</span> {isRTL ? property.location_ar : property.location_en}
            </p>
          </div>

          <hr style={divider} />

          {/* شبكة المواصفات (Specs Grid) */}
          <div style={specsGrid}>
            <div style={specCard}>
              <span style={specIcon}>🛏️</span>
              <span style={specValue}>{property.rooms}</span>
              <span style={specLabel}>{isRTL ? 'غرف نوم' : 'Bedrooms'}</span>
            </div>
            <div style={specCard}>
              <span style={specIcon}>🛁</span>
              <span style={specValue}>{property.baths}</span>
              <span style={specLabel}>{isRTL ? 'حمامات' : 'Bathrooms'}</span>
            </div>
            <div style={specCard}>
              <span style={specIcon}>📏</span>
              <span style={specValue}>{property.area}</span>
              <span style={specLabel}>{isRTL ? 'مساحة (م²)' : 'Area (m²)'}</span>
            </div>
            <div style={specCard}>
              <span style={specIcon}>🏢</span>
              <span style={specValue}>{isRTL ? 'سكني' : 'Residential'}</span>
              <span style={specLabel}>{isRTL ? 'نوع العقار' : 'Property Type'}</span>
            </div>
          </div>

          {/* وصف إضافي (اختياري) */}
          <div style={descriptionSection}>
            <h3 style={subTitleStyle}>{isRTL ? 'الوصف' : 'Description'}</h3>
            <p style={descriptionText}>
              {isRTL 
                ? `هذا العقار الممتاز يقع في ${property.location_ar}. يتميز بتصميم عصري ومساحة واسعة تبلغ ${property.area} متر مربع، مما يجعله خياراً مثالياً للسكن أو الاستثمار.`
                : `This excellent property is located in ${property.location_en}. It features a modern design and a spacious area of ${property.area} sqm, making it an ideal choice for living or investment.`
              }
            </p>
          </div>
        </div>

        {/* 3. بطاقة السعر والتواصل (Price & Contact Card) */}
        <div style={sideActionCard}>
          <div style={priceBox}>
            <span style={priceLabel}>{isRTL ? 'السعر الإجمالي' : 'Total Price'}</span>
            <h2 style={priceValue}>
              {Number(property.price).toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
            </h2>
          </div>
          
          <div style={contactActions}>
            <button style={callBtn}>{isRTL ? 'اتصل الآن' : 'Call Now'}</button>
            <button style={whatsappBtn}>{isRTL ? 'راسلنا واتساب' : 'WhatsApp'}</button>
          </div>

          <div style={safetyNotice}>
            <p>🛡️ {isRTL ? 'نصيحة: لا تقم بتحويل مبالغ مالية قبل معاينة العقار.' : 'Tip: Do not transfer money before viewing the property.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- التنسيقات (Styles) ---

const containerStyle = { maxWidth: '1200px', margin: '0 auto' };

const imageGallerySection = { marginBottom: '30px' };

const mainImageWrapper = {
  width: '100%', height: '500px', borderRadius: '24px', backgroundSize: 'cover',
  backgroundPosition: 'center', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  transition: '0.3s'
};

const imageBadge = {
  position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(0,0,0,0.6)',
  color: '#fff', padding: '8px 15px', borderRadius: '10px', fontSize: '0.9rem'
};

const thumbnailsGrid = {
  display: 'flex', gap: '12px', marginTop: '15px', overflowX: 'auto', padding: '5px'
};

const thumbnailItem = {
  width: '120px', height: '80px', borderRadius: '12px', backgroundSize: 'cover',
  backgroundPosition: 'center', cursor: 'pointer', flexShrink: 0, transition: '0.2s'
};

const contentLayout = { display: 'flex', gap: '30px', flexWrap: 'wrap' };

const mainInfoSection = { flex: '2', minWidth: '350px' };

const headerInfo = { marginBottom: '20px' };

const titleStyle = { fontSize: '2.2rem', color: '#004d7a', fontWeight: '800', marginBottom: '10px' };

const locationText = { color: '#666', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' };

const divider = { border: 'none', borderBottom: '1px solid #e2e8f0', margin: '25px 0' };

const specsGrid = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: '20px', marginBottom: '40px'
};

const specCard = {
  background: '#fff', padding: '20px', borderRadius: '18px', textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #edf2f7'
};

const specIcon = { fontSize: '1.8rem', display: 'block', marginBottom: '8px' };
const specValue = { fontSize: '1.2rem', fontWeight: '800', color: '#004d7a', display: 'block' };
const specLabel = { fontSize: '0.85rem', color: '#718096' };

const descriptionSection = { background: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #edf2f7' };
const subTitleStyle = { fontSize: '1.3rem', color: '#004d7a', marginBottom: '15px', fontWeight: '700' };
const descriptionText = { color: '#4a5568', lineHeight: '1.8', fontSize: '1.05rem' };

const sideActionCard = {
  flex: '1', minWidth: '300px', background: '#fff', padding: '30px', borderRadius: '24px',
  boxShadow: '0 15px 35px rgba(0,0,0,0.08)', height: 'fit-content', border: '1px solid #edf2f7'
};

const priceBox = { textAlign: 'center', marginBottom: '25px' };
const priceLabel = { fontSize: '0.9rem', color: '#718096', display: 'block', marginBottom: '5px' };
const priceValue = { fontSize: '2rem', color: '#008ccf', fontWeight: '900', margin: 0 };

const contactActions = { display: 'flex', flexDirection: 'column', gap: '12px' };
const callBtn = {
  padding: '15px', borderRadius: '12px', border: 'none', background: '#008ccf',
  color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s'
};
const whatsappBtn = {
  padding: '15px', borderRadius: '12px', border: '2px solid #25d366', background: 'transparent',
  color: '#25d366', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s'
};

const safetyNotice = {
  marginTop: '25px', padding: '15px', background: '#fff9f9', borderRadius: '12px',
  border: '1px solid #ffebeb', color: '#c53030', fontSize: '0.85rem', textAlign: 'center'
};

export default PropertyDetails;