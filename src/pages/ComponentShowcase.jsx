import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { AlertCircle, Coffee, Check } from 'lucide-react';

export default function ComponentShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-5xl font-black text-foreground mb-4 tracking-tight">
            shadcn/ui Components Library
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A collection of modern, accessible UI components built with Tailwind CSS and the primary amber-700 color palette.
          </p>
        </div>

        {/* Badges Section */}
        <Card className="mb-12 p-8 border border-border rounded-lg">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Coffee className="w-8 h-8 text-primary" />
            Badges
          </h2>
          <div className="flex flex-wrap gap-4">
            <Badge variant="default">Default Badge</Badge>
            <Badge variant="secondary">Secondary Badge</Badge>
            <Badge variant="destructive">Destructive Badge</Badge>
            <Badge variant="outline">Outline Badge</Badge>
          </div>
          <Separator className="my-6" />
          <p className="text-muted-foreground">
            Badges are used for labels, categories, and status indicators throughout the application.
          </p>
        </Card>

        {/* Buttons Section */}
        <Card className="mb-12 p-8 border border-border rounded-lg">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Coffee className="w-8 h-8 text-primary" />
            Buttons
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="destructive">Destructive Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>
          <Separator className="my-6" />
          <p className="text-muted-foreground">
            Buttons support multiple variants and sizes for different use cases. Hover to see the primary color interaction.
          </p>
        </Card>

        {/* Alerts Section */}
        <Card className="mb-12 p-8 border border-border rounded-lg">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Coffee className="w-8 h-8 text-primary" />
            Alerts
          </h2>
          <div className="space-y-4">
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                This is a default alert. Use this for informational messages.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                This is a destructive alert. Use this for errors and warnings.
              </AlertDescription>
            </Alert>
            <Alert variant="success">
              <Check className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                This is a success alert. Use this for confirmations and positive outcomes.
              </AlertDescription>
            </Alert>
          </div>
          <Separator className="my-6" />
          <p className="text-muted-foreground">
            Alerts are used to communicate important information with users.
          </p>
        </Card>

        {/* Color Palette Section */}
        <Card className="mb-12 p-8 border border-border rounded-lg">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Coffee className="w-8 h-8 text-primary" />
            Color Palette
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Primary Color</h3>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-primary rounded-lg shadow-md"></div>
                <div>
                  <p className="font-mono text-sm text-muted-foreground">amber-700</p>
                  <p className="font-mono text-sm text-muted-foreground">38 92% 50%</p>
                  <p className="font-mono text-sm text-muted-foreground">#b45309</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Secondary Colors</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-lg shadow-sm"></div>
                  <span className="text-sm text-muted-foreground">Muted</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-border rounded-lg shadow-sm"></div>
                  <span className="text-sm text-muted-foreground">Border</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-destructive rounded-lg shadow-sm"></div>
                  <span className="text-sm text-muted-foreground">Destructive</span>
                </div>
              </div>
            </div>
          </div>
          <Separator className="my-6" />
          <p className="text-muted-foreground">
            All colors are defined as CSS variables and use HSL format for flexible color manipulation.
          </p>
        </Card>

        {/* Component Status */}
        <Card className="p-8 border border-border rounded-lg">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Coffee className="w-8 h-8 text-primary" />
            Available Components
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Button',
              'Card',
              'Input',
              'Label',
              'Select',
              'Badge',
              'Separator',
              'Tabs',
              'Accordion',
              'Dialog',
              'Popover',
              'Avatar',
              'Dropdown Menu',
              'Alert',
            ].map((component) => (
              <div key={component} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-foreground font-medium">{component}</span>
              </div>
            ))}
          </div>
          <Separator className="my-6" />
          <p className="text-muted-foreground">
            All components use the primary amber-700 color palette and follow shadcn design patterns.
          </p>
        </Card>
      </div>
    </div>
  );
}
