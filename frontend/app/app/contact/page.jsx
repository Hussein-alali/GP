// app/contact/page.jsx
"use client";
import React, { useState } from 'react';
import Link from 'next/link';

const ContactPage = () => {
  const [step, setStep] = useState(1); // Tracks which step we are on (1, 2, or 3)
  
  // Handlers for navigation
  const handleNext = (e) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handleBack = (e) => {
    e.preventDefault();
    setStep(step - 1);
  };

  return (
    <div className="login-page-container">
      <div className="contact-card">
        
        {/* --- Header (Logo & Title) --- */}
        {/* We hide the header on Step 3 for a cleaner "Success" look, or keep it if you prefer */}
        {step < 3 && (
            <>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div className="se-logo-box" style={{ cursor: 'pointer' }}>
                        <span>SE</span>
                    </div>
                </Link>
                <h2 className="contact-title">Contact Us</h2>
            </>
        )}

        {/* --- STEP 1: Personal Details --- */}
        {step === 1 && (
          <form onSubmit={handleNext}>
            <p className="contact-subtitle">How Can We Reach You?</p>
            
            <div className="contact-grid">
              <div className="form-group">
                <label className="form-label">First Name*</label>
                <input type="text" className="form-input" placeholder="John" required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name*</label>
                <input type="text" className="form-input" placeholder="Doe" required />
              </div>
              
              <div className="form-group full-width">
                <label className="form-label">Email*</label>
                <input type="email" className="form-input" placeholder="name@example.com" required />
              </div>
              
              <div className="form-group full-width">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-input" placeholder="+1 234 567 890" />
              </div>
            </div>

            <div className="form-options" style={{justifyContent: 'flex-start', marginBottom: '30px'}}>
               <label className="remember-me">
                 <input type="checkbox" required />
                 <span style={{fontSize: '13px', marginLeft: '8px'}}>
                    I agree to the processing of personal data*
                 </span>
               </label>
            </div>

            <button type="submit" className="login-submit-btn">Next</button>
          </form>
        )}

        {/* --- STEP 2: Inquiry Details --- */}
        {step === 2 && (
          <form onSubmit={handleNext}>
            <p className="contact-subtitle">What Can We Help You With?</p>

            <div className="form-group" style={{textAlign: 'left'}}>
              <label className="form-label">Inquiry Type*</label>
              <div className="form-input-wrapper">
                  <select className="form-input" style={{appearance: 'none'}}>
                    <option>General Inquiry</option>
                    <option>Sales</option>
                    <option>Support</option>
                  </select>
                  {/* Arrow Icon */}
                  <div style={{position:'absolute', right:'15px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
              </div>
            </div>

            <div className="form-group" style={{textAlign: 'left'}}>
              <label className="form-label">Your Message*</label>
              <textarea className="form-textarea" placeholder="Type your message here..." required></textarea>
            </div>

            <div className="button-group">
                <button type="button" onClick={handleBack} className="back-btn">Back</button>
                <button type="submit" className="login-submit-btn" style={{marginBottom: 0}}>Send Inquiry</button>
            </div>
          </form>
        )}

        {/* --- STEP 3: Success --- */}
        {step === 3 && (
          <div className="success-content">
             <div className="se-logo-box">SE</div>
             
             <div className="success-icon-circle">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
             </div>

             <h2 className="contact-title">Thank You.</h2>
             <p className="contact-subtitle" style={{maxWidth: '400px', margin: '0 auto'}}>
                We have received your request.<br/>
                We will come back to you within 1 workday.
             </p>

             {/* <p style={{marginTop: '40px', fontSize: '14px', color: '#888'}}>You Can Reach Us At:</p>
             
             <div className="contact-socials">
                <a href="#" className="contact-social-icon">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </a>
                <a href="#" className="contact-social-icon">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </a>
                <a href="#" className="contact-social-icon">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
             </div> */}
             
             <div style={{marginTop: '30px'}}>
                <Link href="/" style={{color: '#004d7a', textDecoration: 'none', fontWeight: '600'}}>Return Home</Link>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ContactPage;