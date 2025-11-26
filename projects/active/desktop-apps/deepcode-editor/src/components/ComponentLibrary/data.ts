/**
 * ComponentLibrary Data - shadcn/ui component catalog
 */
import type { UIComponent } from './types';

export const SHADCN_COMPONENTS: UIComponent[] = [
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
