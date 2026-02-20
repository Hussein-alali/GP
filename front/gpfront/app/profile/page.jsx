"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import { userAPI, authAPI } from '@/services/api';
import PropertyCard from '@/components/PropertyCard';

const ProfilePage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [user, setUser] = useState(null);
  const [userProperties, setUserProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError('');

      try {
        // Get user from localStorage (set during login)
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Fetch user's real estates if user ID is available
          if (parsedUser.id) {
            try {
              const properties = await userAPI.getUserRealEstates(parsedUser.id);
              setUserProperties(properties || []);
            } catch (err) {
              console.error('Error fetching user properties:', err);
            }
          }
        } else {
          setError(isRTL ? 'لم يتم العثور على بيانات المستخدم' : 'User data not found');
        }
      } catch (err) {
        setError(err.message || (isRTL ? 'فشل تحميل البيانات' : 'Failed to load data'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isRTL]);

  const transformProperty = (property) => {
    return {
      id: property.id,
      title_ar: property.type || 'عقار',
      title_en: property.type || 'Property',
      price: property.price,
      area: property.area,
      rooms: property.bedrooms,
      baths: property.bathrooms,
      location_ar: property.location,
      location_en: property.location,
      type: property.type,
      searchType: 'buy',
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750"
    };
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <div style={{ paddingTop: '150px', paddingBottom: '50px', maxWidth: '1200px', margin: '0 auto', padding: '150px 20px 50px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <h1 style={{ color: '#004d7a', marginBottom: '20px' }}>
            {isRTL ? 'مرحباً بك في ملفك الشخصي' : 'Welcome to your Profile'}
          </h1>
          
          {loading && (
            <p style={{ color: '#666', fontSize: '1.1rem' }}>
              {isRTL ? 'جاري التحميل...' : 'Loading...'}
            </p>
          )}

          {error && !loading && (
            <div style={{ 
              padding: '15px', 
              marginBottom: '20px', 
              backgroundColor: '#fee', 
              color: '#c33', 
              borderRadius: '8px'
            }}>
              {error}
            </div>
          )}

          {user && !loading && (
            <>
              <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '20px' }}>
                {isRTL ? 'هنا يمكنك رؤية بياناتك العقارية المحفوظة.' : 'Here you can see your saved real estate data.'}
              </p>
              
              <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '12px' }}>
                <p><strong>{isRTL ? 'اسم المستخدم:' : 'Username:'}</strong> {user.username || 'N/A'}</p>
                <p><strong>{isRTL ? 'البريد الإلكتروني:' : 'Email:'}</strong> {user.email || 'N/A'}</p>
                {user.id && <p><strong>{isRTL ? 'معرف المستخدم:' : 'User ID:'}</strong> {user.id}</p>}
              </div>
            </>
          )}
        </div>

        {/* User's Properties Section */}
        {user && !loading && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#004d7a', marginBottom: '30px' }}>
              {isRTL ? `عقاراتك (${userProperties.length})` : `Your Properties (${userProperties.length})`}
            </h2>
            
            {userProperties.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
                {userProperties.map(property => (
                  <PropertyCard key={property.id} property={transformProperty(property)} />
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                {isRTL ? 'لا توجد عقارات محفوظة.' : 'No properties saved yet.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;