/**
 * ComponentLibrary - Browse and insert reusable UI components
 *
 * Features:
 * - shadcn/ui component catalog
 * - Search and filter
 * - Code preview
 * - One-click insert into editor
 * - Custom component library support
 */
import React, { useMemo,useState } from 'react';
import { AnimatePresence,motion } from 'framer-motion';
import {
  Check,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Eye,
  Filter,
  Package,
  Search,
  Star,
} from 'lucide-react';
import styled from 'styled-components';

import { logger } from '../services/Logger';
import { vibeTheme } from '../styles/theme';

const LibraryContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${vibeTheme.colors.secondary};
  border-radius: 12px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${vibeTheme.colors.elevated};
  border-bottom: 1px solid ${vibeTheme.colors.border};
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${vibeTheme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: ${vibeTheme.colors.primary};
  border-bottom: 1px solid ${vibeTheme.colors.border};
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 12px 10px 36px;
  border-radius: 8px;
  border: 1px solid ${vibeTheme.colors.border};
  background: ${vibeTheme.colors.secondary};
  color: ${vibeTheme.colors.textPrimary};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.cyan};
  }

  &::placeholder {
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 32px;
  color: ${vibeTheme.colors.textSecondary};
  pointer-events: none;
`;

const FilterButton = styled.button`
  padding: 10px;
  border-radius: 8px;
  border: 1px solid ${vibeTheme.colors.border};
  background: ${vibeTheme.colors.secondary};
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;

  &:hover {
    border-color: ${vibeTheme.colors.cyan};
    color: ${vibeTheme.colors.cyan};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const CategorySection = styled.div`
  margin-bottom: 24px;
`;

const CategoryTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${vibeTheme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const ComponentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
`;

const ComponentCard = styled(motion.div)`
  padding: 16px;
  border-radius: 8px;
  border: 1px solid ${vibeTheme.colors.border};
  background: ${vibeTheme.colors.primary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${vibeTheme.colors.cyan};
    background: ${vibeTheme.colors.elevated};
  }
`;

const ComponentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ComponentName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${vibeTheme.colors.textPrimary};
`;

const ComponentBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  background: ${vibeTheme.colors.cyan}20;
  color: ${vibeTheme.colors.cyan};
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
`;

const ComponentDescription = styled.p`
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  line-height: 1.4;
  margin-bottom: 12px;
`;

const ComponentActions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid ${vibeTheme.colors.border};
  background: transparent;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: ${vibeTheme.colors.cyan};
    background: ${vibeTheme.colors.cyan}10;
    color: ${vibeTheme.colors.cyan};
  }
`;

const PreviewModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px;
`;

const PreviewCard = styled.div`
  background: ${vibeTheme.colors.secondary};
  border-radius: 12px;
  max-width: 900px;
  max-height: 90vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PreviewHeader = styled.div`
  padding: 20px;
  background: ${vibeTheme.colors.elevated};
  border-bottom: 1px solid ${vibeTheme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PreviewTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${vibeTheme.colors.textPrimary};
`;

const PreviewContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const CodeBlock = styled.pre`
  padding: 16px;
  border-radius: 8px;
  background: ${vibeTheme.colors.primary};
  border: 1px solid ${vibeTheme.colors.border};
  overflow-x: auto;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: ${vibeTheme.colors.textPrimary};

  code {
    font-family: inherit;
  }
`;

export interface UIComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  tags: string[];
  popular?: boolean;
}

// shadcn/ui component catalog
const SHADCN_COMPONENTS: UIComponent[] = [
  {
    id: 'button',
    name: 'Button',
    category: 'Form',
    description: 'Displays a button with variants and sizes',
    tags: ['shadcn', 'button', 'form'],
    popular: true,
    code: `import { Button } from '@/components/ui/button';

export function ButtonDemo() {
  return (
    <div className="flex gap-4">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  );
}`,
  },
  {
    id: 'card',
    name: 'Card',
    category: 'Layout',
    description: 'Container for content with header, title, and description',
    tags: ['shadcn', 'card', 'layout'],
    popular: true,
    code: `import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function CardDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
}`,
  },
  {
    id: 'input',
    name: 'Input',
    category: 'Form',
    description: 'Text input field with label support',
    tags: ['shadcn', 'input', 'form'],
    code: `import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function InputDemo() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  );
}`,
  },
  {
    id: 'dialog',
    name: 'Dialog',
    category: 'Overlay',
    description: 'Modal dialog with header, content, and footer',
    tags: ['shadcn', 'dialog', 'modal', 'overlay'],
    popular: true,
    code: `import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}`,
  },
  {
    id: 'dropdown-menu',
    name: 'Dropdown Menu',
    category: 'Navigation',
    description: 'Dropdown menu with items and sub-menus',
    tags: ['shadcn', 'dropdown', 'menu', 'navigation'],
    code: `import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`,
  },
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'Navigation',
    description: 'Tabbed interface with content panels',
    tags: ['shadcn', 'tabs', 'navigation'],
    code: `import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TabsDemo() {
  return (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Make changes to your account here.
      </TabsContent>
      <TabsContent value="password">
        Change your password here.
      </TabsContent>
    </Tabs>
  );
}`,
  },
  {
    id: 'toast',
    name: 'Toast',
    category: 'Feedback',
    description: 'Temporary notification message',
    tags: ['shadcn', 'toast', 'notification', 'feedback'],
    code: `import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function ToastDemo() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Scheduled: Catch up",
          description: "Friday, February 10, 2023 at 5:57 PM",
        });
      }}
    >
      Show Toast
    </Button>
  );
}`,
  },
  {
    id: 'select',
    name: 'Select',
    category: 'Form',
    description: 'Dropdown select with options',
    tags: ['shadcn', 'select', 'form', 'dropdown'],
    code: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SelectDemo() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  );
}`,
  },
];

interface ComponentLibraryProps {
  onInsertComponent?: (code: string) => void;
}

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onInsertComponent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<UIComponent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Group components by category
  const groupedComponents = useMemo(() => {
    const filtered = SHADCN_COMPONENTS.filter((comp) => {
      const query = searchQuery.toLowerCase();
      return (
        comp.name.toLowerCase().includes(query) ||
        comp.description.toLowerCase().includes(query) ||
        comp.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });

    return filtered.reduce((acc, comp) => {
      if (!acc[comp.category]) {
        acc[comp.category] = [];
      }
      acc[comp.category].push(comp);
      return acc;
    }, {} as Record<string, UIComponent[]>);
  }, [searchQuery]);

  const handleCopy = async (component: UIComponent) => {
    try {
      await navigator.clipboard.writeText(component.code);
      setCopiedId(component.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
    }
  };

  const handleInsert = (component: UIComponent) => {
    onInsertComponent?.(component.code);
  };

  return (
    <LibraryContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Header>
        <Title>
          <Package size={20} />
          Component Library
        </Title>
      </Header>

      <SearchBar>
        <div style={{ position: 'relative', flex: 1 }}>
          <SearchIcon>
            <Search size={16} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <FilterButton>
          <Filter size={16} />
          Filter
        </FilterButton>
      </SearchBar>

      <Content>
        {Object.entries(groupedComponents).map(([category, components]) => (
          <CategorySection key={category}>
            <CategoryTitle>{category}</CategoryTitle>
            <ComponentGrid>
              {components.map((component) => (
                <ComponentCard
                  key={component.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ComponentHeader>
                    <ComponentName>{component.name}</ComponentName>
                    {component.popular && (
                      <ComponentBadge>
                        <Star size={10} style={{ display: 'inline', marginRight: 4 }} />
                        Popular
                      </ComponentBadge>
                    )}
                  </ComponentHeader>
                  <ComponentDescription>{component.description}</ComponentDescription>
                  <ComponentActions>
                    <IconButton onClick={() => setSelectedComponent(component)}>
                      <Eye size={14} />
                      View
                    </IconButton>
                    <IconButton onClick={() => handleCopy(component)}>
                      {copiedId === component.id ? <Check size={14} /> : <Copy size={14} />}
                    </IconButton>
                    {onInsertComponent && (
                      <IconButton onClick={() => handleInsert(component)}>
                        <Download size={14} />
                      </IconButton>
                    )}
                  </ComponentActions>
                </ComponentCard>
              ))}
            </ComponentGrid>
          </CategorySection>
        ))}
      </Content>

      <AnimatePresence>
        {selectedComponent && (
          <PreviewModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedComponent(null)}
          >
            <PreviewCard onClick={(e) => e.stopPropagation()}>
              <PreviewHeader>
                <PreviewTitle>{selectedComponent.name}</PreviewTitle>
                <IconButton onClick={() => setSelectedComponent(null)}>Close</IconButton>
              </PreviewHeader>
              <PreviewContent>
                <ComponentDescription>{selectedComponent.description}</ComponentDescription>
                <CodeBlock>
                  <code>{selectedComponent.code}</code>
                </CodeBlock>
              </PreviewContent>
            </PreviewCard>
          </PreviewModal>
        )}
      </AnimatePresence>
    </LibraryContainer>
  );
};

export default ComponentLibrary;
