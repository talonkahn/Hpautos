import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Key } from 'lucide-react';

// Always-on 24/7 scrolling marquee announcing worldwide car rentals.
// Unlike the admin SpotlightBanner (which is dismissible and timed),
// this one runs continuously as a slim strip and never disappears.
export default function RentalBanner() {
  const navigate = useNavigate();
  const message = '🔑 Rentals of vehicles available worldwide — click to get started!';

  // Duplicate the message so the marquee loops seamlessly
  const items = Array.from({ length: 6 }, (_, i) => i);

  return (
    <button
      onClick={() => navigate('/Browse')}
      className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 overflow-hidden h-7 sm:h-8 flex items-center cursor-pointer group"
      aria-label="View car rentals"
    >
      <div className="flex items-center gap-10 sm:gap-16 whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]">
        {items.map(i => (
          <span key={i} className="flex items-center gap-2 text-white text-[11px] sm:text-xs font-medium px-2">
            <Key className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            {message}
          </span>
        ))}
      </div>
    </button>
  );
}
