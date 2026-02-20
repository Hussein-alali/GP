"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/PropertyCard';

const PropertiesContent = () => {
  const searchParams = useSearchParams();

  // 1. جعل المصفوفة فارغة تماماً لكي لا تظهر أي عقارات استاتيكية
  const [allHouses, setAllHouses] = useState([]);

  // 2. تحميل كافة العقارات من الـ LocalStorage فقط
  useEffect(() => {
    const savedProps = JSON.parse(localStorage.getItem('myProperties') || '[]');
    setAllHouses(savedProps);
  }, []);

  // 3. الحصول على قيم البحث من الرابط (URL)
 // 3. الحصول على قيم البحث من الرابط (URL)
  const query = {
    location: (searchParams.get('location') || "").toLowerCase(),
    type: searchParams.get('type') || null,
    maxPrice: parseFloat(searchParams.get('maxPrice')) || Infinity,
    maxArea: parseFloat(searchParams.get('maxArea')) || Infinity,
    // التأكد من تحويل قيمة البحث لنص صغير (toLowerCase)
    searchType: (searchParams.get('searchType') || 'buy').toLowerCase() 
  };

  // 4. منطق الفلترة
  const filteredHouses = allHouses.filter(house => {
    // التأكد من وجود القيم قبل المقارنة لتجنب الأخطاء
    const houseLocationAr = (house.location_ar || "").toLowerCase();
    const houseLocationEn = (house.location_en || "").toLowerCase();
    const houseSearchType = (house.searchType || "buy").toLowerCase();

    const matchLocation = houseLocationAr.includes(query.location) || 
                          houseLocationEn.includes(query.location);
    
    const matchType = !query.type || house.type === query.type;
    const matchPrice = parseFloat(house.price) <= query.maxPrice;
    const matchArea = parseFloat(house.area) <= query.maxArea;
    
    // ✅ التأكد من مطابقة نوع البحث (buy/rent) بدقة
    const matchSearchType = houseSearchType === query.searchType;

    return matchLocation && matchType && matchPrice && matchArea && matchSearchType;
  });
  return (
    <div style={{ paddingTop: '120px', paddingBottom: '50px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0 20px' }}>
        <h1 style={{ color: '#004d7a', margin: 0 }}>
          {query.searchType === 'buy' ? 'عقارات للبيع' : 'عقارات للإيجار'} ({filteredHouses.length})
        </h1>
      </div>
      
      {/* عرض النتائج أو رسالة تنبيه إذا كانت المصفوفة فارغة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px', padding: '0 20px' }}>
        {filteredHouses.length > 0 ? (
          filteredHouses.map(house => (
            <PropertyCard key={house.id} property={house} />
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#666' }}>
            <h2>{query.location ? 'لا توجد نتائج تطابق بحثك' : 'لا توجد عقارات مضافة حالياً'}</h2>
            <p>يمكنك إضافة عقارات جديدة من خلال صفحة الملف الشخصي.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PropertiesPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <PropertiesContent />
      </Suspense>
    </>
  );
}