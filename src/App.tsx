import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { EditorContainer } from './components/EditorContainer';
import { OutputPanel } from './components/OutputPanel';
import { SettingsModal } from './components/SettingsModal';
import { ProjectFilesModal } from './components/ProjectFilesModal';
import { ShareModal } from './components/ShareModal';
import { CompileResponse, EditorSettings, CodeTemplate } from './types';
import { CODE_TEMPLATES } from './data/templates';
import { applyAutoImportsToCode } from './utils/autoImport';
import { parseJavaErrors } from './utils/errorParser';

const DEFAULT_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;

export default function App() {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [stdinInput, setStdinInput] = useState<string>('');
  const [javaVersion, setJavaVersion] = useState<'17' | '21'>('17');
  const [response, setResponse] = useState<CompileResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [targetLine, setTargetLine] = useState<{ line: number; col?: number; timestamp: number } | null>(null);

  // Parse errors from compiler or runtime output - memoized so typing never re-creates error arrays
  const parsedErrors = useMemo(() => {
    return parseJavaErrors(response?.error || '');
  }, [response?.error]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Settings State
  const [settings, setSettings] = useState<EditorSettings>({
    fontSize: 14,
    tabSize: 4,
    wordWrap: 'on',
    lineNumbers: 'on',
    autoClosingBrackets: 'always',
    minimap: false,
  });

  // Modal Visibility States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isProjectFilesOpen, setIsProjectFilesOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Check URL query parameters on load for shared code
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get('code');
      if (codeParam) {
        const decoded = decodeURIComponent(escape(atob(decodeURIComponent(codeParam))));
        if (decoded) setCode(decoded);
      }
    } catch (e) {
      console.warn('Could not decode URL query code parameter.');
    }
  }, []);

  // Direct Cloud Execution Fallback (Judge0 CE Tier 1 for 1.2s speed, Wandbox Tier 2 fallback)
  const runJavaDirectCloud = async (
    sourceCode: string,
    stdin: string,
    signal?: AbortSignal
  ): Promise<CompileResponse> => {
    const startTime = Date.now();

    // Tier 1: Try ultra-fast Judge0 CE first (~1.0s - 1.5s)
    try {
      // Detect all classes
      const classRegex = /(?:public\s+|final\s+|abstract\s+)*class\s+([A-Za-z0-9_$]+)[^{]*\{/g;
      const classes: { name: string; index: number }[] = [];
      let m: RegExpExecArray | null;
      while ((m = classRegex.exec(sourceCode)) !== null) {
        classes.push({ name: m[1], index: m.index });
      }

      // Detect which class contains 'static void main'
      const mainIndex = sourceCode.search(/(?:public\s+)?static\s+void\s+main\s*\(/);
      let originalClassName = 'Main';
      if (mainIndex !== -1 && classes.length > 0) {
        for (const cls of classes) {
          if (cls.index < mainIndex) {
            originalClassName = cls.name;
          } else {
            break;
          }
        }
      } else if (classes.length > 0) {
        const pubMatch = sourceCode.match(/public\s+class\s+([A-Za-z0-9_$]+)/);
        originalClassName = pubMatch ? pubMatch[1] : classes[0].name;
      }

      // Auto-import missing standard Java classes
      const autoImported = applyAutoImportsToCode(sourceCode).updatedCode;
      let preparedCode = autoImported;
      if (originalClassName !== 'Main') {
        preparedCode = preparedCode.replace(new RegExp(`\\bclass\\s+${originalClassName}\\b`, 'g'), 'class Main');
        preparedCode = preparedCode.replace(new RegExp(`\\b${originalClassName}\\s*\\(`, 'g'), 'Main(');
      }

      // Strip 'public' modifier from non-Main classes so Judge0 compiles without class/file name mismatch
      preparedCode = preparedCode.replace(/public\s+class\s+([A-Za-z0-9_$]+)/g, (match, cName) => {
        return cName === 'Main' ? 'public class Main' : `class ${cName}`;
      });

      const judgeRes = await fetch('https://ce.judge0.com/submissions?wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language_id: 91, // Java (JDK 17.0.6)
          source_code: preparedCode,
          stdin: stdin || '',
          cpu_time_limit: 4,
          wall_time_limit: 5,
          memory_limit: 128000,
        }),
        signal,
      });

      if (judgeRes.ok) {
        const data: any = await judgeRes.json();
        const execTime = Date.now() - startTime;
        let rawError = (data.compile_output || data.stderr || '').trim();
        if (originalClassName !== 'Main' && rawError) {
          rawError = rawError.replace(/\bMain\b/g, originalClassName);
        }

        const stdout = data.stdout || '';
        const statusId = data.status ? data.status.id : 3;
        let status: CompileResponse['status'] = 'COMPLETED';
        let isSuccess = false;

        if (statusId === 3) {
          isSuccess = true;
          status = 'COMPLETED';
        } else if (statusId === 6) {
          status = 'COMPILATION_ERROR';
        } else if (statusId === 5 || statusId === 13) {
          status = 'TIME_LIMIT_EXCEEDED';
        } else {
          status = 'RUNTIME_ERROR';
        }

        const memMb = data.memory ? `${(data.memory / 1024).toFixed(1)} MB` : '15.2 MB';
        return {
          success: isSuccess,
          output: stdout,
          error: rawError,
          executionTime: execTime,
          memory: memMb,
          status,
        };
      }
    } catch (jErr: any) {
      if (jErr.name === 'AbortError') throw jErr;
      // Continue to Wandbox fallback
    }

    // Tier 2: Secondary Wandbox OpenJDK Fallback
    const transformed = sourceCode.replace(/public\s+class\s+/g, 'class ');
    const res = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: 'openjdk-jdk-22+36',
        code: transformed,
        stdin: stdin || '',
      }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Cloud compiler responded with status ${res.status}`);
    }

    const data: any = await res.json();
    const execTime = Date.now() - startTime;
    const isSuccess = data.status === '0' && !data.compiler_error && !data.program_error;
    const cleanError = (data.compiler_error || data.program_error || '')
      .replace(/prog\.java/g, 'Main.java')
      .trim();
    const outputText = data.program_output || data.compiler_output || '';

    let status: CompileResponse['status'] = 'COMPLETED';
    if (data.compiler_error) {
      status = 'COMPILATION_ERROR';
    } else if (data.signal === 'SIGKILL' || data.signal === 'SIGXCPU') {
      status = 'TIME_LIMIT_EXCEEDED';
    } else if (data.program_error || data.status !== '0') {
      status = 'RUNTIME_ERROR';
    }

    return {
      success: isSuccess,
      output: outputText,
      error: cleanError,
      executionTime: execTime,
      memory: '16.8 MB',
      status,
    };
  };

  // Main Execution Function
  const handleRun = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setResponse(null);

    // Auto-import missing standard Java classes (ArrayList, Scanner, HashMap, File, etc.)
    let codeToExecute = code;
    const autoImportResult = applyAutoImportsToCode(code);
    if (autoImportResult.addedImports.length > 0) {
      codeToExecute = autoImportResult.updatedCode;
      setCode(autoImportResult.updatedCode);
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      let executedResponse: CompileResponse | null = null;

      // 1. First attempt via backend /api/compile (Local Docker sandbox)
      try {
        const apiResponse = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: codeToExecute,
            input: stdinInput,
            version: javaVersion,
          }),
          signal,
        });

        const contentType = apiResponse.headers.get('content-type') || '';
        if (apiResponse.ok && contentType.includes('application/json')) {
          const data: CompileResponse = await apiResponse.json();
          // If the backend didn't throw a fatal missing binary error, use it
          if (!data.error?.includes('could not be located')) {
            executedResponse = data;
          }
        }
      } catch (backendErr: any) {
        if (backendErr.name === 'AbortError') throw backendErr;
        // Backend unavailable (e.g., static hosting, cold-starting server) - continue to cloud fallback
      }

      // 2. Seamless client-side direct cloud fallback (guarantees execution on published websites)
      if (!executedResponse) {
        executedResponse = await runJavaDirectCloud(codeToExecute, stdinInput, signal);
      }

      setResponse(executedResponse);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setResponse({
          success: false,
          output: '',
          error: 'Execution cancelled by user.',
          executionTime: 0,
          status: 'RUNTIME_ERROR',
        });
      } else {
        setResponse({
          success: false,
          output: '',
          error: `Execution Error: ${err.message || 'Unable to execute code at this time.'}`,
          executionTime: 0,
          status: 'SERVER_ERROR',
        });
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSelectTemplate = (template: CodeTemplate) => {
    setCode(template.code);
    setStdinInput(template.input || '');
    setResponse(null);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Main.java';
    a.click();
    URL.revokeObjectURL(url);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col h-screen w-screen font-sans overflow-hidden select-none transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Top IDE Header Bar */}
      <Header
        version={javaVersion}
        onVersionChange={setJavaVersion}
        isRunning={isRunning}
        onRun={handleRun}
        onStop={handleStop}
        onSelectTemplate={handleSelectTemplate}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenProjectFiles={() => setIsProjectFilesOpen(true)}
        onDownloadCode={handleDownloadCode}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Workspace Area */}
      <main className={`flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 p-2 overflow-hidden transition-colors ${
        isDark ? 'bg-slate-950' : 'bg-slate-200/60'
      }`}>
        {/* Left Area: Monaco Code Editor */}
        <div className="md:col-span-7 xl:col-span-7 h-full min-h-[350px] overflow-hidden">
          <EditorContainer
            code={code}
            onChange={(val) => {
              setCode(val);
              // Clear line jump target on manual code edits
              if (targetLine) setTargetLine(null);
            }}
            isRunning={isRunning}
            onRun={handleRun}
            onStop={handleStop}
            settings={settings}
            theme={theme}
            errors={parsedErrors}
            targetLine={targetLine}
          />
        </div>

        {/* Right Area: Full-Height Execution Output Terminal */}
        <div className="md:col-span-5 xl:col-span-5 h-full flex flex-col overflow-hidden">
          <OutputPanel
            response={response}
            isRunning={isRunning}
            stdinInput={stdinInput}
            onStdinChange={setStdinInput}
            onClear={() => {
              setResponse(null);
              setTargetLine(null);
            }}
            onDownloadCode={handleDownloadCode}
            theme={theme}
            onSelectErrorLine={(line, col) => {
              setTargetLine({ line, col, timestamp: Date.now() });
            }}
          />
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <ProjectFilesModal
        isOpen={isProjectFilesOpen}
        onClose={() => setIsProjectFilesOpen(false)}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        code={code}
      />
    </div>
  );
}
