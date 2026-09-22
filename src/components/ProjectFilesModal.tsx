import React, { useState } from 'react';
import { X, FolderTree, Copy, Check, Download, FileCode, Terminal, ExternalLink, ShieldCheck, Github } from 'lucide-react';
import { GENERATED_PROJECT_FILES } from '../data/generatedProjectFiles';
import { ProjectFile } from '../types';

interface ProjectFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectFilesModal: React.FC<ProjectFilesModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(GENERATED_PROJECT_FILES[0]);
  const [activeTab, setActiveTab] = useState<'files' | 'deploy'>('files');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadFile = () => {
    const filename = selectedFile.path.split('/').pop() || 'file.txt';
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                Spring Boot & Docker Project Generator
              </h3>
              <p className="text-xs text-slate-400">Complete source files & deployment guide for Java Online Compiler</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'files' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" /> Source Files ({GENERATED_PROJECT_FILES.length})
            </button>
            <button
              onClick={() => setActiveTab('deploy')}
              className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'deploy' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Github className="w-3.5 h-3.5" /> GitHub & Deploy Guide
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {activeTab === 'files' ? (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Left Sidebar: File Tree */}
            <div className="md:col-span-4 lg:col-span-3 border-r border-slate-800 bg-slate-950/60 overflow-y-auto p-3 space-y-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">Project File Explorer</div>

              {['frontend', 'backend', 'docker', 'config', 'docs'].map((cat) => {
                const categoryFiles = GENERATED_PROJECT_FILES.filter((f) => f.category === cat);
                if (categoryFiles.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="text-xs font-semibold text-slate-400 capitalize px-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {cat}
                    </div>
                    {categoryFiles.map((f) => (
                      <button
                        key={f.path}
                        onClick={() => setSelectedFile(f)}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition flex items-center justify-between cursor-pointer ${
                          selectedFile.path === f.path
                            ? 'bg-blue-950 text-blue-300 border border-blue-800 font-semibold'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{f.path.split('/').pop()}</span>
                        <span className="text-[9px] text-slate-600 font-sans ml-1">{f.category}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Right Main Area: Code Previewer */}
            <div className="md:col-span-8 lg:col-span-9 flex flex-col bg-slate-900 overflow-hidden">
              <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <span className="text-blue-400">FILE:</span>
                  <span className="font-bold text-slate-100">{selectedFile.path}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy File'}</span>
                  </button>

                  <button
                    onClick={handleDownloadFile}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-[#1e1e1e] p-4 overflow-auto font-mono text-xs leading-relaxed text-slate-200">
                <pre>{selectedFile.content}</pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-slate-300 text-sm">
            {/* Guide Section 1: Local Test */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                1. Local Development Commands
              </h4>
              <p className="text-xs text-slate-400">Run the frontend and backend locally with full hot reload.</p>
              <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs space-y-2 border border-slate-800 text-emerald-300">
                <div># Terminal 1: Start Frontend (React + Vite)</div>
                <div className="text-slate-100">cd frontend && npm install && npm run dev</div>
                <div className="pt-2 text-emerald-300"># Terminal 2: Start Backend (Spring Boot)</div>
                <div className="text-slate-100">cd backend && mvn spring-boot:run</div>
                <div className="pt-2 text-emerald-300"># Terminal 3: Build Docker Sandbox Runner</div>
                <div className="text-slate-100">cd docker && docker build -t java-runner .</div>
              </div>
            </div>

            {/* Guide Section 2: GitHub Push */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Github className="w-5 h-5 text-blue-400" />
                2. Upload to GitHub
              </h4>
              <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs space-y-1 border border-slate-800 text-blue-300">
                <div>git init</div>
                <div>git add .</div>
                <div>git commit -m "Initial commit - Java Online Compiler"</div>
                <div>git branch -M main</div>
                <div>git remote add origin https://github.com/YOUR_USERNAME/java-online-compiler.git</div>
                <div>git push -u origin main</div>
              </div>
            </div>

            {/* Guide Section 3: Vercel & Cloud Deploy */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-amber-400" />
                3. Deployment Strategy (Vercel + Railway / Docker Host)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200">Frontend → Vercel</div>
                  <p className="text-slate-400">Import GitHub repo to Vercel, set Root Directory to <code className="text-amber-400">frontend</code>, and set environment variable <code className="text-amber-400">VITE_API_BASE_URL</code> to your backend URL.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200">Backend → Railway / Render / AWS</div>
                  <p className="text-slate-400">Deploy Spring Boot backend with Docker runtime enabled. Ensure <code className="text-amber-400">APP_USE_DOCKER=true</code> for containerized sandbox execution.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
