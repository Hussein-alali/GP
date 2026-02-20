"use client";
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

const AddPropertyPage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const router = useRouter();

  const [apartment, setApartment] = useState({
    title_ar: '', title_en: '', price: '', area: '', 
    location_ar: '', location_en: '', type: 'apartments',
    rooms: '', baths: '', image: '',
    searchType: 'rent' 
  });

  // معالج الصور مع ميزة الضغط التلقائي لتجنب خطأ المساحة
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // تصغير الأبعاد للحفاظ على المساحة
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // تحويل الصورة بجودة 0.7 لتوفير مساحة في الـ localStorage
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setApartment({ ...apartment, image: compressedBase64 });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const existingProperties = JSON.parse(localStorage.getItem('myProperties') || '[]');
      const newProperty = { 
        ...apartment, 
        id: Date.now(), 
        image: apartment.image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'
      };
      localStorage.setItem('myProperties', JSON.stringify([...existingProperties, newProperty]));
      alert(isRTL ? "✨ تم نشر عقارك بنجاح!" : "✨ Published Successfully!");
      router.push('/properties');
    } catch (error) {
      alert(isRTL ? "عذراً، مساحة التخزين ممتلئة. حاول استخدام صورة أصغر." : "Storage quota exceeded. Please use a smaller image.");
    }
  };

  return (
    <div style={{ backgroundColor: '#f4f7f9', minHeight: '100vh' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <div style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '850px', margin: '0 auto', padding: '120px 20px' }}>
        
        <div style={{ marginBottom: '40px', textAlign: isRTL ? 'right' : 'left' }}>
          <h1 style={{ color: '#004d7a', fontSize: '2.2rem', fontWeight: '800' }}>
            {isRTL ? 'إضافة عقار جديد' : 'List a New Property'}
          </h1>
          <p style={{ color: '#6c757d' }}>{isRTL ? 'املأ البيانات التالية لنشر إعلانك' : 'Fill in the details below to publish your listing'}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* قسم نوع الإعلان */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? 'نوع المعاملة' : 'Transaction Type'}</h3>
            <div style={toggleWrapper}>
              <button 
                type="button"
                onClick={() => setApartment({...apartment, searchType: 'buy'})}
                style={{
                  ...toggleBtn,
                  backgroundColor: apartment.searchType === 'buy' ? '#008ccf' : '#fff',
                  color: apartment.searchType === 'buy' ? '#fff' : '#4a5568',
                  boxShadow: apartment.searchType === 'buy' ? '0 4px 10px rgba(0,140,207,0.3)' : 'none'
                }}
              >
                {isRTL ? 'للبيع' : 'For Buy'}
              </button>
              <button 
                type="button"
                onClick={() => setApartment({...apartment, searchType: 'rent'})}
                style={{
                  ...toggleBtn,
                  backgroundColor: apartment.searchType === 'rent' ? '#008ccf' : '#fff',
                  color: apartment.searchType === 'rent' ? '#fff' : '#4a5568',
                  boxShadow: apartment.searchType === 'rent' ? '0 4px 10px rgba(0,140,207,0.3)' : 'none'
                }}
              >
                {isRTL ? 'للإيجار' : 'For Rent'}
              </button>
            </div>
          </div>

          {/* القسم 1: المعلومات الأساسية */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '1. المعلومات الأساسية' : '1. Basic Information'}</h3>
            <div style={inputGroup}>
              <label style={labelStyle}>{isRTL ? 'عنوان الإعلان' : 'Property Title'}</label>
              <input 
                style={inputStyle} 
                placeholder={isRTL ? "مثال: شقة مودرن بفيو رائع" : "e.g. Modern Apartment with great view"}
                onChange={(e) => setApartment({...apartment, title_ar: e.target.value, title_en: e.target.value})} 
                required 
              />
            </div>
            
            <div style={gridRow}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>
                  {apartment.searchType === 'buy' 
                    ? (isRTL ? 'السعر (ج.م)' : 'Price (EGP)') 
                    : (isRTL ? 'الإيجار الشهري' : 'Monthly Rent')}
                </label>
                <input type="number" style={inputStyle} placeholder="0" onChange={(e) => setApartment({...apartment, price: e.target.value})} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? 'المساحة (م²)' : 'Area (m²)'}</label>
                <input type="number" style={inputStyle} placeholder="0" onChange={(e) => setApartment({...apartment, area: e.target.value})} required />
              </div>
            </div>
          </div>

          {/* القسم 2: تفاصيل الغرف والموقع */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '2. التفاصيل والموقع' : '2. Details & Location'}</h3>
            <div style={gridRow}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? 'عدد الغرف' : 'Rooms'}</label>
                <input type="number" style={inputStyle} placeholder="3" onChange={(e) => setApartment({...apartment, rooms: e.target.value})} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? 'عدد الحمامات' : 'Bathrooms'}</label>
                <input type="number" style={inputStyle} placeholder="2" onChange={(e) => setApartment({...apartment, baths: e.target.value})} required />
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <label style={labelStyle}>{isRTL ? 'الموقع' : 'Location'}</label>
              <input 
                style={inputStyle} 
                placeholder={isRTL ? "المدينة، الحي، الشارع" : "City, District, Street"} 
                onChange={(e) => setApartment({...apartment, location_ar: e.target.value, location_en: e.target.value})} 
                required 
              />
            </div>
          </div>

          {/* القسم 3: الصور */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '3. الصور' : '3. Visuals'}</h3>
            <div style={uploadContainer}>
              <label style={uploadBox}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🖼️</div>
                   <div style={{ color: '#008ccf', fontWeight: 'bold' }}>{isRTL ? 'ارفع صورة العقار' : 'Upload Image'}</div>
                </div>
              </label>
              {apartment.image && (
                <div style={previewContainer}>
                  <img src={apartment.image} alt="Preview" style={previewImage} />
                </div>
              )}
            </div>
          </div>

          <button type="submit" style={submitBtnStyle}>
            {isRTL ? 'نشر العقار الآن' : 'Publish Property Now'}
          </button>

        </form>
      </div>
    </div>
  );
};

// --- التنسيقات (Styles) ---
const formSection = { background: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' };
const sectionTitle = { fontSize: '1.2rem', color: '#004d7a', marginBottom: '25px', borderBottom: '2px solid #f0f4f8', paddingBottom: '10px', fontWeight: '700' };
const gridRow = { display: 'flex', gap: '20px', flexWrap: 'wrap' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' };
const labelStyle = { fontSize: '0.95rem', fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '8px' };
const inputStyle = { padding: '14px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '1rem', outline: 'none', backgroundColor: '#f9fbff', width: '100%', boxSizing: 'border-box' };
const uploadContainer = { display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' };
const uploadBox = { width: '100%', padding: '40px', border: '2px dashed #cbd5e0', borderRadius: '15px', cursor: 'pointer', backgroundColor: '#fcfdff', display: 'block' };
const previewContainer = { width: '100%', height: '250px', borderRadius: '15px', overflow: 'hidden' };
const previewImage = { width: '100%', height: '100%', objectFit: 'cover' };
const submitBtnStyle = { padding: '18px', background: 'linear-gradient(135deg, #008ccf 0%, #005f8c 100%)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '1.2rem', boxShadow: '0 10px 15px rgba(0,140,207,0.3)' };
const toggleWrapper = { display: 'flex', gap: '10px', background: '#f0f4f8', padding: '6px', borderRadius: '14px', maxWidth: '320px' };
const toggleBtn = { flex: 1, padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.3s ease' };

export default AddPropertyPage;