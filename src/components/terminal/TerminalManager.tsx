import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { TerminalIcon, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';

interface TerminalInstance {
  id: string;
  title: string;
  terminal: XTerm;
  fitAddon: FitAddon;
}

interface TerminalTabsProps {
  className?: string;
  onTerminalReady?: (terminal: XTerm) => void;
}

export function TerminalManager({ className = '', onTerminalReady }: TerminalTabsProps) {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const createTerminal = useCallback(() => {
    const id = `terminal-${Date.now()}`;
    const element = document.createElement('div');
    element.className = 'h-full w-full';

    const fitAddon = new FitAddon();
    const terminal = new XTerm({
      cursorBlink: true,
      convertEol: true,
      fontSize: 12,
      fontFamily: 'Menlo, courier-new, courier, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#ffffff',
        selectionBackground: '#3399ff44',
      },
      allowProposedApi: true,
      scrollback: 1000,
    });

    terminal.loadAddon(fitAddon);
    terminal.open(element);

    setTimeout(() => fitAddon.fit(), 0);

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (e) {}
    });

    const newTerminal: TerminalInstance = { id, title: `Terminal ${terminals.length + 1}`, terminal, fitAddon };
    setTerminals(prev => [...prev, newTerminal]);
    setActiveTerminalId(id);

    onTerminalReady?.(terminal);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, [terminals.length, onTerminalReady]);

  useEffect(() => {
    if (terminals.length === 0) {
      createTerminal();
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      terminals.forEach(t => {
        try {
          t.fitAddon.fit();
        } catch (e) {}
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [terminals]);

  const closeTerminal = (id: string) => {
    const terminal = terminals.find(t => t.id === id);
    if (terminal) {
      terminal.terminal.dispose();
    }

    setTerminals(prev => prev.filter(t => t.id !== id));

    if (activeTerminalId === id) {
      const remaining = terminals.filter(t => t.id !== id);
      setActiveTerminalId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  if (isCollapsed) {
    return (
      <div className={`h-7 shrink-0 border-t border-[var(--kiri-border)] flex items-center px-3 bg-[var(--kiri-surface)] ${className}`}>
        <button 
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 text-xs text-[var(--kiri-muted)] hover:text-white transition-colors"
        >
          <TerminalIcon size={12} />
          <span className="uppercase tracking-wider font-medium">Terminal</span>
          <ChevronUp size={12} />
        </button>
        <div className="flex-1" />
        <button onClick={createTerminal} className="p-1 text-[var(--kiri-muted)] hover:text-white">
          <Plus size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-[var(--kiri-surface)] ${className}`}>
      <div className="h-9 shrink-0 flex items-center justify-between px-3 border-b border-[var(--kiri-border)]">
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} className="text-[var(--kiri-muted)]" />
          <span className="text-xs uppercase tracking-wider font-semibold text-[var(--kiri-muted)]">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={createTerminal}
            className="p-1 rounded text-[var(--kiri-muted)] hover:text-white hover:bg-[#ffffff08] transition-colors"
            title="New Terminal"
          >
            <Plus size={14} />
          </button>
          <button 
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded text-[var(--kiri-muted)] hover:text-white hover:bg-[#ffffff08] transition-colors"
            title="Close Terminal"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="flex border-b border-[var(--kiri-border)] bg-[var(--kiri-bg)] overflow-x-auto">
        {terminals.map(t => (
          <div
            key={t.id}
            onClick={() => setActiveTerminalId(t.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 text-xs border-r border-[var(--kiri-border)] cursor-pointer
              transition-colors shrink-0
              ${t.id === activeTerminalId 
                ? 'bg-[var(--kiri-surface)] text-[var(--kiri-body)] border-t border-t-[var(--kiri-green)] -mb-px' 
                : 'text-[var(--kiri-muted)] hover:text-[var(--kiri-body)]'
              }
            `}
          >
            <span>{t.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTerminal(t.id);
              }}
              className="p-0.5 rounded hover:bg-[#ffffff08] opacity-0 group-hover:opacity-100"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1 relative">
        {terminals.map(t => (
          <div
            key={t.id}
            ref={(el) => {
              if (el && t.id === activeTerminalId && !el.hasChildNodes()) {
                el.appendChild(el);
              }
            }}
            className={`absolute inset-0 ${t.id === activeTerminalId ? 'block' : 'hidden'}`}
            style={{ display: t.id === activeTerminalId ? 'block' : 'none' }}
          >
            {(() => {
              const container = document.getElementById(`terminal-${t.id}`);
              if (container && !container.hasChildNodes()) {
                container.appendChild(terminals.find(x => x.id === t.id)?.terminal?.element || document.createElement('div'));
              }
              return <div id={`terminal-${t.id}`} className="h-full w-full" />;
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TerminalProps {
  className?: string;
}

export const Terminal = forwardRef<{ getTerminal: () => XTerm | null }, TerminalProps>(
  ({ className = '' }, ref) => {
    const terminalRef = useRef<XTerm>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getTerminal: () => terminalRef.current,
    }));

    useEffect(() => {
      const element = containerRef.current;
      if (!element) return;

      const fitAddon = new FitAddon();
      const terminal = new XTerm({
        cursorBlink: true,
        convertEol: true,
        fontSize: 12,
        fontFamily: 'Menlo, courier-new, courier, monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#cccccc',
          cursor: '#ffffff',
        },
        allowProposedApi: true,
        scrollback: 1000,
      });

      terminal.loadAddon(fitAddon);
      terminal.open(element);
      terminalRef.current = terminal;

      setTimeout(() => fitAddon.fit(), 0);

      const resizeObserver = new ResizeObserver(() => {
        try {
          fitAddon.fit();
        } catch (e) {}
      });

      resizeObserver.observe(element);

      return () => {
        resizeObserver.disconnect();
        terminal.dispose();
      };
    }, []);

    return <div ref={containerRef} className={`h-full w-full ${className}`} />;
  }
);

Terminal.displayName = 'Terminal';