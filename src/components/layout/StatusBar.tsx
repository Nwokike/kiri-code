import { GitBranch, Zap, Circle } from 'lucide-react';
import { useEditor } from '~/contexts';

export function StatusBar({ className = '' }: { className?: string }) {
  const { openTabs, activeTabIndex } = useEditor();

  const activeFile = activeTabIndex >= 0 ? openTabs[activeTabIndex] : null;

  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TypeScript React',
      js: 'JavaScript',
      jsx: 'JavaScript React',
      py: 'Python',
      rb: 'Ruby',
      php: 'PHP',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      md: 'Markdown',
      yaml: 'YAML',
    };
    return langMap[ext || ''] || ext?.toUpperCase() || 'Plain Text';
  };

  return (
    <div className={`h-6 shrink-0 border-t border-[var(--kiri-border)] flex items-center justify-between px-3 bg-[var(--kiri-surface)] text-[11px] text-[var(--kiri-muted)] ${className}`}>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1.5 hover:text-[var(--kiri-body)] transition-colors">
          <GitBranch size={11} />
          <span>main</span>
        </button>
        
        {activeFile?.modified && (
          <div className="flex items-center gap-1 text-[var(--kiri-gold)]">
            <Circle size={6} fill="currentColor" />
            <span>Modified</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {activeFile && (
          <>
            <span>{getLanguage(activeFile.path)}</span>
            <span>UTF-8</span>
          </>
        )}
        
        <div className="flex items-center gap-1.5 text-[var(--kiri-green)]">
          <Zap size={10} />
          <span>Serverless</span>
        </div>
      </div>
    </div>
  );
}