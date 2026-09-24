import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { FileCode, Play, Square, Sparkles } from 'lucide-react';
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

const TARGET_KEYS = new Set(['x', 'X', 'v', 'V', 'z', 'Z', 's', 'S', 'd', 'D', 'r', 'R']);

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
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const hasMarkersRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Focus editor immediately on mount
    editor.focus();

    // Ensure the underlying hidden textarea has standard focus and input attributes
    const domNode = editor.getDomNode();
    const textarea = domNode?.querySelector('textarea.inputarea') as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.setAttribute('aria-label', 'Java Code Editor');
      textarea.setAttribute('autocapitalize', 'off');
      textarea.setAttribute('autocomplete', 'off');
      textarea.setAttribute('autocorrect', 'off');
      textarea.setAttribute('spellcheck', 'false');
      textarea.focus();
    }

    // Register Ctrl+Enter or Cmd+Enter to run code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });

    // Register Ctrl+R or Cmd+R to run code (preventing browser page reload)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      onRun();
    });

    // Register Ctrl+S or Cmd+S to prevent browser "Save Webpage As" dialog
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Benign save action: format document if available
      editor.getAction('editor.action.formatDocument')?.run();
    });

    // Register Ctrl+D or Cmd+D to select next matching word
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.getAction('editor.action.addSelectionToNextFindMatch')?.run();
    });

    // Ensure target keys (x, v, z, s, d, r) are typed even if an external extension called preventDefault
    editor.onKeyDown((e: any) => {
      const browserEvent = e.browserEvent as KeyboardEvent;
      if (!browserEvent) return;

      const isPlain = !browserEvent.ctrlKey && !browserEvent.metaKey && !browserEvent.altKey;

      if (isPlain && TARGET_KEYS.has(browserEvent.key)) {
        // If an extension or browser interceptor called preventDefault():
        // Monaco natively ignores keys with defaultPrevented === true!
        // We force-insert the character at the current cursor position.
        if (browserEvent.defaultPrevented) {
          editor.trigger('keyboard', 'type', { text: browserEvent.key });
        }
      }
    });
  };

  // Global window capture listener to protect editor focus from browser shortcuts and extensions
  useEffect(() => {
    const handleCaptureKeyDown = (e: KeyboardEvent) => {
      if (!editorRef.current) return;
      const editor = editorRef.current;
      const domNode = editor.getDomNode();
      if (!domNode) return;

      const isEditorActive =
        editor.hasTextFocus() ||
        domNode.contains(document.activeElement) ||
        document.activeElement === domNode ||
        containerRef.current?.contains(document.activeElement);

      if (!isEditorActive) return;

      // Prevent browser Ctrl+S (Save webpage)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return;
      }

      // Prevent browser Ctrl+R (Reload webpage) and trigger Run
      if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        onRun();
        return;
      }

      // If user is typing x, v, z, s, d, r plain keys, ensure textarea is focused
      const isPlain = !e.ctrlKey && !e.metaKey && !e.altKey;
      if (isPlain && TARGET_KEYS.has(e.key)) {
        const textarea = domNode.querySelector('textarea.inputarea') as HTMLTextAreaElement | null;
        if (textarea && document.activeElement !== textarea) {
          textarea.focus();
        }
      }
    };

    window.addEventListener('keydown', handleCaptureKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleCaptureKeyDown, { capture: true });
    };
  }, [onRun]);

  // Only jump when user explicitly clicks an error link in the output panel
  useEffect(() => {
    if (targetLine && targetLine.line > 0 && editorRef.current) {
      const editor = editorRef.current;
      editor.revealLineInCenter(targetLine.line);
      editor.setPosition({ lineNumber: targetLine.line, column: targetLine.col || 1 });
      editor.focus();
    }
  }, [targetLine]);

  // Set subtle native Monaco markers (standard squiggly line under error, NO whole line coloring)
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    if (!errors || errors.length === 0) {
      if (hasMarkersRef.current) {
        monaco.editor.setModelMarkers(model, 'java-diagnostics', []);
        hasMarkersRef.current = false;
      }
      return;
    }

    // Standard native squiggly underline with tooltip
    const markers = errors.map((err) => {
      const lineContent = model.getLineContent(err.line) || '';
      const startCol = Math.max(1, Math.min(err.column || 1, lineContent.length + 1));
      const endCol = Math.max(startCol + 1, lineContent.length + 1);

      return {
        startLineNumber: err.line,
        startColumn: startCol,
        endLineNumber: err.line,
        endColumn: endCol,
        message: err.message,
        severity: monaco.MarkerSeverity.Error,
        source: 'javac',
      };
    });

    monaco.editor.setModelMarkers(model, 'java-diagnostics', markers);
    hasMarkersRef.current = true;
  }, [errors]);

  const handleCodeChange = (newVal: string | undefined) => {
    const val = newVal ?? '';
    // Clear markers when user starts editing so old errors don't linger
    if (hasMarkersRef.current) {
      hasMarkersRef.current = false;
      if (monacoRef.current && editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monacoRef.current.editor.setModelMarkers(model, 'java-diagnostics', []);
        }
      }
    }
    onChange(val);
  };

  const linesCount = code.split('\n').length;
  const charCount = code.length;

  // Dynamically detect file name from public class or first class
  const pubMatch = code.match(/public\s+(?:final\s+|abstract\s+)?(?:class|interface|enum|record)\s+([A-Za-z0-9_$]+)/);
  const classMatch = code.match(/(?:public\s+|final\s+|abstract\s+)*class\s+([A-Za-z0-9_$]+)/);
  const detectedFileName = `${pubMatch ? pubMatch[1] : (classMatch ? classMatch[1] : 'Main')}.java`;

  // Detect missing imports (e.g. ArrayList, Scanner, HashMap, File, etc.)
  const missingImports = findMissingImports(code);

  const handleAutoImport = () => {
    const { updatedCode, addedImports } = applyAutoImportsToCode(code);
    if (addedImports.length > 0) {
      onChange(updatedCode);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col border rounded-lg overflow-hidden h-full w-full transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
      onClick={() => {
        if (editorRef.current && !editorRef.current.hasTextFocus()) {
          editorRef.current.focus();
        }
      }}
    >
      {/* Editor Tab & Main Toolbar Header */}
      <div className={`h-11 border-b px-3 flex items-center justify-between gap-2 transition-colors ${
        isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-t text-xs font-mono font-medium ${
            isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-slate-300 text-amber-600'
          }`}>
            <FileCode className="w-4 h-4 text-amber-500" />
            <span>{detectedFileName}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <span className={`text-[11px] font-mono hidden md:inline ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {linesCount} lines • {charCount} chars
          </span>
        </div>

        {/* Action Controls & Run Button */}
        <div className="flex items-center gap-2">
          {/* Auto-Import Button if missing imports detected */}
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
              <span>Auto Import ({missingImports.length})</span>
            </button>
          )}

          {!isRunning ? (
            <button
              onClick={onRun}
              className="group relative inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs sm:text-sm rounded-md shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-500/30 hover:ring-emerald-400/50 active:scale-95 hover:scale-[1.02] transition-all cursor-pointer"
              title="Run Java Code (Ctrl + Enter / Ctrl + R)"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span className="uppercase tracking-wider">Run</span>
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
      <div className={`flex-1 min-h-0 relative select-text ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
        <Editor
          height="100%"
          defaultLanguage="java"
          theme={isDark ? 'vs-dark' : 'vs'}
          value={code}
          onChange={handleCodeChange}
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
            formatOnType: false,
            formatOnPaste: false,
            readOnly: false,
            domReadOnly: false,
            padding: { top: 10, bottom: 10 },
          }}
        />
      </div>
    </div>
  );
};
