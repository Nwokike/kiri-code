import { Settings, Zap, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="h-11 shrink-0 border-b border-[var(--kiri-border)] flex items-center px-3 justify-between bg-[var(--kiri-surface)] z-50">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">Kiri Code</span>
        </div>
        <span className="text-[10px] text-emerald-500/80 uppercase tracking-wider">Serverless</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('kiri:command-palette'))}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--kiri-bg)] border border-[var(--kiri-border)] hover:border-[var(--kiri-muted)] transition-colors text-xs text-[var(--kiri-muted)]"
        >
          <Search size={12} />
          <span>Search...</span>
          <kbd className="ml-2 px-1.5 py-0.5 bg-[var(--kiri-surface)] rounded text-[10px]">⌘K</kbd>
        </button>
        
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('kiri:open-settings'))}
          className="p-2 rounded-lg text-[var(--kiri-muted)] hover:text-white hover:bg-[#ffffff08] transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}