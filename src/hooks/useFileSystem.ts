import { useState, useCallback, useEffect } from 'react';
import { getWebContainer } from '~/lib/services/webcontainer';

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  isOpen?: boolean;
}

export function useFileSystem() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const buildTree = useCallback(async (dirPath: string): Promise<FileNode[]> => {
    const wc = await getWebContainer();
    const entries = await wc.fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

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

  const loadFiles = useCallback(async () => {
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

  const loadChildren = useCallback(async (path: string): Promise<FileNode[]> => {
    try {
      const children = await buildTree(path);
      setFiles(prev => updateNodeChildren(prev, path, children));
      return children;
    } catch (err) {
      console.error('Failed to load children:', err);
      return [];
    }
  }, [buildTree]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const writeFile = useCallback(async (path: string, content: string) => {
    const wc = await getWebContainer();
    const parts = path.split('/');
    
    if (parts.length > 1) {
      const dir = parts.slice(0, -1).join('/');
      await wc.fs.mkdir(dir, { recursive: true });
    }
    
    await wc.fs.writeFile(path, content);
    window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
    window.dispatchEvent(new CustomEvent('kiri:open-file', { detail: { path } }));
  }, []);

  const createFile = useCallback(async (name: string) => {
    const wc = await getWebContainer();
    await wc.fs.writeFile(name, '');
    await loadFiles();
    window.dispatchEvent(new CustomEvent('kiri:open-file', { detail: { path: name } }));
  }, [loadFiles]);

  const createFolder = useCallback(async (name: string) => {
    const wc = await getWebContainer();
    await wc.fs.mkdir(name, { recursive: true });
    await loadFiles();
  }, [loadFiles]);

  const deleteFile = useCallback(async (path: string, isDirectory: boolean) => {
    const wc = await getWebContainer();
    await wc.fs.rm(path, { recursive: isDirectory });
    await loadFiles();
  }, [loadFiles]);

  const renameFile = useCallback(async (oldPath: string, newPath: string) => {
    const wc = await getWebContainer();
    const content = await wc.fs.readFile(oldPath, 'utf8');
    await wc.fs.writeFile(newPath, content);
    await wc.fs.rm(oldPath);
    await loadFiles();
  }, [loadFiles]);

  const refreshFiles = useCallback(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    loadFiles();
    const handleUpdate = () => loadFiles();
    window.addEventListener('kiri:fs-updated', handleUpdate);
    return () => window.removeEventListener('kiri:fs-updated', handleUpdate);
  }, [loadFiles]);

  return {
    files,
    isLoading,
    error,
    expandedPaths,
    selectedPath,
    setSelectedPath,
    toggleFolder,
    loadChildren,
    writeFile,
    createFile,
    createFolder,
    deleteFile,
    renameFile,
    refreshFiles,
  };
}

function updateNodeChildren(nodes: FileNode[], path: string, children: FileNode[]): FileNode[] {
  return nodes.map(node => {
    if (node.path === path) {
      return { ...node, children, isOpen: true };
    }
    if (node.children) {
      return { ...node, children: updateNodeChildren(node.children, path, children) };
    }
    return node;
  });
}