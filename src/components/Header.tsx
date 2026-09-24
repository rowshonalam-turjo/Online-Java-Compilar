import React from 'react';
import { Settings, Share2, Code2, Sun, Moon } from 'lucide-react';
import { CodeTemplate } from '../types';
import { AdBanner } from './AdBanner';

interface HeaderProps {
  version: '17' | '21';
  onVersionChange: (v: '17' | '21') => void;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onSelectTemplate: (template: CodeTemplate) => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  onOpenProjectFiles: () => void;
  onDownloadCode: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  version,
  onVersionChange,
  isRunning,
  onRun,
  onStop,
  onSelectTemplate,
  onOpenSettings,
  onOpenShare,
  onOpenProjectFiles,
  onDownloadCode,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  return (
    <header className={`min-h-[70px] py-1.5 px-3 sm:px-4 border-b flex flex-col md:flex-row items-center justify-between gap-2 md:gap-3 select-none z-20 transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Brand & Title (Plus mobile controls on small screens) */}
      <div className="w-full md:w-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-bold shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`font-bold text-sm sm:text-base leading-none flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Java Online Compiler
            </h1>
            <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>IDE & Docker Sandbox</p>
          </div>
        </div>

        {/* Mobile-Only Action Controls */}
        <div className="flex md:hidden items-center gap-1.5">
          <button
            onClick={onToggleTheme}
            className={`p-1.5 border rounded-md text-xs font-medium transition cursor-pointer ${
              isDark ? 'bg-slate-800 text-amber-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
          <button
            onClick={onOpenShare}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle Advertisement Banner Slot (Device-Adaptive Scale) */}
      <AdBanner theme={theme} />

      {/* Desktop Main Controls */}
      <div className="hidden md:flex items-center gap-2">
        {/* Theme Mode Toggle (Dark / Light) */}
        <button
          onClick={onToggleTheme}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md text-xs font-medium transition cursor-pointer ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline font-semibold">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline font-semibold">Dark</span>
            </>
          )}
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShare}
          className={`p-2 rounded-md transition cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Share Code Snippet"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Settings Modal Button */}
        <button
          onClick={onOpenSettings}
          className={`p-2 rounded-md transition cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="IDE Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
