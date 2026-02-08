"use client";

import Link from "next/link";
import { Globe, Phone, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <header className="header">
      <div className="header-left">
        <Phone size={18} />
        <span>تسجيل الاهتمام</span>
      </div>

      <div className="header-center">
        <span>English</span>
        <Globe size={18} />
      </div>

      <div className="header-logo">
        <h2>TMG Banān</h2>
        <span>Al Riyadh</span>
      </div>

      <div className="header-right">
        <span>القائمة</span>
        <Menu size={22} />
      </div>
    </header>
  );
}
