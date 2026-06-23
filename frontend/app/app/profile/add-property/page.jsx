"use client";
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/services/api';
import { useLanguage } from '@/context/LanguageContext';
import { realEstateAPI } from '@/services/api';

const AddPropertyPage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const router = useRouter();

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  const [apartment, setApartment] = useState({
    title_ar: '',
    title_en: '',
    price: '',
    area: '',
    location_ar: '',
    location_en: '',
    type: 'apartments',
    rooms: '',
    baths: '',
    images: [],
    description: '',
    features: [],
    searchType: 'rent',
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [imageError, setImageError] = useState("");

  const propertyTypes = [
    { id: 'apartments', ar: 'شقة', en: 'Apartment' },
    { id: 'furnished-apartments', ar: 'شقة مفروشة', en: 'Furnished Apartment' },
    { id: 'studios', ar: 'استوديو', en: 'Studio' },
    { id: 'offices', ar: 'مكتب', en: 'Office' },
    { id: 'rooms', ar: 'غرفة', en: 'Room' },
    { id: 'villas', ar: 'فيلا', en: 'Villa' },
    { id: 'chalets', ar: 'شاليه', en: 'Chalet' },
  ];

  const availableFeatures = [
    { key: 'security', en: 'Security', ar: 'أمن' },
    { key: 'balcony', en: 'Balcony', ar: 'شرفة' },
    { key: 'elevator', en: 'Elevator', ar: 'مصعد' },
    { key: 'ac', en: 'AC', ar: 'تكييف' },
    { key: 'maid-room', en: 'Maid Room', ar: 'غرفة خدم' },
    { key: 'water-meter', en: 'Water Meter', ar: 'عداد مياه' },
    { key: 'landline', en: 'Landline', ar: 'هاتف أرضي' },
    { key: 'covered-garage', en: 'Covered Garage', ar: 'جراج مغطى' },
    { key: 'pool', en: 'Pool', ar: 'حمام سباحة' },
    { key: 'private-garden', en: 'Private Garden', ar: 'حديقة خاصة' },
    { key: 'electric-meter', en: 'Electric Meter', ar: 'عداد كهرباء' },
    { key: 'kitchen-appliances', en: 'Kitchen Appliances', ar: 'أجهزة المطبخ' },
    { key: 'kids-area', en: 'Kids Area', ar: 'منطقة ألعاب للأطفال' },
    { key: 'pets-allowed', en: 'Pets Allowed', ar: 'مسموح بالحيوانات الأليفة' },
  ];

  const currentType = propertyTypes.find((t) => t.id === apartment.type) || propertyTypes[0];

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageError("");

    setImageFiles((prev) => [...prev, ...files].slice(0, 10));

    files.forEach((file) => {
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
          setApartment((prev) => ({
            ...prev,
            images: [...prev.images, compressedBase64].slice(0, 10),
          }));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setApartment((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setImageFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setImageError(isRTL ? "يجب إضافة صورة واحدة على الأقل." : "At least one image is required.");
      }
      return next;
    });
  };

  const toggleFeature = (featureKey) => {
    setApartment((prev) => ({
      ...prev,
      features: prev.features.includes(featureKey)
        ? prev.features.filter((f) => f !== featureKey)
        : [...prev.features, featureKey],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imageFiles.length === 0) {
      setImageError(isRTL ? "يجب إضافة صورة واحدة على الأقل." : "At least one image is required.");
      return;
    }
    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const ownerId = parsedUser?.id || 1;

      const formData = new FormData();
      formData.append('area', String(apartment.area));
      formData.append('bedrooms', String(apartment.rooms));
      formData.append('bathrooms', String(apartment.baths));
      formData.append('location', apartment.location_en || apartment.location_ar || '');
      formData.append('type', apartment.type);
      formData.append('price', String(apartment.price));
      formData.append('owner_id', String(ownerId));
      formData.append('description', apartment.description || '');
      formData.append('features', JSON.stringify(apartment.features));
      imageFiles.forEach((file) => formData.append('files', file));

      await realEstateAPI.addProperty(formData);
      setShowSuccessModal(true);
    } catch {
      alert(isRTL ? 'فشل في إضافة العقار.' : 'Failed to add property.');
    }
  };

  return (
    <div style={{ backgroundColor: '#f4f7f9', minHeight: '100vh' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      {showSuccessModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={successIconWrap}>✓</div>
            <h2 style={modalTitle}>{isRTL ? 'تم نشر العقار بنجاح' : 'Property Published Successfully'}</h2>
            <p style={modalSubtitle}>
              {isRTL
                ? 'إعلانك أصبح الآن متاحًا للمستخدمين ويمكنك متابعته من صفحة العقارات.'
                : 'Your listing is now live and visible to users. You can view it on the properties page.'}
            </p>
            <div style={modalActions}>
              <button onClick={() => setShowSuccessModal(false)} style={modalGhostBtn}>
                {isRTL ? 'متابعة التعديل' : 'Continue Editing'}
              </button>
              <button onClick={() => router.push('/properties')} style={modalBtn}>
                {isRTL ? 'عرض العقارات' : 'View Properties'}
              </button>
            </div>
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
              <div style={{ flex: 1 }}>
                <h3 style={sectionTitleSmall}>{isRTL ? 'نوع العملية' : 'Transaction'}</h3>
                <div style={toggleWrapper}>
                  <button type="button" onClick={() => setApartment({ ...apartment, searchType: 'buy' })} style={{ ...toggleBtn, backgroundColor: apartment.searchType === 'buy' ? '#008ccf' : '#fff', color: apartment.searchType === 'buy' ? '#fff' : '#4a5568' }}>
                    {isRTL ? 'للبيع' : 'For Buy'}
                  </button>
                  <button type="button" onClick={() => setApartment({ ...apartment, searchType: 'rent' })} style={{ ...toggleBtn, backgroundColor: apartment.searchType === 'rent' ? '#008ccf' : '#fff', color: apartment.searchType === 'rent' ? '#fff' : '#4a5568' }}>
                    {isRTL ? 'للإيجار' : 'For Rent'}
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                <h3 style={sectionTitleSmall}>{isRTL ? 'نوع العقار' : 'Property Type'}</h3>
                <div style={modernDropdownTrigger} onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}>
                  <span>{isRTL ? currentType.ar : currentType.en}</span>
                  <span>v</span>
                </div>
                {isTypeDropdownOpen && (
                  <div style={modernDropdownMenu}>
                    {propertyTypes.map((type) => (
                      <div key={type.id} style={modernDropdownOption} onClick={() => { setApartment({ ...apartment, type: type.id }); setIsTypeDropdownOpen(false); }}>
                        {isRTL ? type.ar : type.en}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '1. المعلومات الأساسية' : '1. Basic Information'}</h3>
            <div style={inputGroup}>
              <label style={labelStyle}>{isRTL ? 'عنوان العقار' : 'Property Title'}</label>
              <input style={inputStyle} onChange={(e) => setApartment({ ...apartment, title_ar: e.target.value, title_en: e.target.value })} required />
            </div>

            <div style={inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={labelStyle}>{isRTL ? 'وصف العقار' : 'Property Description'}</label>
                <span style={{ fontSize: '0.8rem', color: apartment.description.length >= 500 ? 'red' : '#888' }}>{apartment.description.length}/500</span>
              </div>
              <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} maxLength="500" value={apartment.description} onChange={(e) => setApartment({ ...apartment, description: e.target.value })} required />
            </div>

            <div style={gridRow}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{apartment.searchType === 'buy' ? (isRTL ? 'السعر' : 'Price') : (isRTL ? 'الإيجار' : 'Rent')}</label>
                <input type="number" min="1" style={inputStyle} onChange={(e) => setApartment({ ...apartment, price: e.target.value })} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? 'المساحة (م²)' : 'Area (m2)'}</label>
                <input type="number" min="1" style={inputStyle} onChange={(e) => setApartment({ ...apartment, area: e.target.value })} required />
              </div>
            </div>
          </div>

          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '2. التفاصيل والموقع' : '2. Details & Location'}</h3>
            <div style={gridRow}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? 'الغرف' : 'Rooms'}</label>
                <input type="number" min="1" style={inputStyle} onChange={(e) => setApartment({ ...apartment, rooms: e.target.value })} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? 'الحمامات' : 'Baths'}</label>
                <input type="number" min="1" style={inputStyle} onChange={(e) => setApartment({ ...apartment, baths: e.target.value })} required />
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <label style={labelStyle}>{isRTL ? 'الموقع' : 'Location'}</label>
              <input style={inputStyle} onChange={(e) => setApartment({ ...apartment, location_ar: e.target.value, location_en: e.target.value })} required />
            </div>
          </div>

          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '3. الصور (حتى 10)' : '3. Photos (Up to 10)'}</h3>
            <label style={uploadBox}>
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImagesChange} required={imageFiles.length === 0} />
              <div style={{ textAlign: 'center' }}>📷<br />{isRTL ? 'إضافة صور' : 'Add Photos'}</div>
            </label>
            {imageError && <p style={{ color: "#dc2626", marginTop: "10px", marginBottom: 0, fontWeight: 600 }}>{imageError}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px', marginTop: '20px' }}>
              {apartment.images.map((img, index) => (
                <div key={index} style={{ position: 'relative', height: '100px', borderRadius: '10px', overflow: 'hidden' }}>
                  <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeImage(index)} style={removeBadge}>x</button>
                </div>
              ))}
            </div>
          </div>

          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '4. مميزات العقار' : '4. Property Features'}</h3>
            <div style={featureWrap}>
              {availableFeatures.map((f) => {
                const active = apartment.features.includes(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleFeature(f.key)}
                    style={{ ...featureChip, backgroundColor: active ? '#e7f0f8' : '#fff', borderColor: active ? '#bfdbfe' : '#d1d5db', color: active ? '#0b5fa8' : '#374151' }}
                  >
                    {isRTL ? f.ar : f.en}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" style={submitBtnStyle}>{isRTL ? 'نشر العقار الآن' : 'Publish Property Now'}</button>
        </form>
      </div>
    </div>
  );
};

const modernDropdownTrigger = { padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', backgroundColor: '#f9fbff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modernDropdownMenu = { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, border: '1px solid #edf2f7' };
const modernDropdownOption = { padding: '12px 16px', cursor: 'pointer', transition: '0.2s' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' };
const modalBox = { background: '#fff', padding: '34px 28px', borderRadius: '22px', textAlign: 'center', maxWidth: '460px', width: '92%', border: '1px solid #e2e8f0', boxShadow: '0 20px 45px rgba(0,0,0,0.18)' };
const successIconWrap = { width: '68px', height: '68px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#15803d', fontSize: '2rem', fontWeight: 800 };
const modalTitle = { color: '#0f172a', margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: 800 };
const modalSubtitle = { color: '#475569', margin: '0 0 22px 0', lineHeight: 1.6, fontSize: '0.98rem' };
const modalActions = { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' };
const modalBtn = { padding: '11px 22px', background: '#008ccf', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 };
const modalGhostBtn = { padding: '11px 22px', background: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 };
const formSection = { background: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' };
const sectionTitle = { fontSize: '1.2rem', color: '#004d7a', marginBottom: '25px', borderBottom: '2px solid #f0f4f8', paddingBottom: '10px', fontWeight: '700' };
const sectionTitleSmall = { fontSize: '1rem', color: '#004d7a', marginBottom: '10px', fontWeight: '600' };
const gridRow = { display: 'flex', gap: '20px', flexWrap: 'wrap' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' };
const labelStyle = { fontSize: '0.95rem', fontWeight: '600', color: '#4a5568', marginBottom: '8px', display: 'block' };
const inputStyle = { padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '1rem', outline: 'none', backgroundColor: '#f9fbff', width: '100%', boxSizing: 'border-box' };
const uploadBox = { width: '100%', padding: '20px', border: '2px dashed #cbd5e0', borderRadius: '15px', cursor: 'pointer', display: 'block', backgroundColor: '#fcfdff' };
const removeBadge = { position: 'absolute', top: '5px', right: '5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '20px', height: '20px' };
const featureWrap = { display: 'flex', flexWrap: 'wrap', gap: '10px' };
const featureChip = { border: '1px solid #d1d5db', borderRadius: '999px', padding: '10px 14px', cursor: 'pointer', fontWeight: 600, background: '#fff' };
const submitBtnStyle = { padding: '18px', background: 'linear-gradient(135deg, #008ccf 0%, #005f8c 100%)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '1.2rem' };
const toggleWrapper = { display: 'flex', gap: '5px', background: '#f0f4f8', padding: '5px', borderRadius: '10px' };
const toggleBtn = { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' };

export default AddPropertyPage;

