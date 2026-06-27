// app/login/page.jsx
"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/services/api';

const LoginPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      const userInfo = {
        id: response.id,
        username: response.username,
        email: response.email || formData.email,
        phone: response.phone || "",
        bio: response.bio || "",
        favorites: Array.isArray(response.favorites) ? response.favorites : [],
      };
      localStorage.setItem('user', JSON.stringify(userInfo));

      // Redirect to home or profile page
      router.push('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        
        {/* Left Side: Image */}
        <div className="login-image-side">
          <img src="/imgg.jfif" alt="Modern House" className="login-bg-image" />
          <Link href="/" className="floating-badge" style={{ textDecoration: 'none', cursor: 'pointer' }}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
             Smart Estate
          </Link>
          <div className="image-overlay-text">
            <h3>Manage Properties Efficiently</h3>
            <p>Easily track rent payments, maintenance requests, and tenant communications in one place.</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="login-form-side">
          <div className="welcome-header">
            <h2>Welcome Back!</h2>
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: '12px',
                marginBottom: '20px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #fecaca',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="form-input-wrapper">
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com" 
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••" 
                  className="form-input"
                  required
                />
                
                <span 
                  className="password-eye-icon" 
                  onClick={togglePasswordVisibility}
                  style={{ cursor: 'pointer' }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </span>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me"><input type="checkbox" /> Remember Me</label>
              <Link href="/forgot-password" className="forgot-password">Forgot Password?</Link>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              )}
              {loading ? 'Logging in...' : 'Login'}
            </button>

            {/* Social Buttons Section */}
<div className="social-buttons">
  
{/* Google Button -> Redirects to Google */}
<a href="https://google.com" className="social-btn" style={{ textDecoration: 'none' }}>
    {/* Google "G" Icon */}
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
    Google
</a>

  {/* Apple Button -> Redirects to Facebook (as requested) */}
  <a href="https://facebook.com" className="social-btn" style={{ textDecoration: 'none' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"></path></svg>
      Facebook
  </a>

</div>
            <div className="register-link">Don&apos;t have an account? <Link href="/register">Register</Link></div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
