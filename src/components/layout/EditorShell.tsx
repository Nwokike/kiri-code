import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Header } from './Header';
import { ActivityBar } from './ActivityBar';
import { StatusBar } from './StatusBar';
import { FileTree } from '../explorer/FileTree';
import GitHubManager from '../workbench/GitHubManager';
import { EditorTabs } from '../editor/EditorTabs';
import { ChatContainer } from '../chat/ChatContainer';
import { TerminalManager } from '../terminal/TerminalManager';
const MIN_SIDEBAR = 15;
const MIN_MAIN = 30;
const MIN_CHAT = 20;

export function EditorShell() {
  const [activeSidebarItem, setActiveSidebarItem] = useState('explorer');

  useEffect(() => {
    const handleToggleSidebar = () => {
      console.log('Toggle sidebar');
    };
    const handleToggleTerminal = () => {
      console.log('Toggle terminal');
    };
    const handleToggleChat = () => {
      console.log('Toggle chat');
    };

    window.addEventListener('kiri:toggle-sidebar', handleToggleSidebar);
    window.addEventListener('kiri:toggle-terminal', handleToggleTerminal);
    window.addEventListener('kiri:toggle-chat', handleToggleChat);

    return () => {
      window.removeEventListener('kiri:toggle-sidebar', handleToggleSidebar);
      window.removeEventListener('kiri:toggle-terminal', handleToggleTerminal);
      window.removeEventListener('kiri:toggle-chat', handleToggleChat);
    };
  }, []);



  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--kiri-bg)] text-[var(--kiri-body)] overflow-hidden">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <ActivityBar activeItem={activeSidebarItem} setActiveItem={setActiveSidebarItem} />
        
        <PanelGroup direction="horizontal" autoSaveId="kiri-layout">
          <Panel defaultSize={20} minSize={MIN_SIDEBAR}>
            <div className="flex h-full border-r border-[var(--kiri-border)]">
              {activeSidebarItem === 'explorer' && <FileTree className="flex-1" />}
              {activeSidebarItem === 'github' && <GitHubManager />}
              {activeSidebarItem === 'search' && (
                <div className="flex-1 p-4 text-center text-xs text-[var(--kiri-muted)] uppercase tracking-widest">
                  Search functionality coming soon
                </div>
              )}
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-[var(--kiri-border)] hover:bg-[var(--kiri-green)] transition-colors" />
          
          <Panel defaultSize={50} minSize={MIN_MAIN}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30}>
                <EditorTabs />
              </Panel>
              
              <PanelResizeHandle className="h-1 bg-[var(--kiri-border)] hover:bg-[var(--kiri-green)] transition-colors" />
              
              <Panel defaultSize={30} minSize={15}>
                <TerminalManager />
              </Panel>
            </PanelGroup>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-[var(--kiri-border)] hover:bg-[var(--kiri-green)] transition-colors" />
          
          <Panel defaultSize={30} minSize={MIN_CHAT}>
            <ChatContainer className="h-full" />
          </Panel>
        </PanelGroup>
      </div>
      
      <StatusBar />
    </div>
  );
}