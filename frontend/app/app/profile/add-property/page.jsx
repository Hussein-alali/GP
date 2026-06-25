"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { authAPI, brandAPI, realEstateAPI, valuationAPI } from '@/services/api';
import { useLanguage } from '@/context/LanguageContext';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

// ─── Brand Protection Result Card ────────────────────────────────────────────
function BrandResult({ result, isRTL }) {
  if (!result) return null;

  const blocked = result.blocked;
  const noLogo  = !result.company_detected;

  if (noLogo) return null; // no logo found — no UI needed

  const bg     = blocked ? '#fff5f5' : '#f0fdf4';
  const border = blocked ? '#fecaca' : '#bbf7d0';
  const dot    = blocked ? '#ef4444' : '#22c55e';
  const label  = blocked
    ? (isRTL ? 'محظور' : 'Blocked')
    : (isRTL ? 'مصرح' : 'Authorised');

  return (
    <div style={{ marginTop: 20, padding: '16px 20px', background: bg, border: `1.5px solid ${border}`, borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: dot, display: 'inline-block' }} />
        <strong style={{ color: blocked ? '#b91c1c' : '#15803d', fontSize: '1rem' }}>
          {isRTL ? 'حماية العلامة التجارية' : 'Brand Protection'} — {label}
        </strong>
      </div>
      <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#374151' }}>
        <strong>{isRTL ? 'الشركة المكتشفة:' : 'Detected Company:'}</strong>{' '}
        {result.company_detected}
        {' '}({(result.confidence * 100).toFixed(0)}% {isRTL ? 'ثقة' : 'confidence'})
      </p>
      {result.user_domain && (
        <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#374151' }}>
          <strong>{isRTL ? 'نطاق بريدك:' : 'Your domain:'}</strong>{' '}
          {result.user_domain}
        </p>
      )}
      <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: blocked ? '#b91c1c' : '#15803d' }}>
        {result.reason}
      </p>
    </div>
  );
}

