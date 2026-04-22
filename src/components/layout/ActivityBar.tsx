import { 
  FolderTree, GitBranch, MessageSquare, Settings, 
  Search
} from 'lucide-react';

interface ActivityBarProps {
  className?: string;
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const ACTIVITY_ITEMS = [
  { id: 'explorer', icon: FolderTree, label: 'Explorer', shortcut: '⌘B' },
  { id: 'search', icon: Search, label: 'Search', shortcut: '⌘F' },
  { id: 'github', icon: GitBranch, label: 'Source Control', shortcut: '⌘⇧G' },
  { id: 'chat', icon: MessageSquare, label: 'AI Chat', shortcut: '⌘L' },
];

export function ActivityBar({ className = '', activeItem, setActiveItem }: ActivityBarProps) {

  return (
    <div className={`w-11 shrink-0 flex flex-col items-center py-3 gap-1 border-r border-[var(--kiri-border)] bg-[var(--kiri-surface)] ${className}`}>
      <div className="flex flex-col gap-1">
        {ACTIVITY_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`
                p-2 rounded-lg transition-all duration-150 relative
                ${isActive 
                  ? 'bg-[var(--kiri-green)]/15 text-[var(--kiri-green)]' 
                  : 'text-[var(--kiri-muted)] hover:text-white hover:bg-[#ffffff08]'
                }
              `}
              title={`${item.label} (${item.shortcut})`}
            >
              <Icon size={18} />
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-[var(--kiri-green)] rounded-r" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <button
        onClick={() => window.dispatchEvent(new CustomEvent('kiri:open-settings'))}
        className="p-2 rounded-lg text-[var(--kiri-muted)] hover:text-white hover:bg-[#ffffff08] transition-colors"
        title="Settings"
      >
        <Settings size={18} />
      </button>
    </div>
  );
}