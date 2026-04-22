import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getWebContainer } from '~/lib/services/webcontainer';

export interface ProjectFile {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: ProjectFile[];
  isOpen?: boolean;
}

export interface ProjectSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

interface ProjectState {
  name: string;
  files: ProjectFile[];
  isLoading: boolean;
  error: string | null;
  settings: ProjectSettings;
}

interface ProjectContextValue extends ProjectState {
  refreshFiles: () => Promise<void>;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
}

const defaultSettings: ProjectSettings = {
  theme: 'dark',
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [name] = useState('project');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ProjectSettings>(() => {
    const saved = localStorage.getItem('kiri_project_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const buildTree = useCallback(async (dirPath: string): Promise<ProjectFile[]> => {
    const wc = await getWebContainer();
    const entries = await wc.fs.readdir(dirPath, { withFileTypes: true });
    const nodes: ProjectFile[] = [];

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;

      const isDir = entry.isDirectory();
      const fullPath = dirPath === '.' ? entry.name : `${dirPath}/${entry.name}`;

      nodes.push({
        name: entry.name,
        path: fullPath,
        isDirectory: isDir,
        children: isDir ? [] : undefined,
      });
    }

    return nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }, []);

  const refreshFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tree = await buildTree('.');
      setFiles(tree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [buildTree]);

  const updateSettings = useCallback((newSettings: Partial<ProjectSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('kiri_project_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    refreshFiles();
    
    const handleUpdate = () => refreshFiles();
    window.addEventListener('kiri:fs-updated', handleUpdate);
    return () => window.removeEventListener('kiri:fs-updated', handleUpdate);
  }, [refreshFiles]);

  return (
    <ProjectContext.Provider value={{
      name,
      files,
      isLoading,
      error,
      settings,
      refreshFiles,
      updateSettings,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}