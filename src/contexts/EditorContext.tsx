import React, { createContext, useContext, useState, useCallback } from 'react';

export interface EditorTab {
  path: string;
  content: string;
  modified: boolean;
}

export interface EditorState {
  openTabs: EditorTab[];
  activeTabIndex: number;
}

interface EditorContextValue extends EditorState {
  openFile: (path: string, content: string) => void;
  closeTab: (index: number) => void;
  setActiveTab: (index: number) => void;
  updateTabContent: (index: number, content: string) => void;
  markTabClean: (index: number) => void;
  getActiveTab: () => EditorTab | null;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(-1);

  const openFile = useCallback((path: string, content: string) => {
    const existingIndex = openTabs.findIndex(tab => tab.path === path);
    
    if (existingIndex >= 0) {
      setActiveTabIndex(existingIndex);
      return;
    }

    setOpenTabs(prev => [...prev, { path, content, modified: false }]);
    setActiveTabIndex(openTabs.length);
  }, [openTabs]);

  const closeTab = useCallback((index: number) => {
    setOpenTabs(prev => {
      const next = prev.filter((_, i) => i !== index);
      
      if (index === activeTabIndex) {
        const newIndex = Math.min(index, next.length - 1);
        setActiveTabIndex(newIndex >= 0 ? newIndex : -1);
      } else if (index < activeTabIndex) {
        setActiveTabIndex(prev => prev - 1);
      }
      
      return next;
    });
  }, [activeTabIndex]);

  const setActiveTab = useCallback((index: number) => {
    setActiveTabIndex(index);
  }, []);

  const updateTabContent = useCallback((index: number, content: string) => {
    setOpenTabs(prev => prev.map((tab, i) => 
      i === index ? { ...tab, content, modified: true } : tab
    ));
  }, []);

  const markTabClean = useCallback((index: number) => {
    setOpenTabs(prev => prev.map((tab, i) => 
      i === index ? { ...tab, modified: false } : tab
    ));
  }, []);

  const getActiveTab = useCallback(() => {
    return activeTabIndex >= 0 ? openTabs[activeTabIndex] : null;
  }, [activeTabIndex, openTabs]);

  return (
    <EditorContext.Provider value={{
      openTabs,
      activeTabIndex,
      openFile,
      closeTab,
      setActiveTab,
      updateTabContent,
      markTabClean,
      getActiveTab,
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}