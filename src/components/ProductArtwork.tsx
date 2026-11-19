import { useState } from 'react';
import {
  Armchair,
  BookOpen,
  Box,
  LampDesk,
  Package,
  PlugZap,
  Utensils,
} from 'lucide-react';
import type { MarketplaceCategory } from '../types/marketplace';

export function CategoryArtwork({
  category,
  title,
  className = '',
}: {
  category: MarketplaceCategory | string;
  title?: string;
  className?: string;
}) {
  const renderIcon = () => {
    switch (category) {
      case 'Study tables and furniture':
        return <Armchair className="h-10 w-10 text-[#174C3C]" strokeWidth={1.5} />;
      case 'Electronics and appliances':
        return <PlugZap className="h-10 w-10 text-[#174C3C]" strokeWidth={1.5} />;
      case 'Books and academic materials':
        return <BookOpen className="h-10 w-10 text-[#174C3C]" strokeWidth={1.5} />;
      case 'Storage and room essentials':
        return <Box className="h-10 w-10 text-[#174C3C]" strokeWidth={1.5} />;
      case 'Kitchen essentials':
        return <Utensils className="h-10 w-10 text-[#174C3C]" strokeWidth={1.5} />;
      case 'Hostel accessories':
        return <LampDesk className="h-10 w-10 text-[#174C3C]" strokeWidth={1.5} />;
      default:
        return <Package className="h-10 w-10 text-[#174C3C]" strokeWidth={1.5} />;
    }
  };

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#EDE9DF] via-[#F4F1EA] to-[#E4DED1] p-6 text-center ${className}`}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
        viewBox="0 0 400 300"
        fill="none"
      >
        <circle cx="340" cy="40" r="90" stroke="#174C3C" strokeOpacity="0.14" strokeWidth="1" />
        <circle cx="60" cy="260" r="110" stroke="#2F8065" strokeOpacity="0.14" strokeWidth="1" />
        <path d="M0 240 H400" stroke="#174C3C" strokeOpacity="0.08" strokeWidth="1" />
      </svg>
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D8D1C2] bg-[#F8F7F2]/90 shadow-xs">
        {renderIcon()}
      </div>
      <p className="relative z-10 mt-3 max-w-[18ch] truncate text-xs font-medium text-[#525C58]">
        {title || category}
      </p>
    </div>
  );
}

export function ListingImage({
  src,
  alt,
  category,
  className = '',
}: {
  src?: string;
  alt: string;
  category: MarketplaceCategory | string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <CategoryArtwork category={category} title={alt} className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

export function HeroRoomIllustration() {
  return (
    <div className="relative flex h-full min-h-[340px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-[#DCD6C8] bg-[#EDE9DF] p-6 sm:p-8">
      <svg
        aria-hidden="true"
        viewBox="0 0 640 420"
        className="h-full w-full max-h-[340px]"
        fill="none"
      >
        <rect x="24" y="24" width="592" height="372" rx="18" fill="#F8F7F2" stroke="#D7D0C1" strokeWidth="1.5" />
        {/* Window & Dehradun hills silhouette */}
        <rect x="64" y="54" width="210" height="145" rx="10" fill="#E5EFEA" stroke="#C5D8CF" strokeWidth="1.5" />
        <path d="M64 166 Q120 128 176 154 T274 148 L274 199 L64 199 Z" fill="#2F8065" fillOpacity="0.22" />
        <path d="M64 176 Q140 148 212 172 T274 168 L274 199 L64 199 Z" fill="#174C3C" fillOpacity="0.28" />
        <circle cx="222" cy="96" r="18" fill="#F4DFB6" />
        <line x1="169" y1="54" x2="169" y2="199" stroke="#C5D8CF" strokeWidth="1.5" />

        {/* Wooden Study Desk */}
        <rect x="86" y="248" width="320" height="18" rx="4" fill="#174C3C" />
        <rect x="102" y="266" width="14" height="96" rx="3" fill="#242B29" />
        <rect x="376" y="266" width="14" height="96" rx="3" fill="#242B29" />
        <rect x="292" y="266" width="84" height="58" rx="4" fill="#EDE9DF" stroke="#CFC7B6" strokeWidth="1.5" />
        <line x1="324" y1="286" x2="344" y2="286" stroke="#174C3C" strokeWidth="3" strokeLinecap="round" />

        {/* Desk Lamp */}
        <path d="M136 248 L148 182 L182 170" stroke="#242B29" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M174 164 L204 176 L190 192 L166 180 Z" fill="#2F8065" />
        <rect x="122" y="242" width="30" height="6" rx="3" fill="#242B29" />

        {/* Stack of Textbooks */}
        <rect x="218" y="232" width="68" height="16" rx="3" fill="#2F8065" />
        <rect x="224" y="218" width="58" height="14" rx="3" fill="#174C3C" />
        <rect x="230" y="206" width="48" height="12" rx="3" fill="#D4C9B4" />

        {/* Electric Kettle on side shelf */}
        <rect x="444" y="210" width="128" height="152" rx="8" fill="#EDE9DF" stroke="#CFC7B6" strokeWidth="1.5" />
        <line x1="444" y1="278" x2="572" y2="278" stroke="#CFC7B6" strokeWidth="1.5" />
        <rect x="478" y="168" width="46" height="42" rx="6" fill="#242B29" />
        <path d="M524 178 C538 178 538 200 524 200" stroke="#242B29" strokeWidth="4" fill="none" />
        <rect x="472" y="205" width="58" height="5" rx="2" fill="#174C3C" />

        {/* Storage Basket */}
        <rect x="470" y="294" width="76" height="54" rx="6" fill="#C9B99B" />
        <line x1="484" y1="308" x2="532" y2="308" stroke="#8F7E62" strokeWidth="2" />
      </svg>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#D8D1C2] pt-4 text-xs text-[#525C58]">
        <span>DBS Global University · Selaqui · Prem Nagar · Bidholi</span>
        <span className="font-medium text-[#174C3C]">Student-to-student campus exchange</span>
      </div>
    </div>
  );
}
