"use client";
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

const AddPropertyPage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const router = useRouter();

  // الحالة العامة
  const [apartment, setApartment] = useState({
    title_ar: '', title_en: '', price: '', area: '', 
    location_ar: '', location_en: '', type: 'apartments',
    rooms: '', baths: '', images: [], 
    searchType: 'rent' 
  });

  // حالة التحكم في القائمة المنسدلة لنوع العقار
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const propertyTypes = [
    { id: 'apartments', ar: 'شقة', en: 'Apartment' },
    { id: 'furnished-apartments', ar: 'شقة مفروشة', en: 'furnished-apartments' },
    { id: 'villas', ar: 'فيلا', en: 'Villa' },
    { id: 'chalets', ar: 'شاليه', en: 'Chalet' },
  ];

  const currentType = propertyTypes.find(t => t.id === apartment.type);

  // معالج الصور المتعددة والضغط
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          
          setApartment(prev => ({
            ...prev,
            images: [...prev.images, compressedBase64].slice(0, 5)
          }));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setApartment(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const existingProperties = JSON.parse(localStorage.getItem('myProperties') || '[]');
      const newProperty = { 
        ...apartment, 
        id: Date.now(), 
        image: apartment.images[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'
      };
      localStorage.setItem('myProperties', JSON.stringify([...existingProperties, newProperty]));
      setShowSuccessModal(true);
    } catch (error) {
      alert(isRTL ? "مساحة التخزين ممتلئة!" : "Storage full!");
    }
  };

  return (
    <div style={{ backgroundColor: '#f4f7f9', minHeight: '100vh' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      {showSuccessModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>🎉</div>
            <h2 style={{ color: '#004d7a', marginBottom: '10px' }}>{isRTL ? 'تم النشر بنجاح!' : 'Published Successfully!'}</h2>
            <p style={{ color: '#666', marginBottom: '25px' }}>{isRTL ? 'عقارك متاح الآن للجميع في صفحة العقارات.' : 'Your property is now live.'}</p>
            <button onClick={() => router.push('/properties')} style={modalBtn}>{isRTL ? 'عرض العقارات' : 'View Properties'}</button>
          </div>
        </div>
      )}
      
      <div style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '850px', margin: '0 auto', padding: '120px 20px' }}>
        <h1 style={{ color: '#004d7a', fontSize: '2.2rem', fontWeight: '800', marginBottom: '40px' }}>
          {isRTL ? 'إضافة عقار جديد' : 'List a New Property'}
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={formSection}>
            <div style={gridRow}>
              {/* اختيار نوع المعاملة */}
              <div style={{ flex: 1 }}>
                <h3 style={sectionTitleSmall}>{isRTL ? 'نوع المعاملة' : 'Transaction'}</h3>
                <div style={toggleWrapper}>
                  <button type="button" onClick={() => setApartment({...apartment, searchType: 'buy'})} style={{...toggleBtn, backgroundColor: apartment.searchType === 'buy' ? '#008ccf' : '#fff', color: apartment.searchType === 'buy' ? '#fff' : '#4a5568'}}>
                    {isRTL ? 'للبيع' : 'For Buy'}
                  </button>
                  <button type="button" onClick={() => setApartment({...apartment, searchType: 'rent'})} style={{...toggleBtn, backgroundColor: apartment.searchType === 'rent' ? '#008ccf' : '#fff', color: apartment.searchType === 'rent' ? '#fff' : '#4a5568'}}>
                    {isRTL ? 'للإيجار' : 'For Rent'}
                  </button>
                </div>
              </div>

              {/* اختيار نوع العقار العصري (Modern Dropdown) */}
              <div style={{ flex: 1, position: 'relative' }}>
                <h3 style={sectionTitleSmall}>{isRTL ? 'نوع العقار' : 'Property Type'}</h3>
                <div 
                  style={modernDropdownTrigger} 
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                >
                  <span>{isRTL ? currentType.ar : currentType.en}</span>
                  <span style={{ transform: isTypeDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.3s' }}>▼</span>
                </div>

                {isTypeDropdownOpen && (
                  <div style={modernDropdownMenu}>
                    {propertyTypes.map((type) => (
                      <div 
                        key={type.id} 
                        style={{
                          ...modernDropdownOption,
                          backgroundColor: apartment.type === type.id ? '#f0f9ff' : 'transparent',
                          color: apartment.type === type.id ? '#008ccf' : '#4a5568',
                        }}
                        onClick={() => {
                          setApartment({...apartment, type: type.id});
                          setIsTypeDropdownOpen(false);
                        }}
                      >
                        {isRTL ? type.ar : type.en}
                        {apartment.type === type.id && <span style={{ float: isRTL ? 'left' : 'right' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ... الأقسام الأخرى (المعلومات، التفاصيل، الصور) تبقى كما هي ... */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '1. المعلومات الأساسية' : '1. Basic Information'}</h3>
            <div style={inputGroup}>
              <label style={labelStyle}>{isRTL ? 'عنوان الإعلان' : 'Property Title'}</label>
              <input style={inputStyle} placeholder={isRTL ? "شقة مودرن بفيو رائع" : "e.g. Modern Apartment"} onChange={(e) => setApartment({...apartment, title_ar: e.target.value, title_en: e.target.value})} required />
            </div>
            <div style={gridRow}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{apartment.searchType === 'buy' ? (isRTL ? 'السعر' : 'Price') : (isRTL ? 'الإيجار' : 'Rent')}</label>
                <input type="number" style={inputStyle} onChange={(e) => setApartment({...apartment, price: e.target.value})} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? 'المساحة (م²)' : 'Area (m²)'}</label>
                <input type="number" style={inputStyle} onChange={(e) => setApartment({...apartment, area: e.target.value})} required />
              </div>
            </div>
          </div>

          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '2. التفاصيل والموقع' : '2. Details & Location'}</h3>
        <div style={gridRow}>
  {/* حقل الغرف */}
  <div style={{ flex: 1 }}>
    <label style={labelStyle}>{isRTL ? 'الغرف' : 'Rooms'}</label>
    <input 
      type="number" 
      min="1" 
      style={inputStyle} 
      onKeyDown={(e) => ["e", "E", "-", "+"].includes(e.key) && e.preventDefault()} // منع إدخال الرموز غير الرقمية
      onChange={(e) => {
        const val = Math.max(1, parseInt(e.target.value) || 1); // التأكد من أن القيمة لا تقل عن 1
        setApartment({...apartment, rooms: val});
      }} 
      required 
    />
  </div>

  {/* حقل الحمامات */}
  <div style={{ flex: 1 }}>
    <label style={labelStyle}>{isRTL ? 'الحمامات' : 'Baths'}</label>
    <input 
      type="number" 
      min="1" 
      style={inputStyle} 
      onKeyDown={(e) => ["e", "E", "-", "+"].includes(e.key) && e.preventDefault()} // منع إدخال الرموز غير الرقمية
      onChange={(e) => {
        const val = Math.max(1, parseInt(e.target.value) || 1); // التأكد من أن القيمة لا تقل عن 1
        setApartment({...apartment, baths: val});
      }} 
      required 
    />
  </div>
</div>
            <div style={{ marginTop: '20px' }}>
              <label style={labelStyle}>{isRTL ? 'الموقع' : 'Location'}</label>
              <input style={inputStyle} onChange={(e) => setApartment({...apartment, location_ar: e.target.value, location_en: e.target.value})} required />
            </div>
          </div>

          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '3. الصور (حتى 5)' : '3. Photos (Up to 5)'}</h3>
            <label style={uploadBox}>
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImagesChange} />
              <div style={{ textAlign: 'center' }}>📸<br/>{isRTL ? 'أضف صور' : 'Add Photos'}</div>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px', marginTop: '20px' }}>
              {apartment.images.map((img, index) => (
                <div key={index} style={{ position: 'relative', height: '100px', borderRadius: '10px', overflow: 'hidden' }}>
                  <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeImage(index)} style={removeBadge}>×</button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" style={submitBtnStyle}>{isRTL ? 'نشر العقار الآن' : 'Publish Property Now'}</button>
        </form>
      </div>
    </div>
  );
};

// --- التنسيقات (Styles) المحدثة ---
const modernDropdownTrigger = {
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1.5px solid #e2e8f0',
  backgroundColor: '#f9fbff',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '1rem',
  color: '#4a5568'
};

const modernDropdownMenu = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  marginTop: '8px',
  zIndex: 100,
  overflow: 'hidden',
  border: '1px solid #edf2f7'
};

const modernDropdownOption = {
  padding: '12px 16px',
  cursor: 'pointer',
  transition: '0.2s',
  fontSize: '0.95rem',
  fontWeight: '500'
};

// ... التنسيقات السابقة كما هي ...
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' };
const modalBox = { background: '#fff', padding: '40px', borderRadius: '20px', textAlign: 'center', maxWidth: '400px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };
const modalBtn = { padding: '12px 30px', background: '#008ccf', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' };
const formSection = { background: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' };
const sectionTitle = { fontSize: '1.2rem', color: '#004d7a', marginBottom: '25px', borderBottom: '2px solid #f0f4f8', paddingBottom: '10px', fontWeight: '700' };
const sectionTitleSmall = { fontSize: '1rem', color: '#004d7a', marginBottom: '10px', fontWeight: '600' };
const gridRow = { display: 'flex', gap: '20px', flexWrap: 'wrap' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' };
const labelStyle = { fontSize: '0.95rem', fontWeight: '600', color: '#4a5568', marginBottom: '8px', display: 'block' };
const inputStyle = { padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '1rem', outline: 'none', backgroundColor: '#f9fbff', width: '100%', boxSizing: 'border-box' };
const uploadBox = { width: '100%', padding: '20px', border: '2px dashed #cbd5e0', borderRadius: '15px', cursor: 'pointer', display: 'block', backgroundColor: '#fcfdff' };
const removeBadge = { position: 'absolute', top: '5px', right: '5px', background: 'red', color: 'white', border: 'none', borderRadius: '20%',width: '15px', cursor: 'pointer' };
const submitBtnStyle = { padding: '18px', background: 'linear-gradient(135deg, #008ccf 0%, #005f8c 100%)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '1.2rem' };
const toggleWrapper = { display: 'flex', gap: '5px', background: '#f0f4f8', padding: '5px', borderRadius: '10px' };
const toggleBtn = { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' };

export default AddPropertyPage;