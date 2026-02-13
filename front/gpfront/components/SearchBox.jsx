// components/SearchBox.jsx
"use client";
import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const SearchBox = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [searchType, setSearchType] = useState('buy');
  const [activePopup, setActivePopup] = useState(null);
const propertyTypes = [
  { id: 'apartments', ar: 'شقق', en: 'Apartments' },
  { id: 'furnished-apartments', ar: 'شقق مفروشة', en: 'Furnished Apartments' },
  { id: 'villas', ar: 'فلل', en: 'Villas' },
  { id: 'chalets', ar: 'شاليهات', en: 'Chalets' },
];

const [selectedType, setSelectedType] = useState(null);


  // States for the slider values
  const [price, setPrice] = useState(500000);
  const [area, setArea] = useState(150);

  const togglePopup = (type) => setActivePopup(activePopup === type ? null : type);

  return (
    <div className="search-box-wrapper" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="search-container">
        {/* ... Top Row and Main Input stay the same ... */}
        <div className="search-top-row">
          <span className="property-count">
            {isRTL ? '433,740 عقار للبيع و للإيجار' : '433,740 Properties for Buy & Rent'}
          </span>
          <div className="type-toggle">
            <button className={`toggle-btn ${searchType === 'rent' ? 'active' : ''}`} onClick={() => setSearchType('rent')}>
              {isRTL ? 'للإيجار' : 'For Rent'}
            </button>
            <button className={`toggle-btn ${searchType === 'buy' ? 'active' : ''}`} onClick={() => setSearchType('buy')}>
              {isRTL ? 'للبيع' : 'For Buy'}
            </button>
          </div>
        </div>

        <div className="main-input-wrapper">
          <input type="text" placeholder={isRTL ? 'المدينة، أو الحي أو إسم الشارع' : 'City, District, or Street Name'} className="location-input" />
        </div>

        <div className="filters-row">
          <button className="search-submit-btn">{isRTL ? 'بحث' : 'Search'}</button>

          {/* AREA SLIDER FILTER */}
          <div className="custom-filter-item">
            <div className={`filter-text-box ${activePopup === 'area' ? 'active' : ''}`} onClick={() => togglePopup('area')}>
              <span>{isRTL ? `المساحة: ${area} م²` : `Area: ${area} m²`}</span>
              <span className={`arrow-icon ${activePopup === 'area' ? 'up' : 'down'}`}></span>
            </div>
            {activePopup === 'area' && (
              <div className="simple-range-popup">
                <div className="slider-display">{area} {isRTL ? 'متر مربع' : 'm²'}</div>
                <input 
                  type="range" min="10" max="1000" step="10" value={area} 
                  onChange={(e) => setArea(e.target.value)} className="visual-slider" 
                />
                <button className="apply-btn" onClick={() => setActivePopup(null)}>{isRTL ? 'تطبيق' : 'Apply'}</button>
              </div>
            )}
          </div>

          {/* PRICE SLIDER FILTER */}
          <div className="custom-filter-item">
            <div className={`filter-text-box ${activePopup === 'price' ? 'active' : ''}`} onClick={() => togglePopup('price')}>
              <span>{isRTL ? `السعر: ${price} ج.م` : `Price: ${price} EGP`}</span>
              <span className={`arrow-icon ${activePopup === 'price' ? 'up' : 'down'}`}></span>
            </div>
            {activePopup === 'price' && (
              <div className="simple-range-popup">
                <div className="slider-display">{Number(price).toLocaleString()} {isRTL ? 'جنيه' : 'EGP'}</div>
                <input 
                  type="range" min="100000" max="20000000" step="50000" value={price} 
                  onChange={(e) => setPrice(e.target.value)} className="visual-slider" 
                />
                <button className="apply-btn" onClick={() => setActivePopup(null)}>{isRTL ? 'تطبيق' : 'Apply'}</button>
              </div>
            )}
          </div>

<div className="custom-filter-item">
  <div 
    className={`filter-text-box ${activePopup === 'type' ? 'active' : ''}`} 
    onClick={() => togglePopup('type')}
  >
    <span>
      {selectedType 
        ? (isRTL ? selectedType.ar : selectedType.en) 
        : (isRTL ? 'نوع العقار' : 'Property Type')}
    </span>
    <span className={`arrow-icon ${activePopup === 'type' ? 'up' : 'down'}`}></span>
  </div>

  {activePopup === 'type' && (
    <div className="modern-dropdown-list">
      {propertyTypes.map((type) => (
        <div 
          key={type.id} 
          className={`dropdown-option ${selectedType?.id === type.id ? 'selected' : ''}`}
          onClick={() => {
            setSelectedType(type);
            setActivePopup(null);
          }}
        >
          {isRTL ? type.ar : type.en}
          {selectedType?.id === type.id && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#008ccf" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </div>
      ))}
    </div>
  )}
</div>
        </div>
      </div>
    </div>
  );
};

export default SearchBox;