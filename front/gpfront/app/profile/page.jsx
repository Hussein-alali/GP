"use client";
import React from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const ProfilePage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <div style={{ paddingTop: '150px', maxWidth: '1000px', margin: '0 auto', padding: '150px 20px 50px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* بطاقة بيانات المستخدم */}
          <div style={{ background: '#fff', borderRadius: '15px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#004d7a', marginBottom: '20px' }}>{isRTL ? 'بياناتي' : 'My Info'}</h2>
            <p><strong>{isRTL ? 'الاسم:' : 'Name:'}</strong> User Name</p>
            <p><strong>{isRTL ? 'الإيميل:' : 'Email:'}</strong> user@smartestate.com</p>
          </div>

          {/* أيقونة إضافة عقار جديد - توجه لصفحة جديدة */}
          <Link href="/profile/add-property" style={{ textDecoration: 'none' }}>
            <div className="add-property-card" style={{ 
              background: '#fff', borderRadius: '15px', padding: '30px', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center',
              border: '2px dashed #008ccf', cursor: 'pointer', height: '100%',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
            }}>
              <div style={{ fontSize: '3rem', color: '#008ccf', marginBottom: '10px' }}>+</div>
              <h3 style={{ color: '#004d7a' }}>{isRTL ? 'أضف عقاراً جديداً' : 'Add New Property'}</h3>
              <p style={{ color: '#888' }}>{isRTL ? 'انقر هنا لإدراج شقتك في المنصة' : 'Click to list your apartment'}</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;