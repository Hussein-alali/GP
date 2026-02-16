"use client";
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/PropertyCard';
import { useLanguage } from '@/context/LanguageContext';

const PropertiesContent = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const searchParams = useSearchParams();

  // Get values from URL or set to null if empty
  const query = {
    location: searchParams.get('location') || "",
    type: searchParams.get('type') || null,
    maxPrice: searchParams.get('maxPrice') || Infinity,
    maxArea: searchParams.get('maxArea') || Infinity,
    searchType: searchParams.get('searchType') || 'buy'
  };

  // Mock Database - In a real app, you would fetch this from your backend
const allHouses = [
  { 
    id: 1, 
    title_ar: "شقة للبيع في التجمع", 
    title_en: "Apartment in Tagamoa", 
    price: 2100000, 
    area: 150, 
    rooms: 3, 
    baths: 2, 
    location_ar: "القاهرة الجديدة", 
    location_en: "New Cairo", 
    type: "apartments", 
    searchType: "buy", 
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750" 
  },
  { 
    id: 2, 
    title_ar: "فيلا مودرن بحديقة", 
    title_en: "Modern Villa with Garden", 
    price: 7000000, 
    area: 400, 
    rooms: 5, 
    baths: 4, 
    location_ar: "6 أكتوبر", 
    location_en: "6th of October", 
    type: "villas", 
    searchType: "buy", 
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6" 
  },
  { 
    id: 3, 
    title_ar: "شقة فاخرة للإيجار", 
    title_en: "Luxury Apartment for Rent", 
    price: 15000, 
    area: 120, 
    rooms: 2, 
    baths: 2, 
    location_ar: "الشيخ زايد", 
    location_en: "Sheikh Zayed", 
    type: "apartments", 
    searchType: "rent", 
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb" 
  },
  { 
    id: 4, 
    title_ar: "شاليه على البحر مباشرة", 
    title_en: "Front-line Beach Chalet", 
    price: 3500000, 
    area: 90, 
    rooms: 2, 
    baths: 1, 
    location_ar: "الساحل الشمالي", 
    location_en: "North Coast", 
    type: "chalets", 
    searchType: "buy", 
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2" 
  },
  { 
    id: 5, 
    title_ar: "شقة مفروشة للإيجار", 
    title_en: "Furnished Apartment for Rent", 
    price: 25000, 
    area: 180, 
    rooms: 3, 
    baths: 3, 
    location_ar: "المعادي", 
    location_en: "Maadi", 
    type: "furnished-apartments", 
    searchType: "rent", 
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688" 
  },
  { 
    id: 6, 
    title_ar: "بنتهاوس مع روف خاص", 
    title_en: "Penthouse with Private Roof", 
    price: 4800000, 
    area: 220, 
    rooms: 4, 
    baths: 3, 
    location_ar: "القاهرة الجديدة", 
    location_en: "New Cairo", 
    type: "apartments", 
    searchType: "buy", 
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267" 
  },
  { 
    id: 7, 
    title_ar: "فيلا مستقلة للإيجار", 
    title_en: "Standalone Villa for Rent", 
    price: 80000, 
    area: 500, 
    rooms: 6, 
    baths: 5, 
    location_ar: "الرحاب", 
    location_en: "Al Rehab", 
    type: "villas", 
    searchType: "rent", 
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811" 
  },
  { 
    id: 8, 
    title_ar: "استوديو مريح وصغير", 
    title_en: "Cozy Small Studio", 
    price: 1200000, 
    area: 60, 
    rooms: 1, 
    baths: 1, 
    location_ar: "مدينتي", 
    location_en: "Madinaty", 
    type: "apartments", 
    searchType: "buy", 
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858" 
  }
];

  // Filtering Logic: If field is empty, it returns true (no filter applied)
  const filteredHouses = allHouses.filter(house => {
    const matchLocation = house.location_ar.includes(query.location) || house.location_en.toLowerCase().includes(query.location.toLowerCase());
    const matchType = !query.type || house.type === query.type;
    const matchPrice = house.price <= query.maxPrice;
    const matchArea = house.area <= query.maxArea;
    const matchSearchType = house.searchType === query.searchType;

    return matchLocation && matchType && matchPrice && matchArea && matchSearchType;
  });

  return (
    <div className="properties-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container" style={{ paddingTop: '120px', paddingBottom: '50px', maxWidth: '1200px', margin: '0 auto', padding: '120px 20px 50px' }}>
        <h1 style={{ marginBottom: '30px', color: '#004d7a' }}>
          {isRTL ? `نتائج البحث (${filteredHouses.length})` : `Search Results (${filteredHouses.length})`}
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
          {filteredHouses.length > 0 ? (
            filteredHouses.map(house => <PropertyCard key={house.id} property={house} />)
          ) : (
            <p>{isRTL ? "لا توجد نتائج تطابق بحثك." : "No results match your search."}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Page Component wrapped in Suspense for Next.js searchParams
const PropertiesPage = () => (
  <>
    <Navbar />
    <Suspense fallback={<div>Loading...</div>}>
      <PropertiesContent />
    </Suspense>
  </>
);

export default PropertiesPage;