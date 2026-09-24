import React, { useState, useEffect, useRef } from 'react';

interface AdBannerProps {
  theme: 'dark' | 'light';
}

export const AdBanner: React.FC<AdBannerProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Dynamically calculate responsive scale for mobile & small screens
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth || window.innerWidth;
        if (availableWidth > 0 && availableWidth < 736) {
          const newScale = Math.max(0.42, Math.min(1, (availableWidth - 8) / 728));
          setScale(newScale);
        } else {
          setScale(1);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const bannerPixelWidth = Math.round(728 * scale);
  const bannerPixelHeight = Math.round(90 * scale);

  return (
    <div
      ref={containerRef}
      id="header-adsterra-banner"
      className="w-full md:flex-1 max-w-[748px] flex items-center justify-center overflow-hidden py-0.5"
    >
      <div
        style={{
          width: `${bannerPixelWidth}px`,
          height: `${bannerPixelHeight}px`,
        }}
        className="relative transition-all duration-200 overflow-hidden flex items-center justify-center shrink-0 rounded"
      >
        <div
          style={{
            width: '728px',
            height: '90px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className={`absolute top-0 left-0 flex items-center justify-center rounded border transition-all overflow-hidden ${
            isDark
              ? 'bg-slate-950 border-slate-800/80'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          {/* Adsterra 728x90 Banner */}
          <iframe
            id="adsterra-728x90-iframe"
            title="Adsterra 728x90 Banner"
            src="/adsterra.html"
            width={728}
            height={90}
            className="w-[728px] h-[90px] border-0 overflow-hidden pointer-events-auto"
            scrolling="no"
          />
        </div>
      </div>
    </div>
  );
};
