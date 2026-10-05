import React from "react";
import { MapPin, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-socials" aria-label="Mạng xã hội">
        <a href="https://www.facebook.com/share/19JieMxUW9/?mibextid=wwXIfr" target="_blank" rel="noreferrer" aria-label="Facebook">
          <span className="facebook-mark" aria-hidden="true">f</span>
        </a>
        <a href="https://www.instagram.com/mn.retro.football" target="_blank" rel="noreferrer" aria-label="Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle className="instagram-dot" cx="17.5" cy="6.7" r="1" />
          </svg>
        </a>
        <a
          href="https://www.tiktok.com/@mn.retro.football.shop"
          target="_blank"
          rel="noreferrer"
          aria-label="TikTok"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 3v11.1a4.1 4.1 0 1 1-3.5-4.05" />
            <path d="M15 3c.35 2.65 2.1 4.5 5 4.8" />
          </svg>
        </a>
        <span className="site-contact" aria-label="Zalo 0359701325">
          <Phone size={17} aria-hidden="true" />
          <span>Zalo: 0359 701 325</span>
        </span>
        <span className="site-contact site-contact--address">
          <MapPin size={17} aria-hidden="true" />
          <span>Minh Khai, Hai Bà Trưng, Hà Nội</span>
        </span>
      </div>
    </footer>
  );
};
