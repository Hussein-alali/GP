"use client";
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';

const ChatBotPage = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { text: input, sender: 'user' };
    setMessages([...messages, userMsg]);
    setInput("");

    // Simulate AI response (Replace with your Gemini API call)
    setTimeout(() => {
      const aiMsg = { 
        text: isRTL ? "أنا مساعدك الذكي في SMART ESTATE. كيف يمكنني مساعدتك في العثور على منزلك اليوم؟" : "I am your SMART ESTATE assistant. How can I help you find your home today?", 
        sender: 'ai' 
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <div style={{ backgroundColor: '#0069a7', minHeight: '100vh' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <div className="chatbot-wrapper" style={{ paddingTop: '100px', maxWidth: '800px', margin: '0 auto', padding: '100px 20px 20px' }}>
        <div className="chat-container" style={{ background: '#fff', borderRadius: '15px', height: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid #eee', backgroundColor: '#004d7a', color: '#fff', borderRadius: '15px 15px 0 0' }}>
            <h2 style={{ fontSize: '1.2rem' }}>{isRTL ? 'المساعد الذكي' : 'Smart Assistant'}</h2>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '15px'
              }}>
                <div style={{ 
                  maxWidth: '70%', 
                  padding: '12px 18px', 
                  borderRadius: '15px',
                  backgroundColor: msg.sender === 'user' ? '#008ccf' : '#e9ecef',
                  color: msg.sender === 'user' ? '#fff' : '#333',
                  fontSize: '0.95rem'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRTL ? 'اسأل عن الأسعار أو المواقع...' : 'Ask about prices or locations...'}
              style={{ flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #ddd', outline: 'none' }}
            />
            <button onClick={handleSend} style={{ background: '#004d7a', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '25px', cursor: 'pointer' }}>
              {isRTL ? 'إرسال' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBotPage;