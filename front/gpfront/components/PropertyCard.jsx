"use client";
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

const PropertyCard = ({ property }) => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div className="house-card">
      <div className="card-media" style={{ backgroundImage: `url(${property.image})` }}>
        <div className="badge">{isRTL ? "صور" : "Photos"}</div>
      </div>
      
      <div className="card-body">
        <div className="price-row">
          <span className="price">{property.price.toLocaleString()} {isRTL ? "ج.م" : "EGP"}</span>
          <span className="price-sqm">{Math.round(property.price / property.area)} {isRTL ? "ج.م/م²" : "EGP/m²"}</span>
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
          <button className="btn-call">{isRTL ? "اتصال" : "Call"}</button>
          <button className="btn-whatsapp">{isRTL ? "واتساب" : "WhatsApp"}</button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;