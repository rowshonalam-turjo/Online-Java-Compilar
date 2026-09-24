import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Trash2, Download, Clock, HardDrive, AlertCircle, CheckCircle2, ShieldAlert, TextCursorInput } from 'lucide-react';
import { CompileResponse } from '../types';
import { parseJavaErrors } from '../utils/errorParser';

interface OutputPanelProps {
  response: CompileResponse | null;
  isRunning: boolean;
  stdinInput: string;
  onStdinChange: (val: string) => void;
  onClear: () => void;
  onDownloadCode: () => void;
  theme?: 'dark' | 'light';
  onSelectErrorLine?: (line: number, col?: number) => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  response,
  isRunning,
  stdinInput,
  onStdinChange,
  onClear,
  onDownloadCode,
  theme = 'dark',
  onSelectErrorLine,
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'output' | 'stdin'>('output');
  const [copied, setCopied] = useState(false);

  const parsedErrors = parseJavaErrors(response?.error || '');

  // Auto-switch to output when execution starts
  useEffect(() => {
    if (isRunning) {
      setActiveTab('output');
    }
  }, [isRunning]);

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

  const hasStdin = Boolean(stdinInput && stdinInput.trim());

  return (
    <div className={`flex flex-col h-full border rounded-lg overflow-hidden transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Panel Header */}
      <div className={`h-11 border-b px-2.5 sm:px-3 flex items-center justify-between gap-2 select-none transition-colors ${
        isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
              activeTab === 'output'
                ? isDark
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'bg-white text-cyan-700 border border-slate-300 shadow-sm'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-500" />
            <span>Output</span>

            {/* Status Badge */}
            {isRunning ? (
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            ) : response ? (
              <span
                className={`w-2 h-2 rounded-full ${
                  response.status === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : response.status === 'COMPILATION_ERROR'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            ) : null}
          </button>
        </div>

        {/* Telemetry Stats & Action Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'output' && response && !isRunning && (
            <div className={`hidden md:flex items-center gap-2 text-[11px] font-mono ${
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
            {activeTab === 'output' && response && (
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
                    <span className="hidden sm:inline text-[10px]">Copy</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onDownloadCode}
              className={`p-1 rounded transition cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Download Main.java"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {activeTab === 'output' && response && (
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

            {activeTab === 'stdin' && hasStdin && (
              <button
                onClick={() => onStdinChange('')}
                className={`p-1 rounded transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-200'
                }`}
                title="Clear STDIN Input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: Output Terminal Display */}
      {activeTab === 'output' && (
        <div className={`flex-1 min-h-0 p-3 font-mono text-xs overflow-auto leading-relaxed selection:bg-blue-600 selection:text-white transition-colors ${
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
                <div className="space-y-2">
                  <div className="bg-rose-950/40 border border-rose-900/60 rounded p-3 text-rose-300 whitespace-pre-wrap font-mono">
                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center justify-between font-mono border-b border-rose-900/40 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {response.status === 'COMPILATION_ERROR' ? 'Compilation Error' : 'Runtime Error'}
                      </span>
                      {parsedErrors.length > 0 && (
                        <div className="flex items-center gap-1.5 font-normal normal-case">
                          <span className="text-[10px] text-slate-400">Jump:</span>
                          {parsedErrors.map((err, idx) => (
                            <button
                              key={idx}
                              onClick={() => onSelectErrorLine?.(err.line, err.column)}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-slate-500 transition cursor-pointer"
                              title={`Jump to line ${err.line} in editor`}
                            >
                              Line {err.line} ↗
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {response.error}
                  </div>

                  {/* Diagnostic: NoSuchElementException (Missing STDIN) */}
                  {response.error.includes('NoSuchElementException') && (
                    <div className="p-3 bg-amber-950/40 border border-amber-600/60 rounded-lg text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md font-sans">
                      <div className="flex items-start gap-2.5">
                        <TextCursorInput className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-300 text-xs">Standard Input (STDIN) Required</p>
                          <p className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
                            This program requires input from <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-200 font-mono text-[10px]">Scanner.nextLine()</code>, but no input was provided in the <strong>Input (STDIN)</strong> tab.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('stdin')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition whitespace-nowrap cursor-pointer shrink-0 shadow flex items-center gap-1"
                      >
                        <TextCursorInput className="w-3.5 h-3.5" />
                        Open Input (STDIN) Tab
                      </button>
                    </div>
                  )}

                  {/* Diagnostic: HeadlessException (AWT/Swing GUI) */}
                  {response.error.includes('HeadlessException') && (
                    <div className="p-3 bg-blue-950/40 border border-blue-600/60 rounded-lg text-blue-200 text-xs flex flex-col items-start gap-2 shadow-md font-sans">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-300 text-xs">Desktop GUI Notice (Swing / AWT)</p>
                          <p className="text-[11px] text-blue-200/80 leading-relaxed mt-0.5">
                            Java Swing / AWT windows (<code className="bg-blue-900/60 px-1 py-0.5 rounded text-blue-200 font-mono text-[10px]">JFrame</code>, <code className="bg-blue-900/60 px-1 py-0.5 rounded text-blue-200 font-mono text-[10px]">JButton</code>) require a desktop screen (X11 Display), which is not available in headless cloud web runners. For online execution, use console I/O (<code className="bg-blue-900/60 px-1 py-0.5 rounded text-blue-200 font-mono text-[10px]">System.out</code> / <code className="bg-blue-900/60 px-1 py-0.5 rounded text-blue-200 font-mono text-[10px]">Scanner</code>). GUI applications can be run locally in desktop IDEs such as IntelliJ IDEA or Eclipse.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
              <p className="text-xs font-mono">Click "RUN" or press Ctrl+Enter to compile and run Java code.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Custom Input (STDIN) */}
      {activeTab === 'stdin' && (
        <div className={`flex-1 min-h-0 flex flex-col p-3 transition-colors ${
          isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'
        }`}>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <TextCursorInput className="w-4 h-4 text-amber-500" />
              Standard Input (System.in)
            </span>
            <span className="text-[11px] text-slate-400">
              Passed to Scanner / BufferedReader
            </span>
          </div>

          <textarea
            value={stdinInput}
            onChange={(e) => onStdinChange(e.target.value)}
            placeholder={`Enter input lines for your Java program here...\nExample:\n10 20\n30`}
            className={`flex-1 w-full p-2.5 rounded-lg border text-xs font-mono outline-none resize-none leading-relaxed transition-colors ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-amber-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 shadow-inner'
            }`}
          />

          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{stdinInput ? `${stdinInput.split('\n').length} lines • ${stdinInput.length} chars` : 'No input provided'}</span>
            <span className="italic">Auto-fed to System.in when you click RUN</span>
          </div>
        </div>
      )}
    </div>
  );
};
