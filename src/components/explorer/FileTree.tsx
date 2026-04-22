import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { 
  File, Folder, FolderOpen, ChevronRight, ChevronDown,
  FileCode, FileJson, FileText, FileImage, Search,
  Trash2, Edit3, Copy, Plus, FolderPlus, RefreshCw
} from 'lucide-react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { useProject } from '~/contexts';
import { ScrollArea } from '../ui/Misc';
import { getWebContainer } from '~/lib/services/webcontainer';

const FILE_ICONS: Record<string, ReactNode> = {
  ts: <FileCode size={14} className="text-blue-400" />,
  tsx: <FileCode size={14} className="text-blue-400" />,
  js: <FileCode size={14} className="text-yellow-400" />,
  jsx: <FileCode size={14} className="text-yellow-400" />,
  css: <FileCode size={14} className="text-purple-400" />,
  scss: <FileCode size={14} className="text-purple-400" />,
  html: <FileCode size={14} className="text-orange-400" />,
  json: <FileJson size={14} className="text-yellow-300" />,
  md: <FileText size={14} className="text-gray-400" />,
  py: <FileCode size={14} className="text-green-400" />,
  svg: <FileImage size={14} className="text-pink-400" />,
  png: <FileImage size={14} className="text-pink-400" />,
  jpg: <FileImage size={14} className="text-pink-400" />,
  jpeg: <FileImage size={14} className="text-pink-400" />,
};

interface FileTreeNodeProps {
  node: {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: { name: string; path: string; isDirectory: boolean }[];
  };
  depth: number;
  onSelect: (path: string, isDirectory: boolean) => void;
  onToggle: (path: string) => void;
  isExpanded: boolean;
  isSelected: boolean;
  onDelete: (path: string, isDirectory: boolean) => void;
  onRename: (oldPath: string, newPath: string) => void;
}

function FileTreeNode({ 
  node, 
  depth, 
  onSelect, 
  onToggle, 
  isExpanded, 
  isSelected,
  onDelete,
  onRename,
}: FileTreeNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const getIcon = () => {
    if (node.isDirectory) {
      return isExpanded ? <FolderOpen size={14} className="text-yellow-400" /> : <Folder size={14} className="text-yellow-400" />;
    }
    const ext = node.name.split('.').pop()?.toLowerCase();
    return FILE_ICONS[ext || ''] || <File size={14} className="text-gray-500" />;
  };

  const handleRenameSubmit = () => {
    if (editName && editName !== node.name) {
      const newPath = node.path.replace(node.name, editName);
      onRename(node.path, newPath);
    }
    setIsEditing(false);
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          onClick={() => {
            if (node.isDirectory) onToggle(node.path);
            onSelect(node.path, node.isDirectory);
          }}
          className={`
            flex items-center justify-between py-1.5 cursor-pointer group
            transition-all duration-100 rounded mx-1
            ${isSelected 
              ? 'bg-[var(--kiri-green)]/15 text-[var(--kiri-green)]' 
              : 'hover:bg-[#ffffff06] text-[var(--kiri-body)]'
            }
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: '8px' }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {node.isDirectory ? (
              <span className="w-4 h-4 flex items-center justify-center text-[var(--kiri-muted)]">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            ) : (
              <span className="w-4 h-4" />
            )}
            <span className="shrink-0">{getIcon()}</span>
            {isEditing ? (
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="bg-[var(--kiri-bg)] border border-[var(--kiri-green)] rounded px-1 text-xs w-full"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate text-xs">{node.name}</span>
            )}
          </div>
        </div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[160px] bg-[var(--kiri-surface)] border border-[var(--kiri-border)] rounded-lg shadow-xl p-1">
          <ContextMenu.Item 
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--kiri-body)] hover:bg-[#ffffff08] rounded cursor-pointer"
            onSelect={() => setIsEditing(true)}
          >
            <Edit3 size={12} />
            Rename
          </ContextMenu.Item>
          <ContextMenu.Item className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--kiri-body)] hover:bg-[#ffffff08] rounded cursor-pointer">
            <Copy size={12} />
            Copy Path
          </ContextMenu.Item>
          <ContextMenu.Separator className="h-px bg-[var(--kiri-border)] my-1" />
          <ContextMenu.Item 
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
            onSelect={() => onDelete(node.path, node.isDirectory)}
          >
            <Trash2 size={12} />
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

export function FileTree({ className = '' }: { className?: string }) {
  const { files, isLoading } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleSelect = useCallback((path: string, isDirectory: boolean) => {
    setSelectedPath(path);
    if (!isDirectory) {
      window.dispatchEvent(new CustomEvent('kiri:open-file', { detail: { path } }));
    }
  }, []);

  const handleDelete = useCallback(async (path: string, isDirectory: boolean) => {
    if (!confirm(`Delete ${path}?`)) return;
    const wc = await getWebContainer();
    await wc.fs.rm(path, { recursive: isDirectory });
    window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
  }, []);

  const handleRename = useCallback(async (oldPath: string, newPath: string) => {
    const wc = await getWebContainer();
    const content = await wc.fs.readFile(oldPath, 'utf8');
    await wc.fs.writeFile(newPath, content);
    await wc.fs.rm(oldPath);
    window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
  }, []);

  const handleCreateFile = async () => {
    const name = prompt('File name:');
    if (!name) return;
    try {
      const wc = await getWebContainer();
      await wc.fs.writeFile(name, '');
      window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Folder name:');
    if (!name) return;
    try {
      const wc = await getWebContainer();
      await wc.fs.mkdir(name);
      window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFiles = searchQuery 
    ? filterFiles(files, searchQuery.toLowerCase())
    : files;

  if (isLoading) {
    return (
      <div className={`p-4 space-y-2 ${className}`}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-5 rounded bg-[#ffffff06] animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--kiri-border)] bg-[var(--kiri-surface-subtle)]">
        <span className="text-[10px] font-bold text-[var(--kiri-muted)] uppercase tracking-widest">Files</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleCreateFile}
            className="p-1 rounded hover:bg-[#ffffff08] text-[var(--kiri-muted)] hover:text-white transition-colors"
            title="New File"
          >
            <Plus size={14} />
          </button>
          <button 
            onClick={handleCreateFolder}
            className="p-1 rounded hover:bg-[#ffffff08] text-[var(--kiri-muted)] hover:text-white transition-colors"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('kiri:fs-updated'))}
            className="p-1 rounded hover:bg-[#ffffff08] text-[var(--kiri-muted)] hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div className="p-2 border-b border-[var(--kiri-border)]">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--kiri-muted)]" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--kiri-bg)] border border-[var(--kiri-border)] rounded pl-7 pr-2 py-1.5 text-xs text-[var(--kiri-body)] placeholder-[var(--kiri-muted)] focus:outline-none focus:border-[var(--kiri-green)]"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--kiri-muted)]">
            {searchQuery ? 'No files found' : 'Workspace is empty'}
          </div>
        ) : (
          filteredFiles.map(node => (
            <FileTreeNode
              key={node.path}
              node={node}
              depth={0}
              onSelect={handleSelect}
              onToggle={handleToggle}
              isExpanded={expandedPaths.has(node.path)}
              isSelected={selectedPath === node.path}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
}

function filterFiles(files: any[], query: string): any[] {
  const result: any[] = [];
  
  for (const file of files) {
    if (file.name.toLowerCase().includes(query)) {
      result.push(file);
    } else if (file.isDirectory && file.children) {
      const filtered = filterFiles(file.children, query);
      if (filtered.length > 0) {
        result.push({ ...file, children: filtered });
      }
    }
  }
  
  return result;
}