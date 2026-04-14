import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';
import { getTerminalTheme } from './theme';

export interface TerminalRef {
  getTerminal: () => XTerm | null;
}

export interface TerminalProps {
  className?: string;
  readonly?: boolean;
  onTerminalReady?: (terminal: XTerm) => void;
}

export const Terminal = memo(
  forwardRef<TerminalRef, TerminalProps>(
    ({ className, readonly, onTerminalReady }, ref) => {
      const terminalElementRef = useRef<HTMLDivElement>(null);
      const terminalRef = useRef<XTerm>(null);

      useEffect(() => {
        const element = terminalElementRef.current!;
        const fitAddon = new FitAddon();

        const terminal = new XTerm({
          cursorBlink: true,
          convertEol: true,
          disableStdin: readonly,
          theme: getTerminalTheme(readonly ? { cursor: '#00000000' } : {}),
          fontSize: 12,
          fontFamily: 'Menlo, courier-new, courier, monospace',
          allowProposedApi: true,
          scrollback: 1000,
        });

        terminalRef.current = terminal;
        terminal.loadAddon(fitAddon);
        terminal.open(element);
        
        // Initial fit
        setTimeout(() => fitAddon.fit(), 0);

        const resizeObserver = new ResizeObserver(() => {
          try {
            fitAddon.fit();
          } catch (e) {}
        });

        resizeObserver.observe(element);
        onTerminalReady?.(terminal);

        return () => {
          resizeObserver.disconnect();
          terminal.dispose();
        };
      }, []);

      useImperativeHandle(ref, () => ({
        getTerminal: () => terminalRef.current,
      }));

      return <div className={className} ref={terminalElementRef} style={{ height: '100%', width: '100%' }} />;
    },
  ),
);
