import React from 'react';
import { X, Settings, Check } from 'lucide-react';
import { EditorSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: EditorSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-base">Editor Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 text-sm">
          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-300">
              <label>Font Size</label>
              <span className="font-mono text-amber-400">{settings.fontSize}px</span>
            </div>
            <input
              type="range"
              min={12}
              max={24}
              step={1}
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ ...settings, fontSize: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Tab Size */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-slate-300">Tab Indentation</span>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
              {[2, 4].map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ ...settings, tabSize: size })}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                    settings.tabSize === size
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size} Spaces
                </button>
              ))}
            </div>
          </div>

          {/* Line Numbers Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-slate-300">Line Numbers</span>
            <button
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  lineNumbers: settings.lineNumbers === 'on' ? 'off' : 'on',
                })
              }
              className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                settings.lineNumbers === 'on' ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
            </button>
          </div>

          {/* Word Wrap Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-slate-300">Word Wrap</span>
            <button
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  wordWrap: settings.wordWrap === 'on' ? 'off' : 'on',
                })
              }
              className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                settings.wordWrap === 'on' ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
            </button>
          </div>

          {/* Auto Brackets Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-slate-300">Auto Close Brackets</span>
            <button
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  autoClosingBrackets:
                    settings.autoClosingBrackets === 'always' ? 'never' : 'always',
                })
              }
              className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                settings.autoClosingBrackets === 'always'
                  ? 'bg-amber-500 justify-end'
                  : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
            </button>
          </div>

          {/* Minimap Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-slate-300">Show Minimap</span>
            <button
              onClick={() => onUpdateSettings({ ...settings, minimap: !settings.minimap })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                settings.minimap ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
