import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Timer,
  BarChart3,
  Settings,
  Calendar,
  Inbox,
  CheckCircle2,
  Command,
  Search,
} from 'lucide-react';
import { CommandPalette } from '@/components/CommandPalette';
import { useHotkeys } from 'react-hotkeys-hook';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Keyboard shortcuts for navigation
  useHotkeys('g h', () => navigate('/'));
  useHotkeys('g i', () => navigate('/inbox'));
  useHotkeys('g f', () => navigate('/focus'));
  useHotkeys('g d', () => navigate('/done'));
  useHotkeys('g a', () => navigate('/analytics'));
  useHotkeys('g s', () => navigate('/settings'));

  const menuItems = [
    { title: 'Today', icon: Calendar, path: '/', badge: '3' },
    { title: 'Inbox', icon: Inbox, path: '/inbox', badge: '5' },
    { title: 'Focus', icon: Timer, path: '/focus' },
    { title: 'Done', icon: CheckCircle2, path: '/done' },
    { title: 'Analytics', icon: BarChart3, path: '/analytics' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <SidebarProvider>
      <CommandPalette />
      <div className="flex h-screen w-full">
        <Sidebar className="border-r border-border bg-sidebar">
          <SidebarContent>
            <div className="px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl tracking-tight text-foreground" style={{ fontWeight: 600 }}>
                    VibePilot
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1">Task Management</p>
                </div>
                <button
                  onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true }))}
                  className="p-1.5 rounded-lg hover:bg-accent transition-smooth group"
                  title="Open command palette (Cmd+K)"
                >
                  <Command className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </button>
              </div>
            </div>

            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        isActive={location.pathname === item.path}
                        className="w-full transition-smooth hover:bg-accent rounded-lg"
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {item.badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full text-muted-foreground">
                      <span className="text-xs">+ Add Project</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b border-border bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger />
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Quick add task... (Press N)"
                  className="w-full max-w-md px-4 py-2 bg-surface border border-border rounded-lg transition-smooth focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm"
                />
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth text-sm shadow-sm hover:shadow-md" style={{ fontWeight: 500 }}>
                <Command className="h-3.5 w-3.5" />
                Plan My Day
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-surface text-foreground rounded-lg hover:bg-surface-hover transition-smooth text-sm border border-border" style={{ fontWeight: 500 }}>
                <Search className="h-3.5 w-3.5" />
                Search
                <kbd className="hidden lg:inline-flex h-4 px-1 text-[10px] font-mono bg-background rounded border border-border ml-auto">/</kbd>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}