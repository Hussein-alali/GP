"use client";
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/PropertyCard';
import { useLanguage } from '@/context/LanguageContext';

// مكون القائمة المنسدلة العصرية بدون أيقونات
const ModernSelect = ({ label, value, options, onChange, isRTL }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div style={filterItem} ref={dropdownRef}>
      <label style={filterLabel}>{label}</label>
      <div style={modernDropdownWrapper} onClick={() => setIsOpen(!isOpen)}>
        <span style={selectedValueText}>{selectedOption.label}</span>
        <span style={{ 
          ...arrowStyle, 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' 
        }}>▼</span>
      </div>

      {isOpen && (
        <div style={dropdownMenu}>
          {options.map((opt) => (
            <div 
              key={opt.value} 
              style={{
                ...dropdownOption,
                backgroundColor: value === opt.value ? '#f0f9ff' : 'transparent',
                color: value === opt.value ? '#008ccf' : '#4a5568',
                textAlign: isRTL ? 'right' : 'left'
              }}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
              {value === opt.value && <span style={checkIcon}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PropertiesContent = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allHouses, setAllHouses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || "",
    type: searchParams.get('type') || "all",
    maxPrice: searchParams.get('maxPrice') || "",
    minArea: searchParams.get('minArea') || "",
    searchType: searchParams.get('searchType') || "all"
  });

  useEffect(() => {
    const savedProps = JSON.parse(localStorage.getItem('myProperties') || '[]');
    setAllHouses(savedProps);
  }, []);

  const updateURL = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.type !== 'all') params.set('type', newFilters.type);
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
    if (newFilters.minArea) params.set('minArea', newFilters.minArea);
    params.set('searchType', newFilters.searchType);
    router.replace(`/properties?${params.toString()}`, { scroll: false });
  };

  const handleFilterChange = (name, value) => {
    let processedValue = value;
    
    // ✅ منع الأرقام السالبة للسعر والمساحة
    if (name === 'maxPrice' || name === 'minArea') {
      if (value !== "") {
        processedValue = Math.max(0, parseFloat(value) || 0).toString();
      }
    }

    const updated = { ...filters, [name]: processedValue };
    setFilters(updated);
    updateURL(updated);
  };

  const confirmDeletion = () => {
    const updatedHouses = allHouses.filter(house => house.id !== propertyToDelete);
    setAllHouses(updatedHouses);
    localStorage.setItem('myProperties', JSON.stringify(updatedHouses));
    setIsModalOpen(false);
  };

  const filteredHouses = allHouses.filter(house => {
    const matchLocation = !filters.location || 
      (house.location_ar || "").toLowerCase().includes(filters.location.toLowerCase()) ||
      (house.location_en || "").toLowerCase().includes(filters.location.toLowerCase());
    const matchType = filters.type === 'all' || house.type === filters.type;
    const matchPrice = !filters.maxPrice || parseFloat(house.price) <= parseFloat(filters.maxPrice);
    const matchArea = !filters.minArea || parseFloat(house.area) >= parseFloat(filters.minArea);
    const matchSearchType = filters.searchType === 'all' || (house.searchType || "buy").toLowerCase() === filters.searchType;
    return matchLocation && matchType && matchPrice && matchArea && matchSearchType;
  });

  const typeOptions = [
    { value: 'all', label: isRTL ? 'الكل' : 'All' },
    { value: 'apartments', label: isRTL ? 'شقة' : 'Apartment' },
    { value: 'villas', label: isRTL ? 'فيلا' : 'Villa' },
    { value: 'chalets', label: isRTL ? 'شاليه' : 'Chalet' }
  ];

  const statusOptions = [
    { value: 'all', label: isRTL ? 'الكل' : 'All' },
    { value: 'buy', label: isRTL ? 'للبيع' : 'For Sale' },
    { value: 'rent', label: isRTL ? 'للإيجار' : 'For Rent' }
  ];

  return (
    <div style={pageWrapper}>
      <div style={containerStyle}>
        
        {/* شريط الفلاتر المحدث بدون أيقونات */}
        <div style={filterBarCard}>
          <div style={filterGrid}>
            
            {/* الموقع */}
            <div style={filterItem}>
              <label style={filterLabel}>{isRTL ? 'الموقع' : 'Location'}</label>
              <div style={modernInputWrapper}>
                <input 
                  type="text" 
                  value={filters.location} 
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  style={plainInput}
                  placeholder={isRTL ? 'أين تبحث؟' : 'Where to?'}
                />
              </div>
            </div>

            {/* نوع العقار */}
            <ModernSelect 
              label={isRTL ? 'نوع العقار' : 'Type'}
              value={filters.type}
              options={typeOptions}
              onChange={(val) => handleFilterChange('type', val)}
              isRTL={isRTL}
            />

            {/* السعر الأقصى */}
            <div style={filterItem}>
              <label style={filterLabel}>{isRTL ? 'السعر الأقصى' : 'Max Price'}</label>
              <div style={modernInputWrapper}>
                <input 
                  type="number" 
                  min="0"
                  onKeyDown={(e) => ["e", "E", "-", "+"].includes(e.key) && e.preventDefault()}
                  value={filters.maxPrice} 
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  style={plainInput}
                  placeholder="0"
                />
              </div>
            </div>

            {/* المساحة */}
            <div style={filterItem}>
              <label style={filterLabel}>{isRTL ? 'المساحة (م²)' : 'Min Area'}</label>
              <div style={modernInputWrapper}>
                <input 
                  type="number" 
                  min="0"
                  onKeyDown={(e) => ["e", "E", "-", "+"].includes(e.key) && e.preventDefault()}
                  value={filters.minArea} 
                  onChange={(e) => handleFilterChange('minArea', e.target.value)}
                  style={plainInput}
                  placeholder="0"
                />
              </div>
            </div>

            {/* الحالة */}
            <ModernSelect 
              label={isRTL ? 'الحالة' : 'Status'}
              value={filters.searchType}
              options={statusOptions}
              onChange={(val) => handleFilterChange('searchType', val)}
              isRTL={isRTL}
            />

          </div>
        </div>

        <div style={{ marginBottom: '35px', textAlign: isRTL ? 'right' : 'left' }}>
          <h1 style={{ color: '#004d7a', fontSize: '1.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '15px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            {isRTL ? 'النتائج المتاحة' : 'Available Results'}
            <span style={countBadgeStyle}>{filteredHouses.length}</span>
          </h1>
        </div>
        
        <div style={gridStyle}>
          {filteredHouses.length > 0 ? (
            filteredHouses.map(house => (
              <PropertyCard key={house.id} property={house} onDelete={() => { setPropertyToDelete(house.id); setIsModalOpen(true); }} />
            ))
          ) : (
            <div style={noResultsBox}>
              <h2 style={{ color: '#004d7a' }}>{isRTL ? 'لا توجد نتائج مطابقة' : 'No matching results'}</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- التنسيقات المعدلة ---

const filterBarCard = { background: '#fff', padding: '20px 25px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: '50px', border: '1px solid #eef2f6' };
const filterGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px' };
const filterItem = { display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' };
const filterLabel = { fontSize: '0.75rem', fontWeight: '800', color: '#004d7a', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '5px' };
const modernDropdownWrapper = { display: 'flex', alignItems: 'center', padding: '12px 15px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1.5px solid #edf2f7', cursor: 'pointer', position: 'relative' };
const modernInputWrapper = { display: 'flex', alignItems: 'center', padding: '12px 15px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1.5px solid #edf2f7' };
const dropdownMenu = { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', marginTop: '10px', zIndex: 1000, overflow: 'hidden', border: '1px solid #eef2f6' };
const dropdownOption = { padding: '12px 20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const selectedValueText = { flex: 1, fontSize: '0.95rem', color: '#4a5568', fontWeight: '600' };
const arrowStyle = { fontSize: '0.7rem', color: '#94a3b8', transition: 'transform 0.3s' };
const checkIcon = { color: '#008ccf', fontWeight: 'bold' };
const plainInput = { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#4a5568', fontWeight: '600' };
const pageWrapper = { backgroundColor: '#d6d8d8', minHeight: '100vh', paddingTop: '130px', paddingBottom: '80px' };
const containerStyle = { maxWidth: '1250px', margin: '0 auto', padding: '0 25px' };
const countBadgeStyle = { backgroundColor: '#008ccf', color: '#fff', fontSize: '0.9rem', padding: '4px 12px', borderRadius: '50px' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '30px' };
const noResultsBox = { gridColumn: '1 / -1', textAlign: 'center', padding: '80px', background: '#fff', borderRadius: '20px' };

export default function PropertiesPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ paddingTop: '150px', textAlign: 'center' }}>Loading...</div>}>
        <PropertiesContent />
      </Suspense>
    </>
  );
}