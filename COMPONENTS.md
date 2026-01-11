# shadcn/ui Components Library - KP Kopi 2026

## Overview
This project has been enhanced with a comprehensive collection of shadcn/ui components, all styled with the primary amber-700 color palette (38° 92% 50% in HSL).

## Installed Components

### 1. **Button** ✅
- **Variants**: default, secondary, destructive, outline, ghost
- **Sizes**: sm, md, lg
- **Usage**: Primary interactive element throughout the app
- **Color**: Uses primary color for default variant

### 2. **Card** ✅
- **Features**: Container component with proper spacing and borders
- **Usage**: Wraps menu items, content sections, forms
- **Styling**: White background with subtle border, hover shadow

### 3. **Input** ✅
- **Features**: Form input field with focus states
- **Usage**: Search, filter, and form fields
- **Validation**: Error states supported

### 4. **Label** ✅
- **Features**: Form label component
- **Usage**: Label for input fields
- **Accessibility**: Proper semantic HTML

### 5. **Select** ✅
- **Features**: Dropdown select component
- **Usage**: Category selection, filtering
- **State Management**: Open/close with keyboard navigation

### 6. **Badge** ✅ (NEW)
- **Variants**: default (primary), secondary, destructive, outline
- **Usage**: Category labels, status indicators, tags
- **Current**: Used in MenuCard component for category display

### 7. **Separator** ✅ (NEW)
- **Orientation**: Horizontal and vertical
- **Usage**: Visual dividers between sections
- **Decorative**: Optional semantic separator role

### 8. **Tabs** ✅ (NEW)
- **Features**: Tabbed interface for content organization
- **Usage**: Menu categories, section navigation
- **Accessibility**: Full keyboard navigation support

### 9. **Accordion** ✅ (NEW)
- **Features**: Expandable/collapsible content sections
- **Usage**: FAQ section, collapsible details
- **Current**: Implemented in About page FAQ section
- **Animation**: Smooth expand/collapse with accordion transitions

### 10. **Dialog/Modal** ✅ (NEW)
- **Features**: Modal dialog with overlay
- **Usage**: Confirmations, forms, menu preview
- **Accessibility**: Focus management, escape key to close

### 11. **Popover** ✅ (NEW)
- **Features**: Floating content panel
- **Usage**: Tooltips, popovers, context menus
- **Positioning**: Smart positioning with side offset

### 12. **Avatar** ✅ (NEW)
- **Features**: User avatar with fallback
- **Usage**: User profiles, team member display
- **Fallback**: Text initials when image unavailable

### 13. **Dropdown Menu** ✅ (NEW)
- **Features**: Contextual menu with submenus
- **Items**: Checkbox items, radio items, separators
- **Usage**: User menu, navigation, actions
- **Keyboard**: Full keyboard navigation support

### 14. **Alert** ✅ (NEW)
- **Variants**: default, destructive, success
- **Usage**: System notifications, warnings, confirmations
- **Icons**: Support for leading icons via lucide-react

## Integration Examples

### MenuCard with Badge
```jsx
<Badge variant="default" className="font-medium">
  {menu.category}
</Badge>
```

### About Page with Accordion
```jsx
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Question?</AccordionTrigger>
    <AccordionContent>Answer content here</AccordionContent>
  </AccordionItem>
</Accordion>
```

### Alert Usage
```jsx
<Alert variant="success">
  <Check className="h-4 w-4" />
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>Your order has been placed.</AlertDescription>
</Alert>
```

## Color Palette System

All components use the unified color palette with CSS variables:

- **Primary**: `hsl(38 92% 50%)` - amber-700
- **Secondary**: `hsl(0 0% 96.1%)` - light gray
- **Destructive**: `hsl(0 84.2% 60.2%)` - red
- **Foreground**: `hsl(0 0% 3.6%)` - dark gray
- **Border**: `hsl(0 0% 89.8%)` - light gray
- **Muted**: `hsl(0 0% 96.1%)` - muted gray

## Design System Standards

### Spacing
- Card padding: `p-5` or `p-8`
- Button height: `h-10`
- Navbar height: `h-16`
- Gap between items: `gap-6`

### Typography
- Headings: `font-black` (700 weight)
- Emphasis: `font-bold`
- Labels: `font-semibold`
- Body: `font-medium`

### Rounded Corners
- Standard: `rounded-lg` (0.5rem)
- Full: `rounded-full`

### Shadows
- Button hover: `hover:shadow-lg`
- Card hover: `hover:shadow-xl`
- Navbar: `shadow-sm`

### Animations
- Hover lift: `-translate-y-1`
- Transitions: `transition-all duration-300`
- Accordion: Custom accordion animations

## Pages Using New Components

### Home Page
- Uses: Button, Card, Badge (in MenuCard)
- Future: Can use Tabs for category switching

### About Page
- Uses: Accordion for FAQ section
- Structure: Proper expandable content with icons

### Component Showcase
- Route: `/components`
- Purpose: Display all available components and color palette
- Demonstrates: Badges, Buttons, Alerts, color system

## Build Information

**Last Build**: ✅ Successful
- Modules transformed: 1833
- CSS size: 34.56 kB (gzip: 6.73 kB)
- JS size: 406.50 kB (gzip: 125.83 kB)
- Build time: 6.64s
- Errors: 0
- Warnings: 0

## Dependencies Added

```json
{
  "@radix-ui/react-accordion": "^1.0.0",
  "@radix-ui/react-avatar": "^1.0.0",
  "@radix-ui/react-dialog": "^1.1.0",
  "@radix-ui/react-dropdown-menu": "^2.0.0",
  "@radix-ui/react-popover": "^1.0.0",
  "@radix-ui/react-tabs": "^1.0.0"
}
```

## Next Steps

### Available for Implementation
- Pagination: For large menu lists
- Table: Enhanced admin dashboard
- Slider: For price range filtering
- Toggle: For theme/view options
- Toast/Sonner: System notifications
- Scroll Area: For custom scrollbars
- Context Menu: Right-click menus
- Command: Search/command palette

### Integration Opportunities
1. **Dropdown Menu**: User profile menu in Navbar
2. **Dialog**: Menu item preview/details modal
3. **Tabs**: Menu categories as tabs instead of buttons
4. **Toast**: Order confirmation notifications
5. **Pagination**: Pagination for menu items on Home
6. **Table**: Admin menu management interface
7. **Avatar**: Team member section on About page

## File Structure

```
src/components/ui/
├── button.jsx ✅
├── card.jsx ✅
├── input.jsx ✅
├── label.jsx ✅
├── select.jsx ✅
├── badge.jsx ✅ NEW
├── separator.jsx ✅ NEW
├── tabs.jsx ✅ NEW
├── accordion.jsx ✅ NEW
├── dialog.jsx ✅ NEW
├── popover.jsx ✅ NEW
├── avatar.jsx ✅ NEW
├── dropdown-menu.jsx ✅ NEW
└── alert.jsx ✅ NEW
```

## Component Usage Documentation

All components follow shadcn/ui patterns:
- React forwardRef for ref forwarding
- CVA (class-variance-authority) for variants
- cn() utility for className merging
- Radix UI primitives for accessibility
- Tailwind CSS for styling

## Color Customization

To change the primary color globally:
1. Update CSS variables in `src/index.css`
2. Change `--primary` HSL value
3. All components automatically reflect the change

Example:
```css
--primary: 38 92% 50%; /* Change this value */
```

---

**Last Updated**: January 2025
**Status**: Production Ready ✅
