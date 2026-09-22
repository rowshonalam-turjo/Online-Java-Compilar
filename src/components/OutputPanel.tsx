import React, { useState } from 'react';
import { Terminal, Copy, Check, Trash2, Download, Clock, HardDrive, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CompileResponse } from '../types';

interface OutputPanelProps {
  response: CompileResponse | null;
  isRunning: boolean;
  onClear: () => void;
  onDownloadCode: () => void;
  theme?: 'dark' | 'light';
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  response,
  isRunning,
  onClear,
  onDownloadCode,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!response) return;
    const textToCopy = response.error ? `${response.output}\n${response.error}` : response.output;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formattedTime = response
    ? (response.executionTime / 1000).toFixed(2) + 's'
    : '0.00s';

  return (
    <div className={`flex flex-col h-full border rounded-lg overflow-hidden transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Panel Header */}
      <div className={`h-11 border-b px-3 flex items-center justify-between gap-2 select-none transition-colors ${
        isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-500" />
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Execution Output
          </span>

          {/* Status Badge */}
          {isRunning ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-mono animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              Compiling & Running...
            </span>
          ) : response ? (
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border font-medium ${
                response.status === 'COMPLETED'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : response.status === 'COMPILATION_ERROR'
                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                  : response.status === 'TIME_LIMIT_EXCEEDED'
                  ? 'bg-orange-950 text-orange-400 border-orange-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}
            >
              {response.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              {response.status === 'COMPILATION_ERROR' && <AlertCircle className="w-3 h-3 text-amber-400" />}
              {response.status === 'RUNTIME_ERROR' && <AlertCircle className="w-3 h-3 text-rose-400" />}
              {response.status === 'TIME_LIMIT_EXCEEDED' && <Clock className="w-3 h-3 text-orange-400" />}
              {response.status === 'RATE_LIMITED' && <ShieldAlert className="w-3 h-3 text-rose-400" />}
              {response.status}
            </span>
          ) : null}
        </div>

        {/* Telemetry Stats & Action Controls */}
        <div className="flex items-center gap-3">
          {response && !isRunning && (
            <div className={`hidden sm:flex items-center gap-3 text-[11px] font-mono ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {formattedTime}
              </span>
              {response.memory && (
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-slate-500" />
                  {response.memory}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1">
            {/* Copy Button */}
            {response && (
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="Copy Terminal Output"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[10px]">Copy</span>
                  </>
                )}
              </button>
            )}

            {/* Download Main.java */}
            <button
              onClick={onDownloadCode}
              className={`p-1 rounded transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Download Main.java"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Clear Button */}
            {response && (
              <button
                onClick={onClear}
                className={`p-1 rounded transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-200'
                }`}
                title="Clear Output"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Output Console Display Area */}
      <div className={`flex-1 p-3 font-mono text-xs overflow-auto leading-relaxed selection:bg-blue-600 selection:text-white transition-colors ${
        isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-900 text-slate-100'
      }`}>
        {isRunning ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 select-none">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Compiling Java source code & executing in sandbox...</p>
          </div>
        ) : response ? (
          <div className="space-y-3">
            {/* Error Message Section */}
            {response.error && (
              <div className="bg-rose-950/50 border border-rose-800/80 rounded p-3 text-rose-300 whitespace-pre-wrap font-mono">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {response.status === 'COMPILATION_ERROR' ? 'Compilation Error' : 'Runtime Error'}
                </div>
                {response.error}
              </div>
            )}

            {/* STDOUT Output Section */}
            {response.output ? (
              <div className="text-emerald-400 whitespace-pre-wrap font-mono leading-relaxed">
                {response.output}
              </div>
            ) : !response.error ? (
              <div className="text-slate-400 italic">(Program exited successfully with no output text)</div>
            ) : null}

            {/* Execution Completion Footer */}
            <div className={`pt-2 border-t text-[10px] flex items-center justify-between ${
              isDark ? 'border-slate-800 text-slate-500' : 'border-slate-800 text-slate-400'
            }`}>
              <span>Exit status: {response.success ? '0 (SUCCESS)' : '1 (ERROR)'}</span>
              <span>Time: {formattedTime} • Memory: {response.memory || '14 MB'}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 select-none">
            <Terminal className="w-8 h-8 text-slate-600" />
            <p className="text-xs font-mono">Click "Run" or press Ctrl+Enter to compile and execute Java code.</p>
          </div>
        )}
      </div>
    </div>
  );
};
