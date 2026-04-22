import { useEffect, useState, useCallback, useRef, type MouseEvent, type ReactNode } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { X, Circle, FileCode, FileJson, FileText, FileImage, File } from 'lucide-react';

import { getWebContainer } from '~/lib/services/webcontainer';

const FILE_ICONS: Record<string, ReactNode> = {
  ts: <FileCode size={12} className="text-blue-400" />,
  tsx: <FileCode size={12} className="text-blue-400" />,
  js: <FileCode size={12} className="text-yellow-400" />,
  jsx: <FileCode size={12} className="text-yellow-400" />,
  css: <FileCode size={12} className="text-purple-400" />,
  html: <FileCode size={12} className="text-orange-400" />,
  json: <FileJson size={12} className="text-yellow-300" />,
  md: <FileText size={12} className="text-gray-400" />,
  py: <FileCode size={12} className="text-green-400" />,
  svg: <FileImage size={12} className="text-pink-400" />,
};

interface OpenFile {
  path: string;
  content: string;
  modified: boolean;
}

function getLanguage(filepath: string): string {
  const ext = filepath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': case 'jsx': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'py': return 'python';
    case 'php': return 'php';
    case 'rb': return 'ruby';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'md': return 'markdown';
    case 'yaml': case 'yml': return 'yaml';
    case 'sh': case 'bash': return 'shell';
    default: return 'plaintext';
  }
}

function getFileIcon(filepath: string) {
  const ext = filepath.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext || ''] || <File size={12} className="text-gray-500" />;
}

export function EditorTabs({ className = '' }: { className?: string }) {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFile = activeIndex >= 0 ? openFiles[activeIndex] : null;

  useEffect(() => {
    const handleOpenFile = async (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string }>;
      const { path } = customEvent.detail;

      const existingIndex = openFiles.findIndex(f => f.path === path);
      if (existingIndex >= 0) {
        setActiveIndex(existingIndex);
        return;
      }

      try {
        const wc = await getWebContainer();
        const content = await wc.fs.readFile(path, 'utf8');
        setOpenFiles(prev => [...prev, { path, content, modified: false }]);
        setActiveIndex(openFiles.length);
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    };

    window.addEventListener('kiri:open-file', handleOpenFile);
    return () => window.removeEventListener('kiri:open-file', handleOpenFile);
  }, [openFiles]);

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

  const handleCloseTab = (e: MouseEvent, index: number) => {
    e.stopPropagation();
    setOpenFiles(prev => prev.filter((_, i) => i !== index));

    if (index === activeIndex) {
      setActiveIndex(Math.max(0, index - 1));
    } else if (index < activeIndex) {
      setActiveIndex(activeIndex - 1);
    }

    if (openFiles.length <= 1) {
      setActiveIndex(-1);
    }
  };

  if (openFiles.length === 0 || activeIndex < 0) {
    return (
      <div className={`h-full flex items-center justify-center bg-[var(--kiri-bg)] ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 flex items-center justify-center">
            <FileCode size={24} className="text-emerald-400" />
          </div>
          <p className="text-sm text-[var(--kiri-muted)]">Select a file to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex items-center bg-[var(--kiri-surface)] border-b border-[var(--kiri-border)] overflow-x-auto">
        {openFiles.map((file, idx) => (
          <div
            key={file.path}
            onClick={() => setActiveIndex(idx)}
            className={`
              flex items-center gap-2 px-3 py-2 text-xs cursor-pointer border-r border-[var(--kiri-border)] shrink-0
              transition-colors
              ${idx === activeIndex 
                ? 'bg-[var(--kiri-bg)] text-[var(--kiri-body)] border-t border-t-[var(--kiri-green)] -mb-px' 
                : 'text-[var(--kiri-muted)] hover:text-[var(--kiri-body)]'
              }
            `}
          >
            {getFileIcon(file.path)}
            <span className="whitespace-nowrap">{file.path.split('/').pop()}</span>
            {file.modified && <Circle size={6} className="text-[var(--kiri-green)]" fill="currentColor" />}
            <button
              onClick={(e) => handleCloseTab(e, idx)}
              className="p-0.5 rounded hover:bg-[#ffffff08] opacity-60 hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
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
            tabSize: 2,
            lineNumbers: 'on',
            folding: true,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}