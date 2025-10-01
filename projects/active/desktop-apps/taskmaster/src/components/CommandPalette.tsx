import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Calendar,
  Timer,
  BarChart3,
  Settings,
  Plus,
  Search,
  CheckCircle2,
  Home,
  Moon,
  Sun,
  Inbox,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Toggle command palette with Cmd+K or Ctrl+K
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setOpen((prev) => !prev);
  });

  // Close on Escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: CommandItem[] = [
    {
      id: 'home',
      label: 'Go to Home',
      icon: Home,
      action: () => {
        navigate('/');
        setOpen(false);
      },
      keywords: ['dashboard', 'main'],
      shortcut: 'G H',
    },
    {
      id: 'tasks',
      label: 'View Tasks',
      icon: Calendar,
      action: () => {
        navigate('/');
        setOpen(false);
      },
      keywords: ['todo', 'list'],
      shortcut: 'G T',
    },
    {
      id: 'new-task',
      label: 'Create New Task',
      icon: Plus,
      action: () => {
        // TODO: Open new task modal
        console.log('Create new task');
        setOpen(false);
      },
      keywords: ['add', 'new', 'create'],
      shortcut: 'N',
    },
    {
      id: 'inbox',
      label: 'Go to Inbox',
      icon: Inbox,
      action: () => {
        navigate('/inbox');
        setOpen(false);
      },
      keywords: ['messages', 'notifications'],
      shortcut: 'G I',
    },
    {
      id: 'focus',
      label: 'Start Focus Session',
      icon: Timer,
      action: () => {
        navigate('/focus');
        setOpen(false);
      },
      keywords: ['pomodoro', 'timer', 'work'],
      shortcut: 'G F',
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      icon: BarChart3,
      action: () => {
        navigate('/analytics');
        setOpen(false);
      },
      keywords: ['stats', 'reports', 'dashboard'],
      shortcut: 'G A',
    },
    {
      id: 'done',
      label: 'View Completed Tasks',
      icon: CheckCircle2,
      action: () => {
        navigate('/done');
        setOpen(false);
      },
      keywords: ['completed', 'finished'],
      shortcut: 'G D',
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: Settings,
      action: () => {
        navigate('/settings');
        setOpen(false);
      },
      keywords: ['preferences', 'config'],
      shortcut: 'G S',
    },
    {
      id: 'search',
      label: 'Search Tasks',
      icon: Search,
      action: () => {
        // TODO: Open search
        console.log('Search tasks');
        setOpen(false);
      },
      keywords: ['find', 'filter'],
      shortcut: '/',
    },
    {
      id: 'theme',
      label: 'Toggle Theme',
      icon: Moon,
      action: () => {
        // TODO: Toggle theme
        console.log('Toggle theme');
        setOpen(false);
      },
      keywords: ['dark', 'light', 'mode'],
      shortcut: 'T',
    },
  ];

  const filteredCommands = commands.filter((command) => {
    const searchLower = search.toLowerCase();
    return (
      command.label.toLowerCase().includes(searchLower) ||
      command.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl">
        <Command className="bg-surface rounded-xl shadow-2xl border border-border overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-surface px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Quick Actions" className="text-xs font-medium text-muted-foreground px-2 py-2">
              {filteredCommands.filter(cmd => ['new-task', 'focus', 'search'].includes(cmd.id)).map((command) => (
                <Command.Item
                  key={command.id}
                  onSelect={command.action}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-smooth hover:bg-accent group"
                >
                  <command.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  <span className="flex-1 text-sm">{command.label}</span>
                  {command.shortcut && (
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {command.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigation" className="text-xs font-medium text-muted-foreground px-2 py-2">
              {filteredCommands.filter(cmd => ['home', 'tasks', 'inbox', 'analytics', 'done', 'settings'].includes(cmd.id)).map((command) => (
                <Command.Item
                  key={command.id}
                  onSelect={command.action}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-smooth hover:bg-accent group"
                >
                  <command.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  <span className="flex-1 text-sm">{command.label}</span>
                  {command.shortcut && (
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {command.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            {/* Other */}
            <Command.Group heading="Other" className="text-xs font-medium text-muted-foreground px-2 py-2">
              {filteredCommands.filter(cmd => ['theme'].includes(cmd.id)).map((command) => (
                <Command.Item
                  key={command.id}
                  onSelect={command.action}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-smooth hover:bg-accent group"
                >
                  <command.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  <span className="flex-1 text-sm">{command.label}</span>
                  {command.shortcut && (
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {command.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}