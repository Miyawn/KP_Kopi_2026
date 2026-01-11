# Quick Start: Using New Components

## 🚀 Get Started in 30 Seconds

### 1. Import a Component
```jsx
import { Badge } from '@/components/ui/badge'
```

### 2. Use It
```jsx
<Badge variant="default">New Component</Badge>
```

### 3. Customize
```jsx
<Badge 
  variant="destructive" 
  className="ml-2"
>
  Sale
</Badge>
```

## 📚 Component Quick Reference

### Badge - Labels
```jsx
import { Badge } from '@/components/ui/badge'

// Variants: default, secondary, destructive, outline
<Badge variant="default">Category</Badge>
<Badge variant="secondary">Info</Badge>
<Badge variant="destructive">Urgent</Badge>
<Badge variant="outline">Optional</Badge>
```

### Separator - Dividers
```jsx
import { Separator } from '@/components/ui/separator'

// Horizontal
<Separator />

// Vertical
<Separator orientation="vertical" />

// Decorative
<Separator decorative />
```

### Alert - Notifications
```jsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Check } from 'lucide-react'

// Info Alert
<Alert variant="default">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Info</AlertTitle>
  <AlertDescription>This is informational</AlertDescription>
</Alert>

// Success Alert
<Alert variant="success">
  <Check className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Operation completed!</AlertDescription>
</Alert>

// Error Alert
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong</AlertDescription>
</Alert>
```

### Accordion - Expandable Content
```jsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>How do I use it?</AccordionTrigger>
    <AccordionContent>
      Import and use the component in your JSX.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Tabs - Tab Navigation
```jsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="coffee">
  <TabsList>
    <TabsTrigger value="coffee">Coffee</TabsTrigger>
    <TabsTrigger value="tea">Tea</TabsTrigger>
  </TabsList>
  <TabsContent value="coffee">
    Coffee drinks...
  </TabsContent>
  <TabsContent value="tea">
    Tea drinks...
  </TabsContent>
</Tabs>
```

### Dialog - Modals
```jsx
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    <p>Modal content goes here</p>
  </DialogContent>
</Dialog>
```

### Dropdown Menu - Context Menus
```jsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Avatar - User Profiles
```jsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```

### Popover - Info Panels
```jsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">More Info</Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>This is a popover with additional information</p>
  </PopoverContent>
</Popover>
```

## 🎨 Color Variants

### All Components Use Primary Color
By default, all components use the **primary color** (amber-700):

```css
--primary: 38 92% 50%  /* amber-700 */
```

### To Change the Color Globally
Edit `src/index.css`:

```css
:root {
  --primary: 240 10% 60%;  /* Change to any HSL value */
}
```

All components update automatically! ✨

## 🔧 Common Customization

### Custom Styling
All components support `className`:

```jsx
<Badge className="text-lg font-bold">
  Large Badge
</Badge>

<Button className="w-full h-12 text-xl">
  Full Width Button
</Button>
```

### Disabled State
Most interactive components support `disabled`:

```jsx
<Button disabled>Disabled Button</Button>

<DropdownMenuItem disabled>
  Disabled Option
</DropdownMenuItem>
```

### Size Variants
Components support different sizes:

```jsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

## ⌨️ Keyboard Navigation

All components support keyboard navigation:

| Key | Action |
|-----|--------|
| `Tab` | Move to next element |
| `Shift+Tab` | Move to previous |
| `Enter` | Activate/select |
| `Space` | Toggle/open |
| `Escape` | Close menus/dialogs |
| `Arrow Keys` | Navigate lists |
| `Home/End` | Jump to start/end |

## 🎯 Usage Examples in Your App

### In MenuCard
```jsx
import { Badge } from '@/components/ui/badge'

<Badge variant="default">Espresso</Badge>
```

### In About Page
```jsx
import { Accordion, ... } from '@/components/ui/accordion'

<Accordion type="single" collapsible>
  {/* FAQ items */}
</Accordion>
```

### In Admin Dashboard
```jsx
import { Dialog, ... } from '@/components/ui/dialog'
import { DropdownMenu, ... } from '@/components/ui/dropdown-menu'

// Modal for editing
// Menu for actions
```

### In Navbar (Future)
```jsx
import { DropdownMenu, ... } from '@/components/ui/dropdown-menu'

<DropdownMenu>
  {/* User menu */}
</DropdownMenu>
```

## 🚨 Common Issues & Solutions

### Component not showing?
```bash
# Clear cache
Ctrl + Shift + Delete

# Restart dev server
npm run dev
```

### Styling looks wrong?
1. Check CSS variables in `src/index.css`
2. Verify Tailwind config has color extensions
3. Check for conflicting CSS classes

### Can't import component?
- Verify file path: `@/components/ui/component-name`
- Check component exists: `src/components/ui/`
- Use correct destructuring for multiple exports

## 📖 Full Documentation

For complete documentation:
- **COMPONENTS.md** - All components with details
- **COMPONENTS_GUIDE.md** - Complete usage guide
- **Component Showcase** - `/components` route in app

## 🎁 Pro Tips

### 1. Use `asChild` for Flexibility
```jsx
<Dialog>
  <DialogTrigger asChild>
    <CustomButton>Open</CustomButton>
  </DialogTrigger>
</Dialog>
```

### 2. Combine Components
```jsx
<Alert variant="success">
  <Badge className="mb-2">Important</Badge>
  <AlertTitle>Success</AlertTitle>
</Alert>
```

### 3. Dynamic Content
```jsx
{items.map((item) => (
  <Badge key={item.id} variant="default">
    {item.name}
  </Badge>
))}
```

### 4. Conditional Variants
```jsx
<Badge variant={isPriority ? "destructive" : "default"}>
  {status}
</Badge>
```

## 🚀 What's Next?

1. **Start using components** in your pages
2. **Customize colors** in `src/index.css`
3. **Read full guides** in COMPONENTS_GUIDE.md
4. **Browse showcase** at `/components`

---

**Happy coding!** 🎉
