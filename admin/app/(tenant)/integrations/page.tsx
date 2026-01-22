"use client";

import Link from "next/link";
import { PermissionGate, Permission } from '@/components/permission-gate';
import {
  Plug2,
  Store,
  Upload,
  Puzzle,
  Webhook,
  Key,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Integration categories
const integrationCategories = [
  {
    id: "marketplaces",
    title: "Marketplace Connectors",
    description: "Connect to Amazon, Shopify, Flipkart, and more to sync your products and orders",
    icon: Store,
    href: "/integrations/marketplaces",
    textColor: "text-primary",
    bgColor: "bg-primary",
    stats: { connected: 0, available: 12 },
    featured: true,
  },
  {
    id: "mautic",
    title: "Mautic Marketing",
    description: "Marketing automation for email campaigns, customer segments, and engagement tracking",
    icon: Sparkles,
    href: "/integrations/mautic",
    textColor: "text-primary",
    bgColor: "bg-primary",
    stats: { campaigns: 0, segments: 8 },
    featured: true,
  },
  {
    id: "import",
    title: "Data Import",
    description: "Import products, customers, and orders from CSV, Excel, or other platforms",
    icon: Upload,
    href: "/integrations/import",
    textColor: "text-success",
    bgColor: "bg-success",
    stats: { recent: 0, total: 0 },
  },
  {
    id: "apps",
    title: "Apps & Plugins",
    description: "Extend your store with marketing, analytics, and operational tools",
    icon: Puzzle,
    href: "/integrations/apps",
    bgColor: "bg-accent",
    stats: { installed: 0, available: 25 },
  },
  {
    id: "webhooks",
    title: "Webhooks",
    description: "Set up real-time notifications for order events, inventory changes, and more",
    icon: Webhook,
    href: "/integrations/webhooks",
    bgColor: "bg-warning",
    stats: { active: 0, total: 0 },
  },
  {
    id: "api-keys",
    title: "API Keys",
    description: "Manage API credentials for custom integrations and third-party access",
    icon: Key,
    href: "/integrations/api-keys",
    bgColor: "bg-muted-foreground",
    stats: { active: 0, total: 0 },
  },
];

// Featured marketplace connectors
const featuredConnectors = [
  { name: "Shopify", logo: "/logos/shopify.svg", status: "available" },
  { name: "Amazon", logo: "/logos/amazon.svg", status: "available" },
  { name: "Flipkart", logo: "/logos/flipkart.svg", status: "available" },
  { name: "WooCommerce", logo: "/logos/woocommerce.svg", status: "coming_soon" },
];

export default function IntegrationsOverviewPage() {
  return (
    <PermissionGate
      permission={Permission.SETTINGS_INTEGRATIONS_MANAGE}
      fallback="styled"
      fallbackTitle="Integrations Access Required"
      fallbackDescription="You don't have the required permissions to view integrations. Please contact your administrator to request access."
    >
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Integrations
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect your store with marketplaces, apps, and custom tools
          </p>
        </div>
        <Button asChild>
          <Link href="/integrations/marketplaces">
            <Plug2 className="w-4 h-4 mr-2" />
            Browse All Integrations
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 dark:from-blue-950/20 dark:to-cyan-950/20 border-primary/30/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Connected Marketplaces</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 dark:bg-primary/10 border-primary/30/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Puzzle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Installed Apps</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 dark:bg-success/10 border-success/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Data Imports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 dark:from-orange-950/20 dark:to-amber-950/20 border-warning/30/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center">
                <Webhook className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Active Webhooks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Categories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Integration Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrationCategories.map((category) => (
            <Link key={category.id} href={category.href}>
              <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl ${category.bgColor} flex items-center justify-center`}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    {category.featured && (
                      <Badge variant="secondary" className="bg-warning/10 text-warning-foreground border-warning/30">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                    {category.title}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {category.stats.available && (
                        <span>{category.stats.available} available</span>
                      )}
                      {category.stats.connected !== undefined && category.stats.connected > 0 && (
                        <span className="ml-2 text-emerald-600">
                          {category.stats.connected} connected
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Marketplace Connectors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Popular Marketplace Connectors</h2>
          <Button variant="ghost" asChild>
            <Link href="/integrations/marketplaces">
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredConnectors.map((connector) => (
            <Card key={connector.name} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-xl bg-muted dark:bg-muted dark:to-slate-900 flex items-center justify-center mb-3">
                    <Store className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">{connector.name}</h3>
                  <Badge
                    variant="outline"
                    className={connector.status === "available"
                      ? "mt-2 text-emerald-600 border-emerald-200 bg-emerald-50"
                      : "mt-2 text-warning border-warning/30 bg-warning-muted"
                    }
                  >
                    {connector.status === "available" ? "Available" : "Coming Soon"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card className="bg-primary/5 dark:bg-primary/10 border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">New to Integrations?</h3>
              <p className="text-muted-foreground mb-4">
                Start by connecting your existing marketplace accounts or importing your product catalog.
                Our step-by-step wizard makes it easy to get started.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/integrations/marketplaces">
                    <Store className="w-4 h-4 mr-2" />
                    Connect Marketplace
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/integrations/import">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center">
                <Plug2 className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </PermissionGate>
  );
}
