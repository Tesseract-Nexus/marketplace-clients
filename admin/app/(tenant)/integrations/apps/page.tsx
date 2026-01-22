"use client";

import { useState } from "react";
import Link from "next/link";
import { PermissionGate, Permission } from '@/components/permission-gate';
import {
  Puzzle,
  Search,
  Star,
  Download,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Megaphone,
  MessageSquare,
  Mail,
  Truck,
  CreditCard,
  Shield,
  Settings,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// App categories
const categories = [
  { id: "all", name: "All Apps", icon: Puzzle },
  { id: "marketing", name: "Marketing", icon: Megaphone },
  { id: "analytics", name: "Analytics", icon: BarChart3 },
  { id: "communication", name: "Communication", icon: MessageSquare },
  { id: "shipping", name: "Shipping", icon: Truck },
  { id: "payments", name: "Payments", icon: CreditCard },
  { id: "security", name: "Security", icon: Shield },
];

// Available apps
const availableApps = [
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Track website traffic, user behavior, and conversion metrics with Google Analytics integration.",
    category: "analytics",
    icon: BarChart3,
    bgColor: "bg-warning",
    rating: 4.8,
    reviews: 1250,
    installed: false,
    featured: true,
    price: "Free",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Sync customer data and automate email marketing campaigns directly from your store.",
    category: "marketing",
    icon: Mail,
    bgColor: "bg-warning",
    rating: 4.6,
    reviews: 890,
    installed: true,
    featured: true,
    price: "Free",
  },
  {
    id: "facebook-pixel",
    name: "Meta Pixel",
    description: "Track conversions, optimize ads, and build targeted audiences with Facebook/Instagram.",
    category: "marketing",
    icon: Megaphone,
    bgColor: "bg-primary",
    rating: 4.5,
    reviews: 2100,
    installed: false,
    featured: true,
    price: "Free",
  },
  {
    id: "klaviyo",
    name: "Klaviyo",
    description: "Advanced email and SMS marketing automation with powerful segmentation.",
    category: "marketing",
    icon: Mail,
    bgColor: "bg-success",
    rating: 4.7,
    reviews: 650,
    installed: false,
    featured: false,
    price: "From $20/mo",
  },
  {
    id: "zendesk",
    name: "Zendesk",
    description: "Customer support ticketing and live chat integration for better customer service.",
    category: "communication",
    icon: MessageSquare,
    bgColor: "bg-accent",
    rating: 4.4,
    reviews: 780,
    installed: false,
    featured: false,
    price: "From $49/mo",
  },
  {
    id: "intercom",
    name: "Intercom",
    description: "Modern customer messaging platform with live chat, bots, and customer data platform.",
    category: "communication",
    icon: MessageSquare,
    bgColor: "bg-primary",
    rating: 4.6,
    reviews: 920,
    installed: false,
    featured: true,
    price: "From $74/mo",
  },
  {
    id: "shipstation",
    name: "ShipStation",
    description: "Streamline shipping with automated label printing, tracking, and multi-carrier support.",
    category: "shipping",
    icon: Truck,
    bgColor: "bg-success",
    rating: 4.3,
    reviews: 1450,
    installed: true,
    featured: false,
    price: "From $9/mo",
  },
  {
    id: "easyship",
    name: "Easyship",
    description: "Compare shipping rates, automate customs documentation, and offer flexible delivery options.",
    category: "shipping",
    icon: Truck,
    bgColor: "bg-warning",
    rating: 4.5,
    reviews: 680,
    installed: false,
    featured: false,
    price: "Free tier available",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments, manage subscriptions, and handle complex payment flows.",
    category: "payments",
    icon: CreditCard,
    bgColor: "bg-accent",
    rating: 4.9,
    reviews: 3200,
    installed: true,
    featured: true,
    price: "2.9% + 30¢",
  },
  {
    id: "razorpay",
    name: "Razorpay",
    description: "Accept payments via UPI, cards, netbanking, and wallets for Indian businesses.",
    category: "payments",
    icon: CreditCard,
    bgColor: "bg-primary",
    rating: 4.6,
    reviews: 890,
    installed: false,
    featured: false,
    price: "2% per transaction",
  },
  {
    id: "hotjar",
    name: "Hotjar",
    description: "Understand user behavior with heatmaps, session recordings, and feedback tools.",
    category: "analytics",
    icon: BarChart3,
    bgColor: "bg-destructive",
    rating: 4.5,
    reviews: 560,
    installed: false,
    featured: false,
    price: "Free tier available",
  },
  {
    id: "trustpilot",
    name: "Trustpilot",
    description: "Collect and display customer reviews to build trust and improve SEO.",
    category: "marketing",
    icon: Star,
    bgColor: "bg-success",
    rating: 4.4,
    reviews: 340,
    installed: false,
    featured: false,
    price: "Free tier available",
  },
  {
    id: "two-factor",
    name: "Two-Factor Auth",
    description: "Add an extra layer of security with SMS or authenticator app verification.",
    category: "security",
    icon: Shield,
    bgColor: "bg-muted-foreground",
    rating: 4.8,
    reviews: 290,
    installed: true,
    featured: false,
    price: "Free",
  },
  {
    id: "fraud-detection",
    name: "Fraud Shield",
    description: "AI-powered fraud detection to protect your store from fraudulent orders.",
    category: "security",
    icon: Shield,
    bgColor: "bg-destructive",
    rating: 4.7,
    reviews: 180,
    installed: false,
    featured: false,
    price: "From $29/mo",
  },
];

