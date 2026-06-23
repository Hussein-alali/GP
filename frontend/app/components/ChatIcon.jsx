"use client";
import React from 'react';
import Link from 'next/link';

const ChatIcon = () => {
  return (
    <Link href="/chatbot" className="floating-chat-icon">
      <div className="icon-pulse"></div>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </Link>
  );
};

export default ChatIcon;