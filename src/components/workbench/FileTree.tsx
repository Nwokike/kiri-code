import React, { useEffect, useState } from 'react';
import { getWebContainer } from '../../lib/services/webcontainer';
import { FilePlus, FolderPlus, RefreshCw, Trash2 } from 'lucide-react';

interface FileNode {
  name: string;
  path: string; // <-- ADDED: We need the full path to open it
  isDirectory: boolean;
  children?: FileNode[];
}

const FileTree: React.FC = () => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      const wc = await getWebContainer();
      
      const buildTree = async (dirPath: string): Promise<FileNode[]> => {
        const entries = await wc.fs.readdir(dirPath, { withFileTypes: true });
        const nodes: FileNode[] = [];

        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === '.git') continue;

          const isDir = entry.isDirectory();
          // Clean the path so we don't end up with "./folder/file.js"
          const fullPath = dirPath === '.' ? entry.name : `${dirPath}/${entry.name}`;

          nodes.push({
            name: entry.name,
            path: fullPath,
            isDirectory: isDir,
            children: isDir ? await buildTree(fullPath) : [],
          });
        }
        
        return nodes.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
      };

      const tree = await buildTree('.');
      setFiles(tree);
    } catch (error: any) {
      console.error('[FileTree] Error fetching files:', error);
      if (error.message?.includes('SharedArrayBuffer') || error.toString().includes('SharedArrayBuffer')) {
        setFiles([{ 
          name: 'Error: Cross-Origin Isolation failed. Please disable your adblocker or open the app in a new tab.', 
          path: '', 
          isDirectory: false 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    const handleUpdate = () => fetchFiles();
    window.addEventListener('kiri:fs-updated', handleUpdate);
    return () => window.removeEventListener('kiri:fs-updated', handleUpdate);
  }, []);

  // THE BRIDGE TO THE EDITOR: Dispatch an event when a file is clicked
  const handleFileClick = (path: string, isDirectory: boolean) => {
    if (isDirectory) return; // Folders just toggle (handled by state if we want, but keeping simple for now)
    window.dispatchEvent(new CustomEvent('kiri:open-file', { detail: { path } }));
  };

  const handleCreateFile = async () => {
    const name = prompt('Enter file name:');
    if (!name) return;
    try {
      const wc = await getWebContainer();
      await wc.fs.writeFile(name, '');
      window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
      window.dispatchEvent(new CustomEvent('kiri:open-file', { detail: { path: name } }));
    } catch (error) {
      console.error('Failed to create file:', error);
      alert('Failed to create file.');
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    try {
      const wc = await getWebContainer();
      await wc.fs.mkdir(name);
      window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder.');
    }
  };

  const handleDelete = async (e: React.MouseEvent, path: string, isDirectory: boolean) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${path}?`)) return;
    try {
      const wc = await getWebContainer();
      await wc.fs.rm(path, { recursive: isDirectory });
      window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete.');
    }
  };

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ paddingLeft: `${depth * 12}px` }}>
        <div 
          onClick={() => handleFileClick(node.path, node.isDirectory)}
          className="flex items-center justify-between py-1 cursor-pointer hover:bg-[var(--kiri-surface)] group transition-colors rounded px-1"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {node.isDirectory ? (
              <span className="text-[var(--kiri-gold)] group-hover:scale-110 transition-transform shrink-0">📂</span>
            ) : (
              <span className="text-blue-400 group-hover:scale-110 transition-transform shrink-0">📄</span>
            )}
            <span className="truncate select-none group-hover:text-[var(--kiri-green)] transition-colors">{node.name}</span>
          </div>
          <button 
            onClick={(e) => handleDelete(e, node.path, node.isDirectory)}
            className="opacity-0 group-hover:opacity-100 p-1 text-[var(--kiri-muted)] hover:text-red-400 transition-all shrink-0"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
        {node.isDirectory && node.children && (
          <div className="ml-1 border-l border-[var(--kiri-border)]">
            {renderTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (isLoading) {
    return <div className="p-4 text-xs text-[var(--kiri-muted)] italic animate-pulse">Mounting file system...</div>;
  }

  return (
    <div className="h-full w-full bg-[var(--kiri-surface-subtle)] flex flex-col text-xs font-medium text-[var(--kiri-body)] overflow-hidden">
      <div className="flex items-center justify-end gap-2 p-2 border-b border-[var(--kiri-border)] shrink-0">
        <button onClick={handleCreateFile} className="p-1 hover:bg-[var(--kiri-surface)] rounded text-[var(--kiri-muted)] hover:text-[var(--kiri-green)] transition-colors" title="New File">
          <FilePlus size={14} />
        </button>
        <button onClick={handleCreateFolder} className="p-1 hover:bg-[var(--kiri-surface)] rounded text-[var(--kiri-muted)] hover:text-[var(--kiri-green)] transition-colors" title="New Folder">
          <FolderPlus size={14} />
        </button>
        <button onClick={fetchFiles} className="p-1 hover:bg-[var(--kiri-surface)] rounded text-[var(--kiri-muted)] hover:text-[var(--kiri-green)] transition-colors" title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (
          <div className="text-[var(--kiri-muted)] italic p-2 text-center opacity-70">
            Workspace is empty. Ask Coder to scaffold an app!
          </div>
        ) : (
          renderTree(files)
        )}
      </div>
    </div>
  );
};

export default FileTree;
