import React, { useState } from 'react';
import { X, Share2, Copy, Check, Link, Code } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, code }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const encodedCode = encodeURIComponent(btoa(unescape(encodeURIComponent(code))));
  const shareUrl = `${window.location.origin}/?code=${encodedCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-base">Share Java Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-blue-400" /> Shareable IDE Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-emerald-400" /> Copy Java Snippet
            </label>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-400 max-h-36 overflow-auto">
              <pre>{code}</pre>
            </div>
            <button
              onClick={handleCopySnippet}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? 'Snippet Copied' : 'Copy Code Snippet'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
