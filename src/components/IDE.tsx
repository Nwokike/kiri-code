import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from './workbench/terminal/Terminal';
import { getWebContainer } from '../lib/services/webcontainer';
import { terminalEmitter } from '../lib/services/terminalEmitter';
import Chat from './workbench/Chat';
import FileTree from './workbench/FileTree';
import EditorRouter from './editor/EditorRouter';
import { SettingsModal } from './workbench/SettingsModal';
import GitHubManager from './workbench/GitHubManager';
import { 
  Settings, Terminal as TerminalIcon, FolderTree, GitBranch, MessageSquare, 
  X, Globe, RefreshCw, Smartphone, Tablet, Monitor,
  ExternalLink, ChevronUp, ChevronDown, Zap
} from 'lucide-react';

const IDE: React.FC = () => {
  const terminalRef = useRef<any>(null);
  const shellSpawned = useRef(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'files' | 'github'>('files');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Preview panel state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Status bar state
  const [editorStatus, setEditorStatus] = useState<{
    fileName: string;
    language: string;
    modified: boolean;
  } | null>(null);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On desktop, open panels by default
      if (!mobile) {
        setIsLeftPanelOpen(true);
        setIsRightPanelOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for editor status updates (from EditorRouter)
  useEffect(() => {
    const handleEditorStatus = (e: Event) => {
      const custom = e as CustomEvent;
      setEditorStatus(custom.detail);
    };
    window.addEventListener('kiri:editor-status', handleEditorStatus);
    return () => window.removeEventListener('kiri:editor-status', handleEditorStatus);
  }, []);

  // Listen for WebContainer server-ready events to auto-open preview
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function listenForServer() {
      try {
        const wc = await getWebContainer();
        wc.on('server-ready', (_port: number, url: string) => {
          setPreviewUrl(url);
          setIsPreviewOpen(true);
        });
      } catch (e) {
        // WebContainer not available
      }
    }

    listenForServer();
    return () => cleanup?.();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'b') {
        e.preventDefault();
        setIsLeftPanelOpen(prev => !prev);
      }
      if (ctrl && e.key === 'l') {
        e.preventDefault();
        setIsRightPanelOpen(prev => !prev);
      }
      if (ctrl && e.key === 'j') {
        e.preventDefault();
        setIsBottomPanelOpen(prev => !prev);
      }
      // Escape closes overlays on mobile
      if (e.key === 'Escape' && isMobile) {
        setIsLeftPanelOpen(false);
        setIsRightPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  // Manage body scroll when overlay is open on mobile
  useEffect(() => {
    if (isMobile && (isLeftPanelOpen || isRightPanelOpen)) {
      document.body.classList.add('overlay-open');
    } else {
      document.body.classList.remove('overlay-open');
    }
    return () => document.body.classList.remove('overlay-open');
  }, [isMobile, isLeftPanelOpen, isRightPanelOpen]);

  // Shell setup
  useEffect(() => {
    if (shellSpawned.current) return;
    shellSpawned.current = true;

    let unsubscribe: () => void;

    async function setupShell() {
      try {
        const webcontainer = await getWebContainer();
        
        const shellProcess = await webcontainer.spawn('jsh', {
          terminal: { cols: 80, rows: 24 },
        });

        setTimeout(() => {
          const terminal = terminalRef.current?.getTerminal();

          if (terminal) {
            const input = shellProcess.input.getWriter();
            terminal.onData((data: string) => {
              input.write(data);
            });

            shellProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  terminal.write(data);
                },
              })
            );

            unsubscribe = terminalEmitter.subscribe((data) => {
              terminal.write(data);
            });
          }
        }, 500);
      } catch (error: any) {
        console.error('[Terminal] Error spawning shell:', error);
        setTimeout(() => {
          const terminal = terminalRef.current?.getTerminal();
          if (terminal) {
            terminal.write('\r\n\x1b[31mError: Failed to start shell.\x1b[0m\r\n');
            if (error.message?.includes('SharedArrayBuffer') || error.toString().includes('SharedArrayBuffer')) {
              terminal.write('\x1b[33mCross-Origin Isolation failed. This is often caused by adblockers or strict browser privacy settings.\r\n');
              terminal.write('Please disable your adblocker for this site or open the app in a new tab.\x1b[0m\r\n');
            } else {
              terminal.write(`\x1b[31m${error.message || error}\x1b[0m\r\n`);
            }
          }
        }, 500);
      }
    }

    setupShell();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Panel toggle helpers
  const toggleLeftPanel = useCallback((tab: 'files' | 'github') => {
    if (activeLeftTab === tab && isLeftPanelOpen) {
      setIsLeftPanelOpen(false);
    } else {
      setActiveLeftTab(tab);
      setIsLeftPanelOpen(true);
    }
  }, [activeLeftTab, isLeftPanelOpen]);

  const previewWidth = previewMode === 'mobile' ? 'w-[375px]' : previewMode === 'tablet' ? 'w-[768px]' : 'w-full';

  // =============================================
  // LEFT PANEL CONTENT (used in both desktop + mobile overlay)
  // =============================================
  const LeftPanelContent = (
    <div className="flex flex-col h-full bg-[var(--kiri-bg)] w-full">
      <div className="h-10 shrink-0 flex items-center justify-between px-3 border-b border-[var(--kiri-border)]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--kiri-muted)]">
          {activeLeftTab === 'files' ? 'Explorer' : 'Source Control'}
        </span>
        {isMobile && (
          <button onClick={() => setIsLeftPanelOpen(false)} className="p-1 rounded hover:bg-[#ffffff08] text-[var(--kiri-muted)] hover:text-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeLeftTab === 'files' ? <FileTree /> : <GitHubManager />}
      </div>
    </div>
  );

  // =============================================
  // RIGHT PANEL CONTENT (used in both desktop + mobile overlay)
  // =============================================
  const RightPanelContent = (
    <div className="flex flex-col h-full bg-[var(--kiri-bg)] w-full">
      <div className="h-10 shrink-0 flex items-center justify-between px-3 border-b border-[var(--kiri-border)]">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--kiri-muted)]">
          <MessageSquare size={12} />
          <span>AI Agent</span>
        </div>
        {isMobile && (
          <button onClick={() => setIsRightPanelOpen(false)} className="p-1 rounded hover:bg-[#ffffff08] text-[var(--kiri-muted)] hover:text-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <Chat />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--kiri-bg)] text-[var(--kiri-body)] font-sans overflow-hidden">
      
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="h-11 shrink-0 border-b border-[var(--kiri-border)] flex items-center px-3 justify-between bg-[var(--kiri-surface)] z-50">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="Kiri Code" className="w-6 h-6 object-contain" />
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[10px] text-[var(--kiri-green)] uppercase tracking-[0.15em] font-bold">Kiri Code</span>
          </div>
          {/* Separator */}
          <div className="hidden sm:block w-px h-5 bg-[var(--kiri-border)] mx-1" />
          {/* Breadcrumb */}
          {editorStatus && (
            <span className="hidden sm:block text-[11px] text-[var(--kiri-muted)] truncate max-w-[200px]">
              {editorStatus.fileName}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Preview toggle */}
          {previewUrl && (
            <button
              onClick={() => setIsPreviewOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                isPreviewOpen 
                  ? 'bg-[var(--kiri-green)]/15 text-[var(--kiri-green)] border border-[var(--kiri-green)]/20' 
                  : 'bg-[#ffffff06] text-[var(--kiri-muted)] hover:text-white border border-[var(--kiri-border)]'
              }`}
            >
              <Globe size={12} />
              <span className="hidden sm:inline">Preview</span>
            </button>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#ffffff06] hover:bg-[#ffffff0d] border border-[var(--kiri-border)] transition-colors text-[11px] font-medium text-[var(--kiri-muted)] hover:text-white"
          >
            <Settings size={13} />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>
      
      {/* ============================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================ */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* ---- ACTIVITY BAR (always visible) ---- */}
        <div className="w-11 shrink-0 flex flex-col items-center py-3 gap-1 border-r border-[var(--kiri-border)] bg-[var(--kiri-surface)]">
          <button 
            onClick={() => toggleLeftPanel('files')}
            className={`p-2 rounded-lg transition-all duration-150 ${
              activeLeftTab === 'files' && isLeftPanelOpen 
                ? 'bg-[var(--kiri-green)]/15 text-[var(--kiri-green)]' 
                : 'text-[var(--kiri-muted)] hover:text-white hover:bg-[#ffffff08]'
            }`}
            title="Explorer (Ctrl+B)"
          >
            <FolderTree size={18} />
          </button>
          <button 
            onClick={() => toggleLeftPanel('github')}
            className={`p-2 rounded-lg transition-all duration-150 ${
              activeLeftTab === 'github' && isLeftPanelOpen 
                ? 'bg-[var(--kiri-green)]/15 text-[var(--kiri-green)]' 
                : 'text-[var(--kiri-muted)] hover:text-white hover:bg-[#ffffff08]'
            }`}
            title="Source Control"
          >
            <GitBranch size={18} />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right panel toggle (bottom of activity bar) */}
          <button 
            onClick={() => setIsRightPanelOpen(prev => !prev)}
            className={`p-2 rounded-lg transition-all duration-150 ${
              isRightPanelOpen 
                ? 'bg-[var(--kiri-green)]/15 text-[var(--kiri-green)]' 
                : 'text-[var(--kiri-muted)] hover:text-white hover:bg-[#ffffff08]'
            }`}
            title="AI Agent (Ctrl+L)"
          >
            <MessageSquare size={18} />
          </button>
        </div>

        {/* ---- MOBILE OVERLAYS ---- */}
        {isMobile && isLeftPanelOpen && (
          <>
            <div className="overlay-backdrop" onClick={() => setIsLeftPanelOpen(false)} />
            <div className="overlay-panel-left w-[280px]">
              {LeftPanelContent}
            </div>
          </>
        )}

        {isMobile && isRightPanelOpen && (
          <>
            <div className="overlay-backdrop" onClick={() => setIsRightPanelOpen(false)} />
            <div className="overlay-panel-right w-[320px]">
              {RightPanelContent}
            </div>
          </>
        )}

        {/* ---- DESKTOP LEFT PANEL ---- */}
        {!isMobile && isLeftPanelOpen && (
          <div className="w-60 shrink-0 border-r border-[var(--kiri-border)] bg-[var(--kiri-bg)] flex flex-col overflow-hidden transition-all duration-200">
            {LeftPanelContent}
          </div>
        )}

        {/* ---- CENTER AREA (Editor + Terminal + Preview) ---- */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--kiri-bg)]">
          
          {/* Editor + Preview split */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            <div className={`flex-1 min-w-0 flex flex-col overflow-hidden ${isPreviewOpen && !isMobile ? 'border-r border-[var(--kiri-border)]' : ''}`}>
              <EditorRouter />
            </div>

            {/* Live Preview Panel */}
            {isPreviewOpen && previewUrl && (
              <div className={`flex flex-col overflow-hidden shrink-0 ${isMobile ? 'hidden' : 'w-[45%]'}`}>
                {/* Preview Toolbar */}
                <div className="preview-toolbar">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`p-1 rounded transition-colors ${previewMode === 'desktop' ? 'text-[var(--kiri-green)]' : 'text-[var(--kiri-muted)] hover:text-white'}`}
                      title="Desktop"
                    >
                      <Monitor size={13} />
                    </button>
                    <button
                      onClick={() => setPreviewMode('tablet')}
                      className={`p-1 rounded transition-colors ${previewMode === 'tablet' ? 'text-[var(--kiri-green)]' : 'text-[var(--kiri-muted)] hover:text-white'}`}
                      title="Tablet"
                    >
                      <Tablet size={13} />
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`p-1 rounded transition-colors ${previewMode === 'mobile' ? 'text-[var(--kiri-green)]' : 'text-[var(--kiri-muted)] hover:text-white'}`}
                      title="Mobile"
                    >
                      <Smartphone size={13} />
                    </button>
                  </div>

                  <div className="preview-url-bar">
                    {previewUrl}
                  </div>

                  <button
                    onClick={() => previewIframeRef.current?.contentWindow?.location.reload()}
                    className="p-1 rounded text-[var(--kiri-muted)] hover:text-white transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={13} />
                  </button>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded text-[var(--kiri-muted)] hover:text-white transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-1 rounded text-[var(--kiri-muted)] hover:text-white transition-colors"
                    title="Close Preview"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Preview iframe container */}
                <div className="flex-1 bg-white flex items-start justify-center overflow-auto">
                  <iframe
                    ref={previewIframeRef}
                    src={previewUrl}
                    className={`h-full border-0 transition-all duration-300 ${previewWidth} max-w-full`}
                    title="Live Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Terminal */}
          {isBottomPanelOpen ? (
            <div className="h-56 shrink-0 border-t border-[var(--kiri-border)] flex flex-col bg-[var(--kiri-surface)]">
              <div className="h-9 shrink-0 flex items-center justify-between px-3 border-b border-[var(--kiri-border)]">
                <div className="flex items-center gap-2 text-[11px] text-[var(--kiri-muted)]">
                  <TerminalIcon size={13} />
                  <span className="uppercase tracking-wider font-semibold text-[10px]">Terminal</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsBottomPanelOpen(false)}
                    className="p-1 rounded text-[var(--kiri-muted)] hover:text-white hover:bg-[#ffffff08] transition-colors"
                    title="Close Terminal (Ctrl+J)"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-[var(--kiri-bg)] p-1">
                <Terminal ref={terminalRef} />
              </div>
            </div>
          ) : (
            <div className="h-7 shrink-0 border-t border-[var(--kiri-border)] flex items-center px-3 bg-[var(--kiri-surface)]">
              <button 
                onClick={() => setIsBottomPanelOpen(true)}
                className="flex items-center gap-1.5 text-[11px] text-[var(--kiri-muted)] hover:text-white transition-colors"
                title="Open Terminal (Ctrl+J)"
              >
                <TerminalIcon size={12} />
                <span className="text-[10px] uppercase tracking-wider font-medium">Terminal</span>
                <ChevronUp size={12} />
              </button>
            </div>
          )}
        </div>

        {/* ---- DESKTOP RIGHT PANEL ---- */}
        {!isMobile && isRightPanelOpen && (
          <div className="w-80 shrink-0 border-l border-[var(--kiri-border)] bg-[var(--kiri-bg)] flex flex-col overflow-hidden transition-all duration-200">
            {RightPanelContent}
          </div>
        )}
      </main>

      {/* ============================================ */}
      {/* STATUS BAR */}
      {/* ============================================ */}
      <div className="status-bar">
        <div className="status-bar-section">
          <div className="status-bar-item clickable" onClick={() => toggleLeftPanel('github')}>
            <GitBranch size={11} />
            <span>main</span>
          </div>
          {editorStatus?.modified && (
            <div className="status-bar-item">
              <span className="text-[var(--kiri-gold)]">● Modified</span>
            </div>
          )}
        </div>
        <div className="status-bar-section">
          {editorStatus && (
            <>
              <div className="status-bar-item">
                <span>{editorStatus.language}</span>
              </div>
              <div className="status-bar-item">
                <span>UTF-8</span>
              </div>
            </>
          )}
          <div className="status-bar-item">
            <Zap size={10} className="text-[var(--kiri-green)]" />
            <span className="text-[var(--kiri-green)]">Serverless</span>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* SETTINGS MODAL */}
      {/* ============================================ */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default IDE;
