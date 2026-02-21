"use client";
import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';

const PropertyCard = ({ property, onDelete }) => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const router = useRouter();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // التأكد من وجود مصفوفة صور
  const images = property.images && property.images.length > 0 
    ? property.images 
    : [property.image];

  // ✅ تصحيح دالة الانتقال لضمان عدم ظهور خطأ 404
  const handleCardClick = () => {
    // تأكد أن المجلد في مشروعك هو app/properties/[id]/page.jsx
    router.push(`/properties/${property.id}`); 
  };

  const nextImage = (e) => {
    e.stopPropagation(); 
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation(); 
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="house-card" onClick={handleCardClick} style={{ position: 'relative', cursor: 'pointer' }}>
      
      {/* زر الحذف */}
      {onDelete && (
        <button 
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation(); 
            onDelete(property.id);
          }}
          style={{
            position: 'absolute', top: '12px', right: isRTL ? 'auto' : '12px',
            left: isRTL ? '12px' : 'auto', zIndex: 15, background: 'rgba(220, 53, 69, 0.9)',
            color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      )}

      {/* منطقة الصور (Slider) */}
      <div className="card-media" style={{ 
        backgroundImage: `url(${images[currentImageIndex]})`,
        position: 'relative',
        transition: 'background-image 0.3s ease-in-out'
      }}>
        <div className="badge">{isRTL ? "صور" : "Photos"} {images.length > 1 && `${currentImageIndex + 1}/${images.length}`}</div>
        
        {images.length > 1 && (
          <>
            <button onClick={prevImage} className="nav-arrow left-arrow">
              {isRTL ? '❯' : '❮'}
            </button>
            <button onClick={nextImage} className="nav-arrow right-arrow">
              {isRTL ? '❮' : '❯'}
            </button>
            
            <div className="dots-container">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="card-body">
        <div className="price-row">
          {/* ✅ تحويل السعر لرقم قبل استخدام toLocaleString لتجنب الأخطاء */}
          <span className="price">{Number(property.price).toLocaleString()} {isRTL ? "ج.م" : "EGP"}</span>
          <span className="price-sqm">{Math.round(Number(property.price) / Number(property.area))} {isRTL ? "ج.م/م²" : "EGP/m²"}</span>
        </div>
        
        <h3 className="title">{isRTL ? property.title_ar : property.title_en}</h3>
        
        <div className="location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          {isRTL ? property.location_ar : property.location_en}
        </div>

        <div className="features">
          <span>{property.rooms} 🛏</span>
          <span>{property.baths} 🛁</span>
          <span>{property.area} م²</span>
        </div>

        <div className="actions">
          {/* ✅ إضافة e.stopPropagation() لضمان عدم فتح الصفحة عند الضغط على الأزرار */}
          <button className="btn-call" onClick={(e) => e.stopPropagation()}>{isRTL ? "اتصال" : "Call"}</button>
          <button className="btn-whatsapp" onClick={(e) => e.stopPropagation()}>{isRTL ? "واتساب" : "WhatsApp"}</button>
        </div>
      </div>

      <style jsx>{`
        .nav-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0, 0, 0, 0.4); color: white; border: none; padding: 8px 12px; cursor: pointer; font-size: 18px; z-index: 10; transition: background 0.2s; }
        .nav-arrow:hover { background: rgba(0, 0, 0, 0.7); }
        .left-arrow { left: 0; border-radius: 0 5px 5px 0; }
        .right-arrow { right: 0; border-radius: 5px 0 0 5px; }
        .dots-container { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 255, 255, 0.5); transition: all 0.3s; }
        .dot.active { background: white; width: 12px; border-radius: 4px; }
        .delete-btn:hover { background: #c82333 !important; transform: scale(1.1); }
      `}</style>
    </div>
  );
};

export default PropertyCard;