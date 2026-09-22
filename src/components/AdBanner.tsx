import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, Edit3, X, Check, Code, Flame } from 'lucide-react';
import { AdConfig } from '../types';

interface AdBannerProps {
  theme: 'dark' | 'light';
}

const DEFAULT_AD: AdConfig = {
  enabled: true,
  type: 'adsterra',
  badge: 'Ad',
  title: 'Recommended Developer Resources & Tools',
  subtitle: 'High-speed cloud, APIs & coding practice',
  linkUrl: 'https://cloud.google.com/run',
  adsterraHtml: '',
  adsterraDirectLink: '',
  adsenseClientId: '',
  adsenseSlotId: '',
};

export const AdBanner: React.FC<AdBannerProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [adConfig, setAdConfig] = useState<AdConfig>(() => {
    const saved = localStorage.getItem('compiler_ad_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_AD,
          ...parsed,
          type: parsed.type || 'adsterra',
        };
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_AD;
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<AdConfig>(adConfig);

  useEffect(() => {
    localStorage.setItem('compiler_ad_config', JSON.stringify(adConfig));
  }, [adConfig]);

  if (!adConfig.enabled) {
    return (
      <div className="hidden lg:flex items-center">
        <button
          onClick={() => {
            setTempConfig({ ...adConfig, enabled: true });
            setIsEditOpen(true);
          }}
          className={`text-[11px] px-2 py-1 rounded border border-dashed transition cursor-pointer ${
            isDark
              ? 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'
              : 'border-slate-300 text-slate-400 hover:text-slate-700 hover:border-slate-400'
          }`}
        >
          + Enable Adsterra / Ads Slot
        </button>
      </div>
    );
  }

  const handleSave = () => {
    setAdConfig(tempConfig);
    setIsEditOpen(false);
  };

  return (
    <>
      <div className="flex-1 max-w-xl mx-2 hidden sm:flex items-center justify-center">
        {/* Case 1: Adsterra with Custom Script / Iframe HTML */}
        {adConfig.type === 'adsterra' && adConfig.adsterraHtml ? (
          <div
            className={`group relative w-full h-10 px-2 flex items-center justify-between rounded-md border text-xs overflow-hidden transition-all ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex-1 h-full flex items-center justify-center overflow-hidden">
              <iframe
                title="Adsterra Ad"
                srcDoc={`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;padding:0;overflow:hidden;background:transparent;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;}</style></head><body>${adConfig.adsterraHtml}</body></html>`}
                className="w-full h-full border-0 overflow-hidden"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                scrolling="no"
              />
            </div>

            <button
              onClick={() => {
                setTempConfig(adConfig);
                setIsEditOpen(true);
              }}
              className={`p-1 rounded opacity-30 group-hover:opacity-100 transition cursor-pointer shrink-0 ml-1 ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Edit Adsterra Code"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : adConfig.type === 'adsterra' && adConfig.adsterraDirectLink ? (
          // Case 2: Adsterra Direct Link (Smartlink)
          <div
            className={`group relative w-full h-10 px-3 flex items-center justify-between rounded-md border text-xs shadow-sm transition-all duration-200 ${
              isDark
                ? 'bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 border-amber-900/40 hover:border-amber-500/60 text-slate-200'
                : 'bg-gradient-to-r from-amber-100/50 via-orange-50/40 to-slate-50 border-amber-300 hover:border-amber-500 text-slate-800'
            }`}
          >
            <a
              href={adConfig.adsterraDirectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-2 overflow-hidden text-left cursor-pointer"
            >
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shrink-0 ${
                  isDark
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {adConfig.badge || 'Adsterra'}
              </span>

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-xs truncate group-hover:text-amber-400 transition-colors">
                  {adConfig.title || 'Check Out Special Sponsored Offer'}
                </span>
                <span className="text-slate-500 hidden md:inline text-[11px] truncate">
                  • {adConfig.subtitle || 'Click to explore'}
                </span>
              </div>

              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-400 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTempConfig(adConfig);
                setIsEditOpen(true);
              }}
              className={`p-1 ml-1.5 rounded opacity-40 hover:opacity-100 transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Edit Adsterra Setup"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        ) : adConfig.type === 'adsterra' ? (
          // Case 3: Adsterra not yet configured - quick setup prompt button
          <div
            onClick={() => {
              setTempConfig(adConfig);
              setIsEditOpen(true);
            }}
            className={`w-full h-10 px-3 flex items-center justify-between rounded-md border text-xs cursor-pointer transition-all ${
              isDark
                ? 'bg-slate-950/70 border-slate-800 hover:border-amber-500/60 text-slate-300'
                : 'bg-amber-50/50 border-amber-200 hover:border-amber-400 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                Adsterra
              </span>
              <span className="text-xs truncate text-amber-400 font-medium">
                Click here to paste your Adsterra Banner Script or Direct Link
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
              <Code className="w-3 h-3 text-amber-400" />
              <span>Paste Code</span>
            </div>
          </div>
        ) : adConfig.type === 'adsense' && adConfig.adsenseClientId ? (
          // Case 4: Google AdSense
          <div
            className={`w-full h-10 px-3 flex items-center justify-between rounded-md border text-xs relative overflow-hidden transition-all ${
              isDark
                ? 'bg-slate-950/70 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30">
                AdSense
              </span>
              <span className="text-xs truncate font-mono text-slate-400">
                Slot: {adConfig.adsenseSlotId || 'Header-Banner-Responsive'}
              </span>
            </div>
            <button
              onClick={() => {
                setTempConfig(adConfig);
                setIsEditOpen(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer"
              title="Configure Advertisement"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          // Case 5: Interactive Custom Sponsor Banner
          <div
            className={`group relative w-full h-10 px-3 flex items-center justify-between rounded-md border text-xs shadow-sm transition-all duration-200 ${
              isDark
                ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800 hover:border-amber-500/40 text-slate-200'
                : 'bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-slate-50 border-amber-200/80 hover:border-amber-400 text-slate-800'
            }`}
          >
            <a
              href={adConfig.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-2.5 overflow-hidden text-left cursor-pointer"
            >
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shrink-0 transition-colors ${
                  isDark
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {adConfig.badge || 'Ad'}
              </span>

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-xs truncate group-hover:text-amber-400 transition-colors">
                  {adConfig.title}
                </span>
                <span className="text-slate-500 hidden md:inline text-[11px] truncate">
                  • {adConfig.subtitle}
                </span>
              </div>

              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-400 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTempConfig(adConfig);
                setIsEditOpen(true);
              }}
              className={`p-1 ml-1.5 rounded opacity-40 hover:opacity-100 transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Edit / Setup Advertisement"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Ad Settings Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base">Adsterra & Ads Configuration</h3>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Enable / Disable */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm block">Display Ads in Header</span>
                  <span className="text-[11px] text-slate-400">Show Adsterra banner or direct link</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTempConfig({ ...tempConfig, enabled: !tempConfig.enabled })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                    tempConfig.enabled ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
                </button>
              </div>

              {/* Type Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold">Network / Ad Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTempConfig({ ...tempConfig, type: 'adsterra' })}
                    className={`py-2 px-2 rounded-lg border text-center font-medium transition cursor-pointer text-xs ${
                      tempConfig.type === 'adsterra'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold'
                        : isDark
                        ? 'border-slate-800 bg-slate-950 text-slate-400'
                        : 'border-slate-300 bg-slate-100 text-slate-700'
                    }`}
                  >
                    🔥 Adsterra
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempConfig({ ...tempConfig, type: 'custom' })}
                    className={`py-2 px-2 rounded-lg border text-center font-medium transition cursor-pointer text-xs ${
                      tempConfig.type === 'custom'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold'
                        : isDark
                        ? 'border-slate-800 bg-slate-950 text-slate-400'
                        : 'border-slate-300 bg-slate-100 text-slate-700'
                    }`}
                  >
                    Custom Banner
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempConfig({ ...tempConfig, type: 'adsense' })}
                    className={`py-2 px-2 rounded-lg border text-center font-medium transition cursor-pointer text-xs ${
                      tempConfig.type === 'adsense'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold'
                        : isDark
                        ? 'border-slate-800 bg-slate-950 text-slate-400'
                        : 'border-slate-300 bg-slate-100 text-slate-700'
                    }`}
                  >
                    AdSense
                  </button>
                </div>
              </div>

              {/* Adsterra Configuration Form */}
              {tempConfig.type === 'adsterra' && (
                <div className="space-y-3 pt-1">
                  <div className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
                    isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <strong>Adsterra Setup:</strong> You can either paste your <strong>Adsterra Banner Script (468x60 / 320x50 / Native)</strong> or paste an <strong>Adsterra Direct Link (Smartlink)</strong> below.
                  </div>

                  {/* Option A: Adsterra Banner Script / HTML */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-slate-300">
                        Adsterra Banner Code (Script / Iframe)
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Option 1</span>
                    </div>
                    <textarea
                      rows={4}
                      value={tempConfig.adsterraHtml || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, adsterraHtml: e.target.value })}
                      placeholder={`<script type="text/javascript">\n  atOptions = {\n    'key' : 'your_adsterra_key',\n    'format' : 'iframe',\n    'height' : 50,\n    'width' : 320\n  };\n</script>\n<script type="text/javascript" src="//www.topcreativeformat.com/your_key/invoke.js"></script>`}
                      className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none focus:border-amber-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                    <p className="text-[10px] text-slate-500">
                      Paste the code snippet from your Adsterra Publisher Dashboard.
                    </p>
                  </div>

                  {/* Option B: Adsterra Direct Link (SmartLink) */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-slate-300">
                        Adsterra Direct Link / Smartlink (URL)
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Option 2</span>
                    </div>
                    <input
                      type="url"
                      value={tempConfig.adsterraDirectLink || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, adsterraDirectLink: e.target.value })}
                      placeholder="https://beta.adsterra.com/smartlink/..."
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-amber-500 font-mono ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">Direct Link Title</label>
                        <input
                          type="text"
                          value={tempConfig.title}
                          onChange={(e) => setTempConfig({ ...tempConfig, title: e.target.value })}
                          placeholder="e.g. Special Offer • Click Here"
                          className={`w-full px-2.5 py-1.5 rounded border text-xs ${
                            isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">Badge</label>
                        <input
                          type="text"
                          value={tempConfig.badge}
                          onChange={(e) => setTempConfig({ ...tempConfig, badge: e.target.value })}
                          placeholder="Adsterra / Sponsored"
                          className={`w-full px-2.5 py-1.5 rounded border text-xs ${
                            isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Banner Configuration Form */}
              {tempConfig.type === 'custom' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">Badge Label</label>
                    <input
                      type="text"
                      value={tempConfig.badge}
                      onChange={(e) => setTempConfig({ ...tempConfig, badge: e.target.value })}
                      placeholder="e.g. Sponsored, Ad, Partner"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-amber-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">Ad Headline / Title</label>
                    <input
                      type="text"
                      value={tempConfig.title}
                      onChange={(e) => setTempConfig({ ...tempConfig, title: e.target.value })}
                      placeholder="e.g. Cloud VPS Hosting • 50% Off"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-amber-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">Subtitle / Description</label>
                    <input
                      type="text"
                      value={tempConfig.subtitle}
                      onChange={(e) => setTempConfig({ ...tempConfig, subtitle: e.target.value })}
                      placeholder="e.g. Deploy fast with zero configuration"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-amber-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">Target Link URL</label>
                    <input
                      type="url"
                      value={tempConfig.linkUrl}
                      onChange={(e) => setTempConfig({ ...tempConfig, linkUrl: e.target.value })}
                      placeholder="https://example.com"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-amber-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                </>
              )}

              {/* Google AdSense Configuration Form */}
              {tempConfig.type === 'adsense' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">AdSense Client ID (ca-pub-xxxx)</label>
                    <input
                      type="text"
                      value={tempConfig.adsenseClientId || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, adsenseClientId: e.target.value })}
                      placeholder="ca-pub-1234567890123456"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-amber-500 font-mono ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">AdSense Slot ID</label>
                    <input
                      type="text"
                      value={tempConfig.adsenseSlotId || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, adsenseSlotId: e.target.value })}
                      placeholder="1234567890"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-amber-500 font-mono ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                </>
              )}
            </div>

            <div className={`px-5 py-3 border-t flex justify-end gap-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Adsterra Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
