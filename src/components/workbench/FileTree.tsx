import React, { useEffect, useState, useCallback } from 'react';
import { getWebContainer } from '../../lib/services/webcontainer';
import { FilePlus, FolderPlus, RefreshCw, Trash2, ChevronRight, ChevronDown, FileText, FileCode, FileJson, FileImage, File } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

// File icon mapper for visual context
const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': return <FileCode size={14} className="text-blue-400" />;
    case 'js': case 'jsx': return <FileCode size={14} className="text-yellow-400" />;
    case 'css': case 'scss': return <FileCode size={14} className="text-purple-400" />;
    case 'html': return <FileCode size={14} className="text-orange-400" />;
    case 'json': return <FileJson size={14} className="text-yellow-300" />;
    case 'md': return <FileText size={14} className="text-gray-400" />;
    case 'py': return <FileCode size={14} className="text-green-400" />;
    case 'svg': case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp':
      return <FileImage size={14} className="text-pink-400" />;
    default: return <File size={14} className="text-gray-500" />;
  }
};

const FileTree: React.FC = () => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const wc = await getWebContainer();
      
      const buildTree = async (dirPath: string): Promise<FileNode[]> => {
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
  }, []);

  useEffect(() => {
    fetchFiles();
    const handleUpdate = () => fetchFiles();
    window.addEventListener('kiri:fs-updated', handleUpdate);
    return () => window.removeEventListener('kiri:fs-updated', handleUpdate);
  }, [fetchFiles]);

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = (path: string, isDirectory: boolean) => {
    setSelectedPath(path);
    if (isDirectory) {
      toggleDir(path);
      return;
    }
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
    return nodes.map((node) => {
      const isExpanded = expandedDirs.has(node.path);
      const isSelected = selectedPath === node.path;
      return (
        <div key={node.path}>
          <div 
            onClick={() => handleFileClick(node.path, node.isDirectory)}
            className={`flex items-center justify-between py-[5px] cursor-pointer group transition-all duration-100 rounded-[4px] mx-1 ${
              isSelected 
                ? 'bg-[#1a2e23] text-white' 
                : 'hover:bg-[#ffffff06] text-[var(--kiri-body)]'
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: '8px' }}
          >
            <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
              {/* Chevron for directories */}
              {node.isDirectory ? (
                <span className="flex items-center justify-center w-4 h-4 shrink-0 text-[var(--kiri-muted)] transition-transform duration-150">
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </span>
              ) : (
                /* Spacer for files to align with folder names */
                <span className="w-4 h-4 shrink-0" />
              )}

              {/* Icon */}
              <span className="shrink-0 flex items-center">
                {node.isDirectory ? (
                  <span className="text-[var(--kiri-gold)]">
                    {isExpanded ? '📂' : '📁'}
                  </span>
                ) : (
                  getFileIcon(node.name)
                )}
              </span>

              {/* Name */}
              <span className={`truncate select-none text-[12px] ${
                isSelected ? 'text-white font-medium' : 'group-hover:text-white'
              } transition-colors`}>
                {node.name}
              </span>
            </div>

            {/* Delete button */}
            <button 
              onClick={(e) => handleDelete(e, node.path, node.isDirectory)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--kiri-muted)] hover:text-red-400 transition-all shrink-0 rounded"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {/* Children (only render if expanded) */}
          {node.isDirectory && isExpanded && node.children && node.children.length > 0 && (
            <div className="relative">
              {/* Tree guide line */}
              <div 
                className="absolute top-0 bottom-0 border-l border-[#ffffff08]"
                style={{ left: `${depth * 16 + 20}px` }}
              />
              {renderTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-5 rounded bg-[#ffffff06] animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[var(--kiri-bg)] flex flex-col text-xs font-medium text-[var(--kiri-body)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--kiri-border)] shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--kiri-muted)]">Files</span>
        <div className="flex items-center gap-1">
          <button onClick={handleCreateFile} className="p-1 hover:bg-[#ffffff08] rounded text-[var(--kiri-muted)] hover:text-[var(--kiri-green)] transition-colors" title="New File">
            <FilePlus size={14} />
          </button>
          <button onClick={handleCreateFolder} className="p-1 hover:bg-[#ffffff08] rounded text-[var(--kiri-muted)] hover:text-[var(--kiri-green)] transition-colors" title="New Folder">
            <FolderPlus size={14} />
          </button>
          <button onClick={fetchFiles} className="p-1 hover:bg-[#ffffff08] rounded text-[var(--kiri-muted)] hover:text-[var(--kiri-green)] transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
        {files.length === 0 ? (
          <div className="text-[var(--kiri-muted)] italic p-4 text-center opacity-70 text-[11px]">
            Workspace is empty. Ask the AI Agent to scaffold an app!
          </div>
        ) : (
          renderTree(files)
        )}
      </div>
    </div>
  );
};

export default FileTree;
