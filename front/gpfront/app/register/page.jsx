// app/register/page.jsx
"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI, setAuthToken } from '@/services/api';

const RegisterPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

    if (!agreedToTerms) {
      setError('Please agree to the Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (response.access_token) {
        setAuthToken(response.access_token);
      }

      if (response.id && response.email) {
        localStorage.setItem('user', JSON.stringify({
          id: response.id,
          email: response.email,
          username: response.username || formData.username,
          phone: response.phone || "",
          bio: response.bio || "",
          favorites: Array.isArray(response.favorites) ? response.favorites : [],
        }));
      }

      router.push('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-page-container">
      <div className="login-card">
        
        {/* Left Side: New Image & Text */}
        <div className="login-image-side">
          {/* Make sure register-imgg.jpg is in your 'public' folder */}
          <img src="/register-imgg.jpg.jfif" alt="Smart City" className="login-bg-image" />
          
          <Link href="/" className="floating-badge" style={{ textDecoration: 'none', cursor: 'pointer' }}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
             Smart Estate
          </Link>

          <div className="image-overlay-text">
            <h3>Join the Future of Living</h3>
            <p>Create an account to explore exclusive properties and smart living solutions.</p>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="login-form-side">
          <div className="welcome-header">
            <h2>Create Your Account</h2>
            <p>It&apos;s free and easy to get started</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ 
                padding: '12px', 
                marginBottom: '20px', 
                backgroundColor: '#fee', 
                color: '#c33', 
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {/* Username Input */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="form-input-wrapper">
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="John Doe" 
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
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

            {/* Password Input */}
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

            {/* Terms & Conditions Checkbox */}
            <div className="form-options" style={{justifyContent: 'flex-start'}}>
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span>I agree to the <Link href="/terms" style={{color: '#2b70fa'}}>Terms & Conditions</Link></span>
              </label>
            </div>

            {/* Register Button */}
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>

            {/* Social Divider */}
            <div className="social-divider">
              <span>Or sign up with</span>
            </div>

            {/* Social Buttons Section */}
<div className="social-buttons">
  
  {/* Google Button -> Redirects to Google */}
  <a href="https://google.com" className="social-btn" style={{ textDecoration: 'none' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path></svg>
      Google
  </a>

  {/* Apple Button -> Redirects to Facebook (as requested) */}
  <a href="https://facebook.com" className="social-btn" style={{ textDecoration: 'none' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"></path></svg>
      Facebook
  </a>

</div>

            {/* Link back to Login */}
            <div className="register-link">
              Already have an account? 
              <Link href="/login">Login</Link>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
