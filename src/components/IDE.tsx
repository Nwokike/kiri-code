import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from './workbench/terminal/Terminal';
import { getWebContainer } from '../lib/services/webcontainer';
import { terminalEmitter } from '../lib/services/terminalEmitter';
import Chat from './workbench/Chat';
import FileTree from './workbench/FileTree';
import EditorRouter from './editor/EditorRouter';
import { SettingsModal } from './workbench/SettingsModal';
import GitHubManager from './workbench/GitHubManager';
import { Settings, Terminal as TerminalIcon, FolderTree, GitBranch, MessageSquare, Code2, X } from 'lucide-react';

const IDE: React.FC = () => {
  const terminalRef = useRef<any>(null);
  const shellSpawned = useRef(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'files' | 'github'>('files');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);

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

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-gray-300 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 border-b border-[#222] flex items-center px-4 justify-between bg-[#111] z-50">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Logo" className="w-8 h-8 object-contain" />
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Serverless IDE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#222] hover:bg-[#333] border border-[#333] transition-colors text-xs font-medium text-gray-300 hover:text-white"
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar (Activity Bar + Panel) */}
        <div className={`flex shrink-0 border-r border-[#222] bg-[#111] transition-all duration-300 ${isLeftPanelOpen ? 'w-64' : 'w-12'}`}>
          {/* Activity Bar */}
          <div className="w-12 shrink-0 flex flex-col items-center py-4 gap-4 border-r border-[#222] bg-[#0a0a0a]">
            <button 
              onClick={() => {
                if (activeLeftTab === 'files' && isLeftPanelOpen) setIsLeftPanelOpen(false);
                else { setActiveLeftTab('files'); setIsLeftPanelOpen(true); }
              }}
              className={`p-2 rounded-lg transition-colors ${activeLeftTab === 'files' && isLeftPanelOpen ? 'bg-[#222] text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Explorer"
            >
              <FolderTree size={20} />
            </button>
            <button 
              onClick={() => {
                if (activeLeftTab === 'github' && isLeftPanelOpen) setIsLeftPanelOpen(false);
                else { setActiveLeftTab('github'); setIsLeftPanelOpen(true); }
              }}
              className={`p-2 rounded-lg transition-colors ${activeLeftTab === 'github' && isLeftPanelOpen ? 'bg-[#222] text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Source Control"
            >
              <GitBranch size={20} />
            </button>
          </div>
          
          {/* Left Panel Content */}
          {isLeftPanelOpen && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="h-10 shrink-0 flex items-center px-4 border-b border-[#222]">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {activeLeftTab === 'files' ? 'Explorer' : 'Source Control'}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeLeftTab === 'files' ? <FileTree /> : <GitHubManager />}
              </div>
            </div>
          )}
        </div>

        {/* Center Area (Editor + Terminal) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
          {/* Editor */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            <div className="h-10 shrink-0 flex items-center px-4 border-b border-[#222] bg-[#111]">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Code2 size={14} />
                <span>Editor</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <EditorRouter />
            </div>
          </div>

          {/* Terminal */}
          {isBottomPanelOpen && (
            <div className="h-64 shrink-0 border-t border-[#222] flex flex-col bg-[#111]">
              <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-[#222] bg-[#111]">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <TerminalIcon size={14} />
                  <span className="uppercase tracking-wider font-semibold">Terminal</span>
                </div>
                <button 
                  onClick={() => setIsBottomPanelOpen(false)}
                  className="text-gray-500 hover:text-gray-300"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 p-2 overflow-hidden bg-[#0a0a0a]">
                <Terminal ref={terminalRef} />
              </div>
            </div>
          )}
          
          {/* Terminal Toggle (if closed) */}
          {!isBottomPanelOpen && (
            <div className="h-8 shrink-0 border-t border-[#222] flex items-center px-4 bg-[#111]">
              <button 
                onClick={() => setIsBottomPanelOpen(true)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <TerminalIcon size={12} />
                <span>Open Terminal</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar (Chat) */}
        {isRightPanelOpen && (
          <div className="w-80 shrink-0 border-l border-[#222] bg-[#111] flex flex-col">
            <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-[#222]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <MessageSquare size={14} />
                <span>AI Agent</span>
              </div>
              <button 
                onClick={() => setIsRightPanelOpen(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Chat />
            </div>
          </div>
        )}
        
        {/* Right Panel Toggle (if closed) */}
        {!isRightPanelOpen && (
          <div className="w-12 shrink-0 border-l border-[#222] bg-[#0a0a0a] flex flex-col items-center py-4">
            <button 
              onClick={() => setIsRightPanelOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#222] transition-colors"
              title="AI Agent"
            >
              <MessageSquare size={20} />
            </button>
          </div>
        )}
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default IDE;
