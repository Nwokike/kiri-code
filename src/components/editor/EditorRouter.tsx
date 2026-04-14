import React, { useEffect, useState, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import CodeMirror from '@uiw/react-codemirror';
import { getWebContainer } from '../../lib/services/webcontainer';
import { runtimeRouter } from '../../lib/services/RuntimeRouter'; // <-- IMPORT THE ROUTER
import { X } from 'lucide-react';

const EditorRouter: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleOpenFile = async (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string }>;
      const { path } = customEvent.detail;
      
      try {
        const wc = await getWebContainer();
        const content = await wc.fs.readFile(path, 'utf8');
        setCurrentFile(path);
        setFileContent(content);
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    };

    window.addEventListener('kiri:open-file', handleOpenFile);
    return () => window.removeEventListener('kiri:open-file', handleOpenFile);
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    const content = value || '';
    setFileContent(content);

    if (currentFile) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const wc = await getWebContainer();
          await wc.fs.writeFile(currentFile, content);
          window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 800);
    }
  };

  // <-- THE NEW RUN LOGIC
  const handleRunFile = async () => {
    if (!currentFile) return;
    setIsRunning(true);
    try {
      await runtimeRouter.executeFile(currentFile, fileContent);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCloseFile = () => {
    setCurrentFile(null);
    setFileContent('');
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
      default: return 'plaintext';
    }
  };

  if (!currentFile) {
    return (
      <div className="h-full w-full bg-[var(--kiri-bg)] flex flex-col items-center justify-center relative overflow-hidden graduate-bg text-center px-6">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('/favicon.svg')] bg-no-repeat bg-center bg-[length:400px_auto]" />
        <div className="z-10">
          <div className="inline-block p-1 px-3 rounded-full bg-[var(--kiri-green)]/10 text-[var(--kiri-green)] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[var(--kiri-green)]/20">
            Serverless IDE
          </div>
          <p className="text-[13px] text-[var(--kiri-muted)] leading-relaxed max-w-md mx-auto">
            How to start:
            <br />1. Connect your GitHub account to import repositories.
            <br />2. Use the Explorer to manage your files.
            <br />3. Ask the AI Agent to help you write code and run commands.
          </p>
          <div className="mt-8 text-[11px] text-[var(--kiri-muted)] opacity-70">
            Select a file from the explorer or ask the Agent to create one.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[var(--kiri-bg)]">
      {/* Editor Tab Bar WITH RUN BUTTON */}
      <div className="h-9 shrink-0 bg-[var(--kiri-surface)] border-b border-[var(--kiri-border)] flex items-center px-3 justify-between">
        <div className="text-[11px] font-medium text-[var(--kiri-green)] border-b-2 border-[var(--kiri-green)] h-full flex items-center px-2 gap-2 group">
          <span>{currentFile.split('/').pop()}</span>
          <button 
            onClick={handleCloseFile}
            className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
            title="Close File"
          >
            <X size={12} />
          </button>
        </div>
        <button 
          onClick={handleRunFile}
          disabled={isRunning}
          className="text-[10px] font-bold uppercase tracking-widest bg-[var(--kiri-green)]/10 text-[var(--kiri-green)] hover:bg-[var(--kiri-green)] hover:text-white border border-[var(--kiri-green)]/30 px-3 py-1 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {isRunning ? 'Running...' : '▶ Run'}
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {isMobile ? (
          <CodeMirror
            value={fileContent}
            height="100%"
            theme="dark"
            onChange={handleEditorChange}
            className="h-full text-xs"
          />
        ) : (
          <MonacoEditor
            height="100%"
            language={getLanguage(currentFile)}
            theme="vs-dark"
            value={fileContent}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: '"JetBrains Mono", monospace',
              wordWrap: 'on',
              padding: { top: 16 },
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EditorRouter;
