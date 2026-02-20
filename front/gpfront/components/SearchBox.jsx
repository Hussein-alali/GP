"use client";
import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';

const SearchBox = () => {
  const { language } = useLanguage();
  const router = useRouter();
  const isRTL = language === 'ar';
  
  // إدارة الحالة
  const [searchType, setSearchType] = useState('buy');
  const [activePopup, setActivePopup] = useState(null);
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState(""); // جعل السعر فارغاً افتراضياً للفلترة المرنة
  const [area, setArea] = useState(""); // جعل المساحة فارغة افتراضياً
  const [selectedType, setSelectedType] = useState(null);

  const propertyTypes = [
    { id: 'apartments', ar: 'شقق', en: 'Apartments' },
    { id: 'furnished-apartments', ar: 'شقق مفروشة', en: 'Furnished Apartments' },
    { id: 'villas', ar: 'فلل', en: 'Villas' },
    { id: 'chalets', ar: 'شاليهات', en: 'Chalets' },
  ];
  const togglePopup = (type) => setActivePopup(activePopup === type ? null : type);

  const handleTypeChange = (type) => {
    setSearchType(type);
    // تصفير القيم عند تغيير النوع لضمان فلترة نظيفة
    setPrice("");
  };

  // ✅ منطق إرسال البحث المحدث للفلترة المرنة
  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // 1. إضافة الموقع فقط إذا كان هناك نص مدخل
    if (location.trim()) {
      params.append('location', location.trim());
    }

    // 2. إضافة نوع العقار فقط إذا تم اختياره
    if (selectedType) {
      params.append('type', selectedType.id);
    }
    
    // 3. إضافة السعر الأقصى فقط إذا قام المستخدم بتحريك السلايدر (أو إدخال قيمة)
    if (price) {
      params.append('maxPrice', price.toString());
    }

    // 4. إضافة المساحة القصوى فقط إذا تم تحديدها
    if (area) {
      params.append('maxArea', area.toString());
    }
    
    // 5. نوع البحث (دائماً موجود: إما بيع أو إيجار)
    params.append('searchType', searchType.toLowerCase());

    // التوجيه لصفحة النتائج بالبارامترات المختارة فقط
    router.push(`/properties?${params.toString()}`);
  };

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
              onClick={() => handleTypeChange('rent')}
            >
              {isRTL ? 'للإيجار' : 'For Rent'}
            </button>
            <button 
              className={`toggle-btn ${searchType === 'buy' ? 'active' : ''}`} 
              onClick={() => handleTypeChange('buy')}
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
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <button className="search-submit-btn" onClick={handleSearch}>
            {isRTL ? 'بحث' : 'Search'}
          </button>

          {/* فلاتر المساحة */}
          <div className="custom-filter-item">
            <div className={`filter-text-box ${activePopup === 'area' ? 'active' : ''}`} onClick={() => togglePopup('area')}>
              <span>{area ? (isRTL ? `المساحة: ${area} م²` : `Area: ${area} m²`) : (isRTL ? 'المساحة' : 'Area')}</span>
              <span className={`arrow-icon ${activePopup === 'area' ? 'up' : 'down'}`}></span>
            </div>
            {activePopup === 'area' && (
              <div className="simple-range-popup">
                <div className="slider-display">{area || 0} {isRTL ? 'متر مربع' : 'm²'}</div>
                <input 
                  type="range" min="10" max="1000" step="10" value={area || 10} 
                  onChange={(e) => setArea(e.target.value)} className="visual-slider" 
                />
                <button className="apply-btn" onClick={() => setActivePopup(null)}>{isRTL ? 'تطبيق' : 'Apply'}</button>
              </div>
            )}
          </div>

          {/* فلاتر السعر */}
          <div className="custom-filter-item">
            <div className={`filter-text-box ${activePopup === 'price' ? 'active' : ''}`} onClick={() => togglePopup('price')}>
              <span>{price ? (isRTL ? `السعر: ${Number(price).toLocaleString()} ج.م` : `Price: ${Number(price).toLocaleString()} EGP`) : (isRTL ? 'السعر' : 'Price')}</span>
              <span className={`arrow-icon ${activePopup === 'price' ? 'up' : 'down'}`}></span>
            </div>
            {activePopup === 'price' && (
              <div className="simple-range-popup">
                <div className="slider-display">{Number(price || 0).toLocaleString()} {isRTL ? 'جنيه' : 'EGP'}</div>
                <input 
                  type="range" 
                  min={searchType === 'rent' ? "500" : "100000"} 
                  max={searchType === 'rent' ? "100000" : "20000000"} 
                  step={searchType === 'rent' ? "500" : "50000"} 
                  value={price || (searchType === 'rent' ? 500 : 100000)} 
                  onChange={(e) => setPrice(e.target.value)} 
                  className="visual-slider" 
                />
                <button className="apply-btn" onClick={() => setActivePopup(null)}>{isRTL ? 'تطبيق' : 'Apply'}</button>
              </div>
            )}
          </div>

          {/* فلتر نوع العقار */}
          <div className="custom-filter-item">
            <div className={`filter-text-box ${activePopup === 'type' ? 'active' : ''}`} onClick={() => togglePopup('type')}>
              <span>
                {selectedType ? (isRTL ? selectedType.ar : selectedType.en) : (isRTL ? 'نوع العقار' : 'Property Type')}
              </span>
              <span className={`arrow-icon ${activePopup === 'type' ? 'up' : 'down'}`}></span>
            </div>
            {activePopup === 'type' && (
              <div className="modern-dropdown-list">
                {propertyTypes.map((type) => (
                  <div 
                    key={type.id} 
                    className={`dropdown-option ${selectedType?.id === type.id ? 'selected' : ''}`}
                    onClick={() => { setSelectedType(type); setActivePopup(null); }}
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