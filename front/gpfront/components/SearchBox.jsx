// components/SearchBox.jsx
"use client";
import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const SearchBox = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [searchType, setSearchType] = useState('buy');

  return (
    <div className="search-box-wrapper" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="search-container">
        <div className="search-top-row">
          <span className="property-count">
            {isRTL ? '433,740 عقار للبيع و للإيجار' : '433,740 Properties for Buy & Rent'}
          </span>
          <div className="type-toggle">
            <button 
              className={`toggle-btn ${searchType === 'rent' ? 'active' : ''}`}
              onClick={() => setSearchType('rent')}
            >
              {isRTL ? 'للإيجار' : 'For Rent'}
            </button>
            <button 
              className={`toggle-btn ${searchType === 'buy' ? 'active' : ''}`}
              onClick={() => setSearchType('buy')}
            >
              {isRTL ? 'للبيع' : 'For Buy'}
            </button>
          </div>
        </div>

        <div className="main-input-wrapper">
          <input 
            type="text" 
            placeholder={isRTL ? 'المدينة، أو الحي أو إسم الشارع' : 'City, District, or Street Name'} 
            className="location-input"
          />
        </div>

        <div className="filters-row">
          <button className="search-submit-btn">
            {isRTL ? 'بحث' : 'Search'}
          </button>
          <select className="filter-select"><option>{isRTL ? 'المساحة' : 'Area'}</option></select>
          <select className="filter-select"><option>{isRTL ? 'السعر' : 'Price'}</option></select>
          <select className="filter-select"><option>{isRTL ? 'النوع' : 'Type'}</option></select>
        </div>
      </div>
    </div>
  );
};

export default SearchBox;