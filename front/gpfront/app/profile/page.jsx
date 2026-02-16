"use client";
import React from 'react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';

const ProfilePage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <div style={{ paddingTop: '150px', paddingBottom: '50px', maxWidth: '800px', margin: '0 auto', padding: '150px 20px 50px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <h1 style={{ color: '#004d7a', marginBottom: '20px' }}>
            {isRTL ? 'مرحباً بك في ملفك الشخصي' : 'Welcome to your Profile'}
          </h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            {isRTL ? 'هنا يمكنك رؤية بياناتك العقارية المحفوظة.' : 'Here you can see your saved real estate data.'}
          </p>
          
          <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '12px' }}>
             <p><strong>{isRTL ? 'الاسم:' : 'Name:'}</strong> User Name</p>
             <p><strong>{isRTL ? 'البريد الإلكتروني:' : 'Email:'}</strong> user@smartestate.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;