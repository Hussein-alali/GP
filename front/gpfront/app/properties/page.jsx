"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/PropertyCard';
import { useLanguage } from '@/context/LanguageContext';

const PropertiesContent = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const searchParams = useSearchParams();

  const [allHouses, setAllHouses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  useEffect(() => {
    const savedProps = JSON.parse(localStorage.getItem('myProperties') || '[]');
    setAllHouses(savedProps);
  }, []);

  const triggerDeleteConfirm = (id) => {
    setPropertyToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDeletion = () => {
    const updatedHouses = allHouses.filter(house => house.id !== propertyToDelete);
    setAllHouses(updatedHouses);
    localStorage.setItem('myProperties', JSON.stringify(updatedHouses));
    setIsModalOpen(false);
    setPropertyToDelete(null);
  };

  const query = {
    location: (searchParams.get('location') || "").toLowerCase().trim(),
    type: searchParams.get('type') || null,
    maxPrice: parseFloat(searchParams.get('maxPrice')) || Infinity,
    minArea: parseFloat(searchParams.get('minArea')) || 0, // تحديث للمساحة "أكبر من"
    searchType: searchParams.get('searchType')?.toLowerCase() || 'all'
  };

  const filteredHouses = allHouses.filter(house => {
    const houseTitleAr = (house.title_ar || "").toLowerCase();
    const houseTitleEn = (house.title_en || "").toLowerCase();
    const houseLocAr = (house.location_ar || "").toLowerCase();
    const houseLocEn = (house.location_en || "").toLowerCase();
    const houseSearchType = (house.searchType || "buy").toLowerCase();

    const matchLocation = !query.location || 
                          houseTitleAr.includes(query.location) || 
                          houseTitleEn.includes(query.location) || 
                          houseLocAr.includes(query.location) || 
                          houseLocEn.includes(query.location);

    const matchType = !query.type || house.type === query.type;
    const matchPrice = !house.price || parseFloat(house.price) <= query.maxPrice;
    const matchArea = !house.area || parseFloat(house.area) >= query.minArea;
    const matchSearchType = query.searchType === 'all' || houseSearchType === query.searchType;

    return matchLocation && matchType && matchPrice && matchArea && matchSearchType;
  });

  return (
    <div style={pageWrapper}>
      <div style={containerStyle}>
        
        {/* نافذة التأكيد (Modal) */}
        {isModalOpen && (
          <div style={modalOverlay}>
            <div style={modalBox}>
              <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>⚠️</div>
              <h2 style={{ color: '#004d7a', marginBottom: '12px', fontWeight: '800' }}>
                {isRTL ? 'تأكيد الحذف' : 'Confirm Deletion'}
              </h2>
              <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '30px', lineHeight: '1.6' }}>
                {isRTL ? 'هل أنت متأكد من حذف هذا الإعلان نهائياً؟' : 'Are you sure you want to delete this listing permanently?'}
              </p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button onClick={confirmDeletion} style={deleteConfirmBtn}>
                  {isRTL ? 'نعم، احذف' : 'Yes, Delete'}
                </button>
                <button onClick={() => setIsModalOpen(false)} style={cancelBtn}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* رأس الصفحة والعناوين */}
        <div style={headerSection}>
          <h1 style={mainTitle}>
            {query.searchType === 'buy' 
              ? (isRTL ? `عقارات للبيع` : `Properties for Sale`)
              : query.searchType === 'rent'
              ? (isRTL ? `عقارات للإيجار` : `Properties for Rent`)
              : (isRTL ? `جميع العقارات المتاحة` : `All Available Properties`)
            }
            <span style={countBadge}>{filteredHouses.length}</span>
          </h1>
          <p style={subTitle}>
            {isRTL ? 'استكشف أفضل العروض العقارية المختارة لك بعناية' : 'Explore the best real estate deals curated just for you'}
          </p>
        </div>
        
        {/* شبكة عرض العقارات */}
        <div style={gridStyle}>
          {filteredHouses.length > 0 ? (
            filteredHouses.map(house => (
              <PropertyCard 
                key={house.id} 
                property={house} 
                onDelete={triggerDeleteConfirm} 
              />
            ))
          ) : (
            <div style={noResultsBox}>
              <div style={{ fontSize: '5rem', marginBottom: '20px', opacity: '0.6' }}>🔎</div>
              <h2 style={{ color: '#004d7a', fontWeight: '700' }}>
                {isRTL ? 'لم نجد أي نتائج' : 'No results found'}
              </h2>
              <p style={{ color: '#718096', maxWidth: '400px', margin: '10px auto' }}>
                {isRTL ? 'جرب البحث بكلمات أخرى أو تغيير إعدادات الفلترة' : 'Try searching with different keywords or adjusting the filters'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- التنسيقات العصرية ---

const pageWrapper = {
  backgroundColor: '#f4f7f9', // الخلفية الرمادية الفاتحة
  minHeight: '100vh',
  paddingTop: '130px',
  paddingBottom: '80px',
};

const containerStyle = {
  maxWidth: '1250px',
  margin: '0 auto',
  padding: '0 25px',
};

const headerSection = {
  marginBottom: '45px',
  textAlign: 'center',
};

const mainTitle = {
  color: '#004d7a',
  fontSize: '2.5rem',
  fontWeight: '900',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '15px',
  marginBottom: '10px'
};

const countBadge = {
  backgroundColor: '#008ccf',
  color: '#fff',
  fontSize: '1rem',
  padding: '5px 15px',
  borderRadius: '50px',
  fontWeight: 'bold'
};

const subTitle = {
  color: '#718096',
  fontSize: '1.1rem',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
  gap: '30px',
};

const noResultsBox = {
  gridColumn: '1 / -1',
  textAlign: 'center',
  padding: '120px 20px',
  backgroundColor: '#fff',
  borderRadius: '24px',
  border: '1px solid #edf2f7',
  boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
};

const modalOverlay = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
  alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(8px)'
};

const modalBox = {
  background: '#fff', padding: '50px', borderRadius: '30px', textAlign: 'center',
  maxWidth: '500px', width: '90%', boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
};

const deleteConfirmBtn = {
  padding: '14px 30px', background: 'linear-gradient(135deg, #dc3545 0%, #a71d2a 100%)',
  color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer',
  fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 8px 15px rgba(220,53,69,0.2)'
};

const cancelBtn = {
  padding: '14px 30px', background: '#f1f5f9', color: '#4a5568',
  border: 'none', borderRadius: '12px', cursor: 'pointer',
  fontWeight: 'bold', fontSize: '1rem'
};

export default function PropertiesPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ paddingTop: '150px', textAlign: 'center', color: '#008ccf', fontWeight: 'bold' }}>Loading...</div>}>
        <PropertiesContent />
      </Suspense>
    </>
  );
}