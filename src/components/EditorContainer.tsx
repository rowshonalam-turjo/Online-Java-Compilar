import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { FileCode, Play, Square } from 'lucide-react';
import { EditorSettings } from '../types';

interface EditorContainerProps {
  code: string;
  onChange: (value: string) => void;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  settings: EditorSettings;
  theme?: 'dark' | 'light';
}

export const EditorContainer: React.FC<EditorContainerProps> = ({
  code,
  onChange,
  isRunning,
  onRun,
  onStop,
  settings,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register Ctrl+Enter or Cmd+Enter to run code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });
  };

  const linesCount = code.split('\n').length;
  const charCount = code.length;

  return (
    <div className={`flex flex-col border rounded-lg overflow-hidden h-full w-full transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Editor Tab & Toolbar Header */}
      <div className={`h-11 border-b px-3 flex items-center justify-between gap-2 select-none transition-colors ${
        isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-t text-xs font-mono font-medium ${
            isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-slate-300 text-amber-600'
          }`}>
            <FileCode className="w-4 h-4 text-amber-500" />
            <span>Main.java</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className={`text-[11px] font-mono hidden sm:inline ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {linesCount} lines • {charCount} chars
          </span>
        </div>

        {/* Prominent & Highly Visible RUN Button */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={onRun}
              className="group relative inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs sm:text-sm rounded-md shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-500/30 hover:ring-emerald-400/50 active:scale-95 hover:scale-[1.02] transition-all cursor-pointer"
              title="Run Java Code (Ctrl + Enter)"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span className="uppercase tracking-wider">Run</span>
              <span className="hidden sm:inline-block text-[10px] bg-emerald-950/80 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-400/40 font-mono font-semibold">
                Ctrl+Enter
              </span>
            </button>
          ) : (
            <button
              onClick={onStop}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm rounded-md shadow-lg shadow-rose-950/60 ring-2 ring-rose-500/30 active:scale-95 transition-all cursor-pointer animate-pulse"
              title="Stop Execution"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="uppercase tracking-wider">Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor Mount Area */}
      <div className={`flex-1 relative ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
        <Editor
          height="100%"
          defaultLanguage="java"
          theme={isDark ? 'vs-dark' : 'vs'}
          value={code}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: settings.fontSize,
            tabSize: settings.tabSize,
            wordWrap: settings.wordWrap,
            lineNumbers: settings.lineNumbers,
            autoClosingBrackets: settings.autoClosingBrackets,
            minimap: { enabled: settings.minimap },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: { enabled: true },
            formatOnType: true,
            formatOnPaste: true,
            padding: { top: 10, bottom: 10 },
          }}
        />
      </div>
    </div>
  );
};
