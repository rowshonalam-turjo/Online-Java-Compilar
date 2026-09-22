import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { EditorContainer } from './components/EditorContainer';
import { OutputPanel } from './components/OutputPanel';
import { SettingsModal } from './components/SettingsModal';
import { ProjectFilesModal } from './components/ProjectFilesModal';
import { ShareModal } from './components/ShareModal';
import { CompileResponse, EditorSettings, CodeTemplate } from './types';
import { CODE_TEMPLATES } from './data/templates';

const DEFAULT_CODE = `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        
        System.out.println("Original Array: " + Arrays.toString(arr));
        
        // Bubble Sort
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
        
        System.out.println("Sorted Array:   " + Arrays.toString(arr));
    }
}`;

export default function App() {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [javaVersion, setJavaVersion] = useState<'17' | '21'>('17');
  const [response, setResponse] = useState<CompileResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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

  // Main Execution Function
  const handleRun = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setResponse(null);

    abortControllerRef.current = new AbortController();

    try {
      const apiResponse = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          version: javaVersion,
        }),
        signal: abortControllerRef.current.signal,
      });

      const data: CompileResponse = await apiResponse.json();
      setResponse(data);
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
          error: `Network Error: Unable to connect to backend compilation API.\n${err.message}`,
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
            onChange={setCode}
            isRunning={isRunning}
            onRun={handleRun}
            onStop={handleStop}
            settings={settings}
            theme={theme}
          />
        </div>

        {/* Right Area: Full-Height Execution Output Terminal */}
        <div className="md:col-span-5 xl:col-span-5 h-full flex flex-col overflow-hidden">
          <OutputPanel
            response={response}
            isRunning={isRunning}
            onClear={() => setResponse(null)}
            onDownloadCode={handleDownloadCode}
            theme={theme}
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
