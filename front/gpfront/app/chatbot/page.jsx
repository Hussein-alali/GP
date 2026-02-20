"use client";
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';

// Initialize Gemini AI
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyB7hhp5aKt6eTrPHPrkK_rFg-YHFYGDp6Q";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "You are a real estate assistant for SMART ESTATE. Help users find properties by asking for their preferred location, budget, and property type. Be friendly, helpful, and concise."
});

const ChatBotPage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [messages, setMessages] = useState(() => {
    // Initialize with welcome message
    const welcomeMsg = {
      text: language === 'ar'
        ? "مرحباً! أنا مساعدك الذكي في SMART ESTATE. كيف يمكنني مساعدتك في العثور على منزلك المثالي اليوم؟" 
        : "Hello! I'm your SMART ESTATE assistant. How can I help you find your perfect home today?",
      sender: 'ai'
    };
    return [welcomeMsg];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg = { text: userText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Convert existing messages (excluding welcome) to Gemini format
      const chatHistory = messages
        .filter(msg => msg.sender !== 'ai' || !msg.text.includes('Hello') && !msg.text.includes('مرحباً'))
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      // Start chat session with history
      const chat = model.startChat({ 
        history: chatHistory
      });

      // Send message and get response
      const result = await chat.sendMessage(userText);
      const response = await result.response;
      const aiText = response.text();

      const aiMsg = { 
        text: aiText,
        sender: 'ai' 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error with Gemini API:', error);
      const errorMsg = {
        text: isRTL 
          ? "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى." 
          : "Sorry, an error occurred. Please try again.",
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
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
                  fontSize: '0.95rem',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-start',
                marginBottom: '15px'
              }}>
                <div style={{ 
                  padding: '12px 18px', 
                  borderRadius: '15px',
                  backgroundColor: '#e9ecef',
                  color: '#333',
                  fontSize: '0.95rem'
                }}>
                  {isRTL ? 'جاري الكتابة...' : 'Typing...'}
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
              placeholder={isRTL ? 'اسأل عن الأسعار أو المواقع...' : 'Ask about prices or locations...'}
              disabled={loading}
              style={{ 
                flex: 1, 
                padding: '12px', 
                borderRadius: '25px', 
                border: '1px solid #ddd', 
                outline: 'none',
                opacity: loading ? 0.6 : 1
              }}
            />
            <button 
              onClick={handleSend} 
              disabled={loading}
              style={{ 
                background: loading ? '#ccc' : '#004d7a', 
                color: '#fff', 
                border: 'none', 
                padding: '0 20px', 
                borderRadius: '25px', 
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? (isRTL ? 'جاري الإرسال...' : 'Sending...') : (isRTL ? 'إرسال' : 'Send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBotPage;