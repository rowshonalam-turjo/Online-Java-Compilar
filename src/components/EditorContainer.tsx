import React, { useRef, useEffect, useState } from 'react';
import { FileCode, Play, Square, Sparkles, Copy, Check } from 'lucide-react';
import { EditorSettings } from '../types';
import { findMissingImports, applyAutoImportsToCode } from '../utils/autoImport';
import { CodeError } from '../utils/errorParser';

interface EditorContainerProps {
  code: string;
  onChange: (value: string) => void;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  settings: EditorSettings;
  theme?: 'dark' | 'light';
  errors?: CodeError[];
  targetLine?: { line: number; col?: number; timestamp: number } | null;
}

const FONT_FAMILY = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
const LINE_HEIGHT_PX = 24;

export const EditorContainer: React.FC<EditorContainerProps> = ({
  code,
  onChange,
  isRunning,
  onRun,
  onStop,
  settings,
  theme = 'dark',
  errors = [],
  targetLine = null,
}) => {
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Synchronize textarea scrolling with line numbers and error underline overlay
  const handleTextareaScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;

      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = top;
      }
      if (overlayRef.current) {
        overlayRef.current.scrollTop = top;
        overlayRef.current.scrollLeft = left;
      }
    }
  };

  // Jump to specific line on error click
  useEffect(() => {
    if (targetLine && targetLine.line > 0 && textareaRef.current) {
      const ta = textareaRef.current;
      const lines = code.split('\n');
      let charIndex = 0;
      for (let i = 0; i < targetLine.line - 1 && i < lines.length; i++) {
        charIndex += lines[i].length + 1; // +1 for '\n'
      }
      if (targetLine.col) {
        charIndex += Math.min(targetLine.col - 1, (lines[targetLine.line - 1] || '').length);
      }
      ta.focus();
      ta.setSelectionRange(charIndex, charIndex);
      ta.scrollTop = Math.max(0, (targetLine.line - 4) * LINE_HEIGHT_PX);
    }
  }, [targetLine, code]);

  // Tab key & Auto-Indentation on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;

    // Ctrl+Enter or Cmd+Enter to run code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
      return;
    }

    // Tab key: insert spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const tabSpaces = ' '.repeat(settings.tabSize || 4);
      const newText = code.substring(0, start) + tabSpaces + code.substring(end);
      onChange(newText);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + tabSpaces.length;
      }, 0);
      return;
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      const start = ta.selectionStart;
      const currentLine = code.substring(0, start).split('\n').pop() || '';
      const match = currentLine.match(/^(\s+)/);
      const indent = match ? match[1] : '';

      // Extra indent if line ends with '{'
      const trimmed = currentLine.trim();
      const extraIndent = trimmed.endsWith('{') ? ' '.repeat(settings.tabSize || 4) : '';

      if (indent || extraIndent) {
        e.preventDefault();
        const addition = '\n' + indent + extraIndent;
        const newText = code.substring(0, start) + addition + code.substring(ta.selectionEnd);
        onChange(newText);
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = start + addition.length;
        }, 0);
      }
    }
  };

  const lines = code.split('\n');
  const linesCount = lines.length;
  const charCount = code.length;

  // Dynamically detect file name from public class or first class
  const pubMatch = code.match(/public\s+(?:final\s+|abstract\s+)?(?:class|interface|enum|record)\s+([A-Za-z0-9_$]+)/);
  const classMatch = code.match(/(?:public\s+|final\s+|abstract\s+)*class\s+([A-Za-z0-9_$]+)/);
  const detectedFileName = `${pubMatch ? pubMatch[1] : (classMatch ? classMatch[1] : 'Main')}.java`;

  // Detect missing imports
  const missingImports = findMissingImports(code);

  const handleAutoImport = () => {
    const { updatedCode, addedImports } = applyAutoImportsToCode(code);
    if (addedImports.length > 0) {
      onChange(updatedCode);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Jump to specific error line helper
  const handleJumpToError = (line: number, col: number = 1) => {
    if (textareaRef.current) {
      const ta = textareaRef.current;
      let charIndex = 0;
      for (let i = 0; i < line - 1 && i < lines.length; i++) {
        charIndex += lines[i].length + 1;
      }
      charIndex += Math.min(col - 1, (lines[line - 1] || '').length);
      ta.focus();
      ta.setSelectionRange(charIndex, charIndex);
      ta.scrollTop = Math.max(0, (line - 4) * LINE_HEIGHT_PX);
    }
  };

  // Map of errors by line for rapid lookup
  const errorsByLine = new Map<number, CodeError>();
  for (const err of errors) {
    if (!errorsByLine.has(err.line)) {
      errorsByLine.set(err.line, err);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col border rounded-lg overflow-hidden h-full w-full transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Editor Header Bar */}
      <div className={`h-11 border-b px-2.5 sm:px-3 flex items-center justify-between gap-2 transition-colors ${
        isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        {/* Left: File Name Tab & Stats */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-t text-xs font-mono font-medium ${
            isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-slate-300 text-amber-600'
          }`}>
            <FileCode className="w-4 h-4 text-amber-500" />
            <span>{detectedFileName}</span>
            <span className={`w-2 h-2 rounded-full ${errors.length > 0 ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
          </div>

          <span className={`text-[11px] font-mono hidden sm:inline ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {linesCount} lines • {charCount} chars
          </span>
        </div>

        {/* Right: Actions & Run Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Copy Code Button */}
          <button
            type="button"
            onClick={handleCopyCode}
            className={`p-1.5 rounded text-xs transition cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Copy Source Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Auto-Import Button */}
          {missingImports.length > 0 && (
            <button
              onClick={handleAutoImport}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer border shadow-sm ${
                isDark
                  ? 'bg-amber-950/50 border-amber-500/60 text-amber-300 hover:bg-amber-900/60 hover:text-amber-200 hover:border-amber-400'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400'
              }`}
              title={`Click to automatically import: ${missingImports.map(m => m.className).join(', ')}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Auto Import</span>
              <span>({missingImports.length})</span>
            </button>
          )}

          {/* Run / Stop Button */}
          {!isRunning ? (
            <button
              onClick={onRun}
              className="group relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs sm:text-sm rounded-md shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-500/30 hover:ring-emerald-400/50 active:scale-95 hover:scale-[1.02] transition-all cursor-pointer"
              title="Run Java Code (Ctrl + Enter)"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span className="uppercase tracking-wider">Run</span>
            </button>
          ) : (
            <button
              onClick={onStop}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm rounded-md shadow-lg shadow-rose-950/60 ring-2 ring-rose-500/30 active:scale-95 transition-all cursor-pointer animate-pulse"
              title="Stop Execution"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="uppercase tracking-wider">Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Code Textarea Area with Red Error Underline Layer */}
      <div className={`flex-1 min-h-0 relative ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
        <div className="flex h-full w-full overflow-hidden select-text">
          {/* Synchronized Line Numbers Gutter */}
          {settings.lineNumbers !== 'off' && (
            <div
              ref={lineNumbersRef}
              className={`py-2.5 px-2 select-none text-right font-mono text-xs border-r overflow-hidden leading-6 ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800 text-slate-500'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              style={{
                width: `${Math.max(38, (linesCount.toString().length + 1) * 9)}px`,
                fontFamily: FONT_FAMILY,
              }}
            >
              {lines.map((_, i) => {
                const num = i + 1;
                const err = errorsByLine.get(num);
                return (
                  <div
                    key={num}
                    onClick={() => err && handleJumpToError(err.line, err.column)}
                    className={`transition-colors ${
                      err
                        ? 'text-rose-400 font-bold bg-rose-500/20 rounded px-1 cursor-pointer hover:bg-rose-500/30'
                        : ''
                    }`}
                    title={err ? `Error on line ${num}: ${err.message}` : undefined}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          )}

          {/* Editor Container with Error Highlight Underline Overlay */}
          <div className="flex-1 relative h-full overflow-hidden">
            {/* Background Red Wavy Underline Layer (Shows error squiggly line at exact error token) */}
            <div
              ref={overlayRef}
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none p-2.5 font-mono text-xs sm:text-sm leading-6 overflow-hidden select-none"
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: `${settings.fontSize || 14}px`,
                lineHeight: `${LINE_HEIGHT_PX}px`,
                tabSize: settings.tabSize || 4,
                whiteSpace: settings.wordWrap === 'on' ? 'pre-wrap' : 'pre',
                wordBreak: 'break-all',
                letterSpacing: '0px',
              }}
            >
              {lines.map((lineText, idx) => {
                const lineNum = idx + 1;
                const err = errorsByLine.get(lineNum);

                if (!err) {
                  return (
                    <div key={idx} style={{ minHeight: `${LINE_HEIGHT_PX}px` }} className="opacity-0">
                      {lineText || ' '}
                    </div>
                  );
                }

                // Error present on this line: calculate exact token start and length
                const colIndex = Math.max(0, Math.min(err.column - 1, lineText.length));
                const before = lineText.slice(0, colIndex);
                const rest = lineText.slice(colIndex);
                const wordMatch = rest.match(/^[A-Za-z0-9_$]+/);
                const tokenLength = Math.max(1, wordMatch ? wordMatch[0].length : 1);
                const errorToken = rest.slice(0, tokenLength) || ' ';
                const after = rest.slice(tokenLength);

                return (
                  <div key={idx} style={{ minHeight: `${LINE_HEIGHT_PX}px` }} className="relative">
                    <span className="opacity-0">{before}</span>
                    <span
                      className="relative inline-block text-transparent bg-rose-500/25 rounded-xs"
                      style={{
                        textDecoration: 'underline wavy #ef4444 2.5px',
                        textUnderlineOffset: '4px',
                      }}
                      title={`Error on line ${lineNum}, col ${err.column}: ${err.message}`}
                    >
                      <span className="opacity-0">{errorToken}</span>
                    </span>
                    <span className="opacity-0">{after}</span>
                  </div>
                );
              })}
            </div>

            {/* Native Foreground Textarea: 100% Native Keyboard Input, 0% Interception */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleTextareaScroll}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              placeholder="Type your Java code here..."
              className={`relative z-10 w-full h-full p-2.5 font-mono text-xs sm:text-sm leading-6 resize-none outline-none border-0 overflow-auto whitespace-pre font-normal bg-transparent ${
                isDark
                  ? 'text-slate-100 selection:bg-blue-600/50 caret-sky-400'
                  : 'text-slate-900 selection:bg-blue-200 caret-blue-600'
              }`}
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: `${settings.fontSize || 14}px`,
                lineHeight: `${LINE_HEIGHT_PX}px`,
                tabSize: settings.tabSize || 4,
                whiteSpace: settings.wordWrap === 'on' ? 'pre-wrap' : 'pre',
                wordBreak: 'break-all',
                letterSpacing: '0px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