// ─── Valuation Widget ─────────────────────────────────────────────────────────
function ValuationWidget({ data, loading, isRTL }) {
  if (loading) {
    return (
      <div style={{ marginTop: 16, padding: '14px 18px', background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, color: '#0369a1', fontSize: '0.9rem' }}>
        <span style={spinnerStyle} />
        {isRTL ? 'جارٍ تقدير السعر...' : 'Estimating market value...'}
      </div>
    );
  }
  if (!data) return null;

  const fmt = (n) => n?.toLocaleString('en-EG') ?? '—';
  const confColor = data.confidence_score >= 70 ? '#15803d' : data.confidence_score >= 40 ? '#b45309' : '#6b7280';

  return (
    <div style={{ marginTop: 16, padding: '20px', background: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)', border: '1.5px solid #7dd3fc', borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <strong style={{ color: '#0369a1', fontSize: '1rem' }}>
          {isRTL ? 'تقدير السعر السوقي' : 'Market Valuation Estimate'}
        </strong>
        <span style={{ background: confColor, color: '#fff', borderRadius: 99, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
          {isRTL ? 'ثقة' : 'Conf'} {data.confidence_score}%
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        {[
          { label: isRTL ? 'الأدنى' : 'Min',      val: data.min_price,      color: '#0369a1' },
          { label: isRTL ? 'المتوقع' : 'Expected',  val: data.expected_price, color: '#0c4a6e' },
          { label: isRTL ? 'الأعلى' : 'Max',       val: data.max_price,      color: '#0369a1' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 10, padding: '12px 10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color }}>{fmt(val)} EGP</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
        {isRTL
          ? `استناداً إلى ${data.comparables_used} عقار مشابه` + (data.outliers_removed ? ` (تم إزالة ${data.outliers_removed} قيمة شاذة)` : '')
          : `Based on ${data.comparables_used} comparable properties` + (data.outliers_removed ? ` (${data.outliers_removed} outlier${data.outliers_removed > 1 ? 's' : ''} removed)` : '')}
      </div>

      {data.popular_in_area?.length > 0 && (
        <div style={{ marginTop: 14, borderTop: '1px solid #bae6fd', paddingTop: 12 }}>
          <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🔍 {isRTL ? 'عقارات مدرجة في نفس المنطقة' : 'Listed in Same Area'}
          </div>
          {data.popular_in_area.map((listing, i) => (
            <a
              key={i}
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < data.popular_in_area.length - 1 ? '1px solid #e0f2fe' : 'none', textDecoration: 'none' }}
            >
              <div style={{ fontSize: '0.8rem', color: '#0c4a6e' }}>
                {listing.area} m² · {listing.bedrooms} {isRTL ? 'غرف' : 'BR'}
              </div>
              <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.85rem' }}>
                {Number(listing.price).toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const AddPropertyPage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const router = useRouter();

  useEffect(() => {
    if (!authAPI.isAuthenticated()) router.replace('/login');
  }, [router]);

  const [apartment, setApartment] = useState({
    title_ar: '', title_en: '', price: '', area: '',
    location_ar: '', location_en: '', type: 'apartments',
    rooms: '', baths: '', images: [], description: '',
    features: [], searchType: 'rent',
    latitude: null, longitude: null,
  });

  const [imageFiles, setImageFiles]     = useState([]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal]      = useState(false);
  const [imageError, setImageError]     = useState('');

  // Brand protection
  const [brandResult, setBrandResult]   = useState(null);
  const [brandLoading, setBrandLoading] = useState(false);

  // Valuation
  const [valuation, setValuation]       = useState(null);
  const [valLoading, setValLoading]     = useState(false);
  const valTimerRef = useRef(null);

  const propertyTypes = [
    { id: 'apartments',          ar: 'شقة',            en: 'Apartment' },
    { id: 'furnished-apartments',ar: 'شقة مفروشة',     en: 'Furnished Apartment' },
    { id: 'studios',             ar: 'استوديو',         en: 'Studio' },
    { id: 'offices',             ar: 'مكتب',            en: 'Office' },
    { id: 'rooms',               ar: 'غرفة',            en: 'Room' },
    { id: 'villas',              ar: 'فيلا',            en: 'Villa' },
    { id: 'chalets',             ar: 'شاليه',           en: 'Chalet' },
  ];

  const availableFeatures = [
    { key: 'security',          en: 'Security',           ar: 'أمن' },
    { key: 'balcony',           en: 'Balcony',            ar: 'شرفة' },
    { key: 'elevator',          en: 'Elevator',           ar: 'مصعد' },
    { key: 'ac',                en: 'AC',                 ar: 'تكييف' },
    { key: 'maid-room',         en: 'Maid Room',          ar: 'غرفة خدم' },
    { key: 'water-meter',       en: 'Water Meter',        ar: 'عداد مياه' },
    { key: 'landline',          en: 'Landline',           ar: 'هاتف أرضي' },
    { key: 'covered-garage',    en: 'Covered Garage',     ar: 'جراج مغطى' },
    { key: 'pool',              en: 'Pool',               ar: 'حمام سباحة' },
    { key: 'private-garden',    en: 'Private Garden',     ar: 'حديقة خاصة' },
    { key: 'electric-meter',    en: 'Electric Meter',     ar: 'عداد كهرباء' },
    { key: 'kitchen-appliances',en: 'Kitchen Appliances', ar: 'أجهزة المطبخ' },
    { key: 'kids-area',         en: 'Kids Area',          ar: 'منطقة ألعاب للأطفال' },
    { key: 'pets-allowed',      en: 'Pets Allowed',       ar: 'مسموح بالحيوانات الأليفة' },
  ];

  const currentType = propertyTypes.find((t) => t.id === apartment.type) || propertyTypes[0];

  // ── Valuation: re-evaluate whenever any key field changes ────────────────
  useEffect(() => {
    const { type, area, rooms, baths, location_en } = apartment;

    // Not enough info yet — clear any previous result immediately
    if (!area || !rooms || !baths || !location_en) {
      clearTimeout(valTimerRef.current);
      setValuation(null);
      setValLoading(false);
      return;
    }

    // Fields changed — immediately show "re-evaluating" by clearing old result
    setValuation(null);
    setValLoading(true);

    clearTimeout(valTimerRef.current);
    valTimerRef.current = setTimeout(async () => {
      try {
        const result = await valuationAPI.estimate({
          property_type: type,
          city: location_en,
          region: '',
          area: parseFloat(area),
          bedrooms: parseInt(rooms, 10),
          bathrooms: parseInt(baths, 10),
        });
        setValuation(result);
      } catch {
        setValuation(null);
      } finally {
        setValLoading(false);
      }
    }, 800);

    return () => clearTimeout(valTimerRef.current);
  }, [apartment.type, apartment.area, apartment.rooms, apartment.baths, apartment.location_en]);

  // ── Image handling ────────────────────────────────────────────────────────
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageError('');
    setBrandResult(null);

    const newFiles = [...imageFiles, ...files].slice(0, 10);
    setImageFiles(newFiles);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          setApartment((prev) => ({
            ...prev,
            images: [...prev.images, canvas.toDataURL('image/jpeg', 0.6)].slice(0, 10),
          }));
        };
      };
      reader.readAsDataURL(file);
    });

    // Brand domain check on first uploaded image
    setBrandLoading(true);
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const userEmail  = storedUser ? JSON.parse(storedUser)?.email ?? '' : '';

    brandAPI.checkOwner(files[0], userEmail)
      .then((result) => setBrandResult(result))
      .catch(() => setBrandResult(null))
      .finally(() => setBrandLoading(false));
  };

  const removeImage = (index) => {
    setApartment((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setImageFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setImageError(isRTL ? 'يجب إضافة صورة واحدة على الأقل.' : 'At least one image is required.');
        setBrandResult(null);
      }
      return next;
    });
  };

  // ── Map ───────────────────────────────────────────────────────────────────
  const handleMapSelect = useCallback(({ lat, lng, address, city }) => {
    setApartment((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location_ar: address,
      location_en: city || address,  // short city name for valuation matching
    }));
  }, []);

  // ── Features ──────────────────────────────────────────────────────────────
  const toggleFeature = (key) => {
    setApartment((prev) => ({
      ...prev,
      features: prev.features.includes(key)
        ? prev.features.filter((f) => f !== key)
        : [...prev.features, key],
    }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imageFiles.length === 0) {
      setImageError(isRTL ? 'يجب إضافة صورة واحدة على الأقل.' : 'At least one image is required.');
      return;
    }
    if (brandResult?.blocked) {
      alert(isRTL
        ? 'تم حظر النشر: شعار الشركة في الصورة لا يتطابق مع نطاق بريدك الإلكتروني.'
        : 'Posting blocked: the company logo in the image does not match your email domain.');
      return;
    }
    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const ownerId    = storedUser ? JSON.parse(storedUser)?.id ?? 1 : 1;

      const formData = new FormData();
      formData.append('area',        String(apartment.area));
      formData.append('bedrooms',    String(apartment.rooms));
      formData.append('bathrooms',   String(apartment.baths));
      formData.append('location',    apartment.location_en || apartment.location_ar || '');
      formData.append('type',        apartment.type);
      formData.append('price',       String(apartment.price));
      formData.append('owner_id',    String(ownerId));
      formData.append('description', apartment.description || '');
      formData.append('features',    JSON.stringify(apartment.features));
      if (apartment.latitude)  formData.append('latitude',  String(apartment.latitude));
      if (apartment.longitude) formData.append('longitude', String(apartment.longitude));
      imageFiles.forEach((file) => formData.append('files', file));

      await realEstateAPI.addProperty(formData);
      setShowSuccessModal(true);
    } catch (err) {
      alert(err?.message || (isRTL ? 'فشل في إضافة العقار.' : 'Failed to add property.'));
    }
  };

  const canSubmit = !brandResult?.blocked;

  // ─── Render ───────────────────────────────────────────────────────────────
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

          {/* Transaction & Type */}
          <div style={formSection}>
            <div style={gridRow}>
              <div style={{ flex: 1 }}>
                <h3 style={sectionTitleSmall}>{isRTL ? 'نوع العملية' : 'Transaction'}</h3>
                <div style={toggleWrapper}>
                  {['buy', 'rent'].map((v) => (
                    <button key={v} type="button"
                      onClick={() => setApartment({ ...apartment, searchType: v })}
                      style={{ ...toggleBtn, backgroundColor: apartment.searchType === v ? '#008ccf' : '#fff', color: apartment.searchType === v ? '#fff' : '#4a5568' }}>
                      {v === 'buy' ? (isRTL ? 'للبيع' : 'For Buy') : (isRTL ? 'للإيجار' : 'For Rent')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                <h3 style={sectionTitleSmall}>{isRTL ? 'نوع العقار' : 'Property Type'}</h3>
                <div style={modernDropdownTrigger} onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}>
                  <span>{isRTL ? currentType.ar : currentType.en}</span>
                  <span>▾</span>
                </div>
                {isTypeDropdownOpen && (
                  <div style={modernDropdownMenu}>
                    {propertyTypes.map((type) => (
                      <div key={type.id} style={modernDropdownOption}
                        onClick={() => { setApartment({ ...apartment, type: type.id }); setIsTypeDropdownOpen(false); }}>
                        {isRTL ? type.ar : type.en}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 1. Basic Info */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '1. المعلومات الأساسية' : '1. Basic Information'}</h3>
            <div style={inputGroup}>
              <label style={labelStyle}>{isRTL ? 'عنوان العقار' : 'Property Title'}</label>
              <input style={inputStyle}
                onChange={(e) => setApartment({ ...apartment, title_ar: e.target.value, title_en: e.target.value })}
                required />
            </div>
            <div style={inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={labelStyle}>{isRTL ? 'وصف العقار' : 'Property Description'}</label>
                <span style={{ fontSize: '0.8rem', color: apartment.description.length >= 500 ? 'red' : '#888' }}>
                  {apartment.description.length}/500
                </span>
              </div>
              <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                maxLength="500" value={apartment.description}
                onChange={(e) => setApartment({ ...apartment, description: e.target.value })} required />
            </div>
            <div style={gridRow}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>
                  {apartment.searchType === 'buy' ? (isRTL ? 'السعر (جنيه)' : 'Price (EGP)') : (isRTL ? 'الإيجار (جنيه/شهر)' : 'Rent (EGP/month)')}
                </label>
                <input type="number" min="1" style={inputStyle}
                  value={apartment.price}
                  onChange={(e) => setApartment({ ...apartment, price: e.target.value })} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? 'المساحة (م²)' : 'Area (m²)'}</label>
                <input type="number" min="1" style={inputStyle}
                  value={apartment.area}
                  onChange={(e) => setApartment({ ...apartment, area: e.target.value })} required />
              </div>
            </div>
          </div>

          {/* 2. Details & Location */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '2. التفاصيل والموقع' : '2. Details & Location'}</h3>
            <div style={gridRow}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? 'الغرف' : 'Rooms'}</label>
                <input type="number" min="0" style={inputStyle}
                  value={apartment.rooms}
                  onChange={(e) => setApartment({ ...apartment, rooms: e.target.value })} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{isRTL ? 'الحمامات' : 'Baths'}</label>
                <input type="number" min="1" style={inputStyle}
                  value={apartment.baths}
                  onChange={(e) => setApartment({ ...apartment, baths: e.target.value })} required />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>{isRTL ? 'الموقع / المدينة' : 'Location / City'}</label>
              <input style={inputStyle} value={apartment.location_en}
                onChange={(e) => setApartment({ ...apartment, location_ar: e.target.value, location_en: e.target.value })}
                placeholder={isRTL ? 'مثال: القاهرة الجديدة، مدينة نصر...' : 'e.g. New Cairo, Nasr City...'}
                required />
            </div>

            {/* Live valuation widget */}
            <ValuationWidget data={valuation} loading={valLoading} isRTL={isRTL} />

            <div style={{ marginTop: 20 }}>
              <label style={{ ...labelStyle, marginBottom: 12 }}>
                {isRTL ? 'تحديد الموقع على الخريطة' : 'Pin Location on Map'}
              </label>
              <MapPicker
                onSelect={handleMapSelect}
                initialLat={apartment.latitude}
                initialLng={apartment.longitude}
                isRTL={isRTL}
              />
              {apartment.latitude && (
                <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#6b7280' }}>
                  📍 {apartment.latitude.toFixed(5)}, {apartment.longitude.toFixed(5)}
                </p>
              )}
            </div>
          </div>

          {/* 3. Photos */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '3. الصور (حتى 10)' : '3. Photos (Up to 10)'}</h3>
            <label style={uploadBox}>
              <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={handleImagesChange} required={imageFiles.length === 0} />
              <div style={{ textAlign: 'center' }}>📷<br />{isRTL ? 'إضافة صور' : 'Add Photos'}</div>
            </label>
            {imageError && <p style={{ color: '#dc2626', marginTop: 10, fontWeight: 600 }}>{imageError}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 15, marginTop: 20 }}>
              {apartment.images.map((img, index) => (
                <div key={index} style={{ position: 'relative', height: 100, borderRadius: 10, overflow: 'hidden' }}>
                  <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeImage(index)} style={removeBadge}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Brand Protection */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '4. حماية العلامة التجارية' : '4. Brand Protection'}</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 12 }}>
              {isRTL
                ? 'يتم فحص صورك تلقائيًا للكشف عن شعارات الشركات. إذا تم اكتشاف شعار، يجب أن يكون نطاق بريدك الإلكتروني مرخصًا لتلك الشركة.'
                : 'Images are automatically scanned for company logos. If a logo is found, your email domain must be authorised for that company.'}
            </p>

            {brandLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6b7280' }}>
                <span style={spinnerStyle} />
                {isRTL ? 'جارٍ الفحص...' : 'Scanning image...'}
              </div>
            )}

            {!brandLoading && imageFiles.length === 0 && (
              <div style={{ padding: '14px 18px', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 10, color: '#94a3b8', fontSize: '0.9rem' }}>
                {isRTL ? 'أضف صورة أعلاه لبدء الفحص تلقائيًا.' : 'Upload an image above to trigger automatic scanning.'}
              </div>
            )}

            <BrandResult result={brandResult} isRTL={isRTL} />

            {brandResult?.blocked && (
              <div style={{ marginTop: 12, padding: '12px 16px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, color: '#be123c', fontWeight: 600, fontSize: '0.9rem' }}>
                ⚠️ {isRTL
                  ? 'لا يمكنك نشر هذا العقار لأن الصورة تحتوي على علامة تجارية لا تملك صلاحية استخدامها.'
                  : 'You cannot publish this listing because the image contains a brand logo you are not authorised to use.'}
              </div>
            )}

            {brandResult && !brandResult.blocked && brandResult.company_detected && (
              <div style={{ marginTop: 12, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, color: '#15803d', fontWeight: 600, fontSize: '0.9rem' }}>
                ✓ {isRTL ? 'تم التحقق — يمكنك نشر هذا العقار.' : 'Verified — you are authorised to publish this listing.'}
              </div>
            )}
          </div>

          {/* 5. Features */}
          <div style={formSection}>
            <h3 style={sectionTitle}>{isRTL ? '5. مميزات العقار' : '5. Property Features'}</h3>
            <div style={featureWrap}>
              {availableFeatures.map((f) => {
                const active = apartment.features.includes(f.key);
                return (
                  <button key={f.key} type="button" onClick={() => toggleFeature(f.key)}
                    style={{ ...featureChip, backgroundColor: active ? '#e7f0f8' : '#fff', borderColor: active ? '#bfdbfe' : '#d1d5db', color: active ? '#0b5fa8' : '#374151' }}>
                    {isRTL ? f.ar : f.en}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit"
            disabled={!canSubmit}
            style={{ ...submitBtnStyle, opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
            {isRTL ? 'نشر العقار الآن' : 'Publish Property Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const modernDropdownTrigger = { padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', backgroundColor: '#f9fbff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modernDropdownMenu    = { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, border: '1px solid #edf2f7' };
const modernDropdownOption  = { padding: '12px 16px', cursor: 'pointer', transition: '0.2s' };
const modalOverlay    = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' };
const modalBox        = { background: '#fff', padding: '34px 28px', borderRadius: 22, textAlign: 'center', maxWidth: 460, width: '92%', border: '1px solid #e2e8f0', boxShadow: '0 20px 45px rgba(0,0,0,0.18)' };
const successIconWrap = { width: 68, height: 68, borderRadius: '50%', margin: '0 auto 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#15803d', fontSize: '2rem', fontWeight: 800 };
const modalTitle      = { color: '#0f172a', margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: 800 };
const modalSubtitle   = { color: '#475569', margin: '0 0 22px 0', lineHeight: 1.6, fontSize: '0.98rem' };
const modalActions    = { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' };
const modalBtn        = { padding: '11px 22px', background: '#008ccf', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 };
const modalGhostBtn   = { padding: '11px 22px', background: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 10, cursor: 'pointer', fontWeight: 700 };
const formSection     = { background: '#ffffff', borderRadius: 16, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' };
const sectionTitle    = { fontSize: '1.2rem', color: '#004d7a', marginBottom: 25, borderBottom: '2px solid #f0f4f8', paddingBottom: 10, fontWeight: 700 };
const sectionTitleSmall = { fontSize: '1rem', color: '#004d7a', marginBottom: 10, fontWeight: 600 };
const gridRow         = { display: 'flex', gap: 20, flexWrap: 'wrap' };
const inputGroup      = { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 };
const labelStyle      = { fontSize: '0.95rem', fontWeight: 600, color: '#4a5568', marginBottom: 8, display: 'block' };
const inputStyle      = { padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '1rem', outline: 'none', backgroundColor: '#f9fbff', width: '100%', boxSizing: 'border-box' };
const uploadBox       = { width: '100%', padding: 20, border: '2px dashed #cbd5e0', borderRadius: 15, cursor: 'pointer', display: 'block', backgroundColor: '#fcfdff' };
const removeBadge     = { position: 'absolute', top: 5, right: 5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', width: 20, height: 20, fontWeight: 700, lineHeight: '20px', textAlign: 'center', padding: 0 };
const featureWrap     = { display: 'flex', flexWrap: 'wrap', gap: 10 };
const featureChip     = { border: '1px solid #d1d5db', borderRadius: 999, padding: '10px 14px', cursor: 'pointer', fontWeight: 600, background: '#fff' };
const submitBtnStyle  = { padding: 18, background: 'linear-gradient(135deg, #008ccf 0%, #005f8c 100%)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1.2rem', transition: 'opacity 0.2s' };
const toggleWrapper   = { display: 'flex', gap: 5, background: '#f0f4f8', padding: 5, borderRadius: 10 };
const toggleBtn       = { flex: 1, padding: 10, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 };
const spinnerStyle    = { display: 'inline-block', width: 16, height: 16, border: '2px solid #e2e8f0', borderTop: '2px solid #008ccf', borderRadius: '50%', animation: 'spin 0.8s linear infinite' };

export default AddPropertyPage;