export default function AppsPluginsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedApp, setSelectedApp] = useState<typeof availableApps[0] | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const filteredApps = availableApps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const installedApps = availableApps.filter((app) => app.installed);
  const featuredApps = availableApps.filter((app) => app.featured && !app.installed);

  const openAppDetails = (app: typeof availableApps[0]) => {
    setSelectedApp(app);
    setDetailsDialogOpen(true);
  };

  return (
    <PermissionGate
      permission={Permission.SETTINGS_INTEGRATIONS_MANAGE}
      fallback="styled"
      fallbackTitle="App Integrations"
      fallbackDescription="You don't have permission to manage apps."
    >
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/integrations" className="hover:text-primary">
              Integrations
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span>Apps & Plugins</span>
          </div>
          <h1 className="text-3xl font-bold text-primary">
            Apps & Plugins
          </h1>
          <p className="text-muted-foreground mt-1">
            Extend your store with marketing, analytics, and operational tools
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search apps..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Installed Apps */}
      {installedApps.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Installed Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {installedApps.map((app) => (
              <Card key={app.id} className="relative">
                <div className="absolute top-3 right-3">
                  <Badge className="bg-success/10 text-success border-success/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Installed
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <div
                    className={`w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-2`}
                  >
                    <app.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-base">{app.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {app.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openAppDetails(app)}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        className="space-y-6"
      >
        <TabsList className="bg-muted/50 p-1">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="data-[state=active]:bg-background"
            >
              <cat.icon className="w-4 h-4 mr-2" />
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-6">
          {/* Featured Apps */}
          {selectedCategory === "all" && featuredApps.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-warning" />
                Featured Apps
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredApps.slice(0, 3).map((app) => (
                  <Card
                    key={app.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 group"
                    onClick={() => openAppDetails(app)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-14 h-14 rounded-xl bg-primary flex items-center justify-center`}
                        >
                          <app.icon className="w-7 h-7 text-white" />
                        </div>
                        <Badge variant="outline" className="bg-warning-muted text-warning-foreground border-warning/30">
                          <Star className="w-3 h-3 mr-1 fill-amber-500" />
                          Featured
                        </Badge>
                      </div>
                      <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                        {app.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {app.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 fill-amber-400 text-warning" />
                          <span className="font-medium">{app.rating}</span>
                          <span className="text-muted-foreground">
                            ({app.reviews.toLocaleString()})
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">{app.price}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Apps Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {selectedCategory === "all"
                ? "All Apps"
                : categories.find((c) => c.id === selectedCategory)?.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => (
                <Card
                  key={app.id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50 group"
                  onClick={() => openAppDetails(app)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0`}
                      >
                        <app.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base group-hover:text-primary transition-colors">
                            {app.name}
                          </CardTitle>
                          {app.installed && (
                            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-3 h-3 fill-amber-400 text-warning" />
                          <span className="text-sm">{app.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({app.reviews})
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {app.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {app.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{app.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredApps.length === 0 && (
              <Card className="p-8 text-center">
                <Puzzle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No apps found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or category filter
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* App Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedApp && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div
                    className={`w-16 h-16 rounded-xl ${selectedApp.bgColor} flex items-center justify-center`}
                  >
                    <selectedApp.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{selectedApp.name}</DialogTitle>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-warning" />
                        <span className="font-medium">{selectedApp.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({selectedApp.reviews.toLocaleString()} reviews)
                        </span>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {selectedApp.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div>
                  <h4 className="font-medium mb-2">About this app</h4>
                  <p className="text-muted-foreground">{selectedApp.description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Pricing</h4>
                  <p className="text-2xl font-bold">{selectedApp.price}</p>
                </div>

                {selectedApp.installed && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Settings</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable App</Label>
                        <p className="text-sm text-muted-foreground">
                          Toggle to enable or disable this integration
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sync Automatically</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically sync data every hour
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                {selectedApp.installed ? (
                  <>
                    <Button variant="outline" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Uninstall
                    </Button>
                    <Button>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button>
                      <Download className="w-4 h-4 mr-2" />
                      Install App
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </PermissionGate>
  );
}
