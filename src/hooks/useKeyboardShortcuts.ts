import { useEffect, useCallback, useRef } from 'react';

type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], deps: React.DependencyList = []) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    for (const shortcut of shortcutsRef.current) {
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const metaMatch = shortcut.meta ? e.metaKey : true;

      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() ||
                     e.code.toLowerCase() === shortcut.key.toLowerCase();

      if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, ...deps]);

  const shortcutsList = shortcuts.map(s => ({
    keys: [
      s.ctrl && (navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'),
      s.alt && (navigator.platform.includes('Mac') ? '⌥' : 'Alt'),
      s.shift && (navigator.platform.includes('Mac') ? '⇧' : 'Shift'),
      s.meta && (navigator.platform.includes('Mac') ? '⌃' : 'Win'),
      s.key.toUpperCase(),
    ].filter(Boolean).join('+'),
    description: s.description || '',
  }));

  return { shortcutsList };
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'b', ctrl: true, action: () => window.dispatchEvent(new CustomEvent('kiri:toggle-sidebar')), description: 'Toggle Sidebar' },
  { key: 'j', ctrl: true, action: () => window.dispatchEvent(new CustomEvent('kiri:toggle-terminal')), description: 'Toggle Terminal' },
  { key: 'l', ctrl: true, action: () => window.dispatchEvent(new CustomEvent('kiri:toggle-chat')), description: 'Toggle AI Chat' },
  { key: 'k', ctrl: true, action: () => window.dispatchEvent(new CustomEvent('kiri:command-palette')), description: 'Open Command Palette' },
  { key: 'p', ctrl: true, action: () => window.dispatchEvent(new CustomEvent('kiri:toggle-preview')), description: 'Toggle Preview' },
  { key: 's', ctrl: true, action: () => window.dispatchEvent(new CustomEvent('kiri:save-file')), description: 'Save File' },
  { key: 'n', ctrl: true, action: () => window.dispatchEvent(new CustomEvent('kiri:new-file')), description: 'New File' },
  { key: 'w', ctrl: true, action: () => window.dispatchEvent(new CustomEvent('kiri:close-tab')), description: 'Close Tab' },
  { key: 'Escape', action: () => window.dispatchEvent(new CustomEvent('kiri:escape')), description: 'Close Dialog / Cancel' },
];