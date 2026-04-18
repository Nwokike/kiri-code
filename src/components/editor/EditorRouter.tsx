import React, { useEffect, useState, useRef, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import CodeMirror from '@uiw/react-codemirror';
import { getWebContainer } from '../../lib/services/webcontainer';
import { runtimeRouter } from '../../lib/services/RuntimeRouter';
import { X, Play, Sparkles, FolderTree, GitBranch, MessageSquare, Monitor, Keyboard, Zap, Globe, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';

interface OpenFile {
  path: string;
  content: string;
  modified: boolean;
}

const EditorRouter: React.FC = () => {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFile = activeIndex >= 0 ? openFiles[activeIndex] : null;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for file open events from FileTree or Agent
  useEffect(() => {
    const handleOpenFile = async (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string }>;
      const { path } = customEvent.detail;

      // If file is already open, just switch to it
      const existingIndex = openFiles.findIndex(f => f.path === path);
      if (existingIndex >= 0) {
        setActiveIndex(existingIndex);
        return;
      }
      
      try {
        const wc = await getWebContainer();
        const content = await wc.fs.readFile(path, 'utf8');
        setOpenFiles(prev => [...prev, { path, content, modified: false }]);
        setActiveIndex(openFiles.length); // will be the new last index
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    };

    window.addEventListener('kiri:open-file', handleOpenFile);
    return () => window.removeEventListener('kiri:open-file', handleOpenFile);
  }, [openFiles]);

  // Broadcast current file info for the status bar
  useEffect(() => {
    if (activeFile) {
      window.dispatchEvent(new CustomEvent('kiri:editor-status', {
        detail: {
          fileName: activeFile.path,
          language: getLanguage(activeFile.path),
          modified: activeFile.modified,
        }
      }));
    }
  }, [activeFile?.path, activeFile?.modified]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    const content = value || '';
    if (activeIndex < 0) return;

    setOpenFiles(prev => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], content, modified: true };
      return next;
    });

    const currentPath = openFiles[activeIndex]?.path;
    if (currentPath) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const wc = await getWebContainer();
          await wc.fs.writeFile(currentPath, content);
          setOpenFiles(prev => {
            const next = [...prev];
            const idx = next.findIndex(f => f.path === currentPath);
            if (idx >= 0) next[idx] = { ...next[idx], modified: false };
            return next;
          });
          window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 800);
    }
  }, [activeIndex, openFiles]);

  const handleRunFile = async () => {
    if (!activeFile) return;
    setIsRunning(true);
    try {
      await runtimeRouter.executeFile(activeFile.path, activeFile.content);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setOpenFiles(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    // Adjust active index
    if (index === activeIndex) {
      setActiveIndex(Math.max(0, index - 1));
    } else if (index < activeIndex) {
      setActiveIndex(activeIndex - 1);
    }
    if (openFiles.length <= 1) {
      setActiveIndex(-1);
    }
  };

  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': case 'jsx': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'php': return 'php';
      case 'rb': return 'ruby';
      case 'sql': return 'sql';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'yaml': case 'yml': return 'yaml';
      case 'sh': case 'bash': return 'shell';
      default: return 'plaintext';
    }
  };

  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': case 'tsx': return '🔷';
      case 'js': case 'jsx': return '🟡';
      case 'css': case 'scss': return '🟣';
      case 'html': return '🟠';
      case 'json': return '📋';
      case 'py': return '🐍';
      case 'md': return '📝';
      default: return '📄';
    }
  };

  // === WELCOME SCREEN (no files open) ===
  if (openFiles.length === 0 || activeIndex < 0) {
    return (
      <div className="welcome-screen">
        {/* Background effects */}
        <div className="welcome-grid-bg" />
        <div className="welcome-radial-glow" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
          {/* Logo + Badge */}
          <div className="mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--kiri-green)]/10 border border-[var(--kiri-green)]/20">
              <Zap size={12} className="text-[var(--kiri-green)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--kiri-green)]">Serverless IDE</span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight text-center">
            Kiri <span className="text-gradient">Code</span>
          </h1>
          <p className="text-sm text-[var(--kiri-muted)] mb-8 text-center max-w-sm leading-relaxed">
            Build, run, and deploy full-stack apps entirely in your browser.
            Powered by AI and WebContainers.
          </p>

          {/* Navigation Guide Cards */}
          <div className="w-full space-y-3 mb-8">
            {/* Left Panel Card */}
            <div className="welcome-card">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <ChevronLeft size={18} className="text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                  Click Left
                  <span className="text-[10px] font-normal text-[var(--kiri-muted)]">Activity Bar</span>
                </h3>
                <p className="text-[11px] text-[var(--kiri-muted)] leading-relaxed">
                  Expand the <span className="text-white font-medium inline-flex items-center gap-1"><FolderTree size={11}/> File Explorer</span> to browse & manage your project files, 
                  or the <span className="text-white font-medium inline-flex items-center gap-1"><GitBranch size={11}/> Git panel</span> to clone repos and push commits to GitHub.
                </p>
              </div>
            </div>

            {/* Right Panel Card */}
            <div className="welcome-card">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ChevronRightIcon size={18} className="text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                  Click Right
                  <span className="text-[10px] font-normal text-[var(--kiri-muted)]">AI Agent</span>
                </h3>
                <p className="text-[11px] text-[var(--kiri-muted)] leading-relaxed">
                  Open the <span className="text-white font-medium inline-flex items-center gap-1"><MessageSquare size={11}/> AI Agent</span> panel to talk to your coding assistant. 
                  It can write code, create files, install packages, and run terminal commands.
                </p>
              </div>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[
              { icon: <Globe size={11} />, label: 'Zero Backend' },
              { icon: <Sparkles size={11} />, label: '20+ AI Models' },
              { icon: <Monitor size={11} />, label: 'Live Preview' },
              { icon: <Keyboard size={11} />, label: 'Ctrl+B / Ctrl+L' },
            ].map((feature, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffffff06] border border-[#ffffff08] text-[10px] text-[var(--kiri-muted)]">
                {feature.icon}
                {feature.label}
              </div>
            ))}
          </div>

          {/* Quick start hint */}
          <div className="text-center">
            <p className="text-[11px] text-[var(--kiri-muted)] opacity-60">
              Select a file from the explorer or ask the AI Agent to create one
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === EDITOR WITH TABS ===
  return (
    <div className="h-full w-full flex flex-col bg-[var(--kiri-bg)]">
      {/* Tab Bar */}
      <div className="tab-bar">
        {openFiles.map((file, idx) => (
          <div
            key={file.path}
            onClick={() => setActiveIndex(idx)}
            className={`tab-item ${idx === activeIndex ? 'active' : ''}`}
          >
            <span className="text-[11px]">{getFileIcon(file.path)}</span>
            <span className="truncate max-w-[120px]">{file.path.split('/').pop()}</span>
            {file.modified && <div className="modified-dot" />}
            <button
              onClick={(e) => handleCloseTab(e, idx)}
              className="tab-close"
              title="Close"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        {/* Run button in the tab bar (right side) */}
        <div className="ml-auto flex items-center px-2 shrink-0">
          <button 
            onClick={handleRunFile}
            disabled={isRunning || !activeFile}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--kiri-green)]/10 text-[var(--kiri-green)] hover:bg-[var(--kiri-green)] hover:text-white border border-[var(--kiri-green)]/20 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <Play size={10} fill="currentColor" />
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>
      
      {/* Editor Area */}
      <div className="flex-1 overflow-hidden relative">
        {isMobile ? (
          <CodeMirror
            value={activeFile?.content || ''}
            height="100%"
            theme="dark"
            onChange={handleEditorChange}
            className="h-full text-xs"
          />
        ) : (
          <MonacoEditor
            height="100%"
            language={activeFile ? getLanguage(activeFile.path) : 'plaintext'}
            theme="vs-dark"
            value={activeFile?.content || ''}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: '"JetBrains Mono", monospace',
              wordWrap: 'on',
              padding: { top: 16 },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'gutter',
              scrollBeyondLastLine: false,
              bracketPairColorization: { enabled: true },
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EditorRouter;
