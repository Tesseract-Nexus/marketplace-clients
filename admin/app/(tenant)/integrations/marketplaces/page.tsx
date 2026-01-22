"use client";

import { useState } from "react";
import Link from "next/link";
import { PermissionGate, Permission } from '@/components/permission-gate';
import {
  Store,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Key,
  Webhook,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Marketplace connectors data
const marketplaceConnectors = [
  {
    id: "shopify",
    name: "Shopify",
    description: "Sync products, orders, and customers with your Shopify store",
    category: "E-Commerce",
    status: "available",
    features: ["Products", "Orders", "Customers", "Inventory"],
    docsUrl: "/docs/integration/marketplaces/shopify",
    popularity: 95,
  },
  {
    id: "amazon",
    name: "Amazon Seller Central",
    description: "Connect to Amazon for product listings and order management",
    category: "Marketplace",
    status: "available",
    features: ["Products", "Orders", "FBA Inventory", "Reports"],
    docsUrl: "/docs/integration/marketplaces/amazon",
    popularity: 92,
  },
  {
    id: "flipkart",
    name: "Flipkart",
    description: "Integrate with Flipkart Seller Hub for the Indian market",
    category: "Marketplace",
    status: "available",
    features: ["Products", "Orders", "Returns", "GST Compliance"],
    docsUrl: "/docs/integration/marketplaces/flipkart",
    popularity: 88,
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Connect your WordPress WooCommerce store",
    category: "E-Commerce",
    status: "available",
    features: ["Products", "Orders", "Customers", "Coupons"],
    docsUrl: "/docs/integration/marketplaces/woocommerce",
    popularity: 85,
  },
  {
    id: "magento",
    name: "Magento / Adobe Commerce",
    description: "Enterprise e-commerce platform integration",
    category: "E-Commerce",
    status: "available",
    features: ["Products", "Orders", "Customers", "Categories"],
    docsUrl: "/docs/integration/marketplaces/magento",
    popularity: 75,
  },
  {
    id: "myntra",
    name: "Myntra",
    description: "Fashion marketplace integration for India",
    category: "Marketplace",
    status: "coming_soon",
    features: ["Products", "Orders", "Returns"],
    popularity: 70,
  },
  {
    id: "temu",
    name: "Temu",
    description: "Connect to Temu marketplace",
    category: "Marketplace",
    status: "coming_soon",
    features: ["Products", "Orders"],
    popularity: 65,
  },
  {
    id: "etsy",
    name: "Etsy",
    description: "Handmade and vintage marketplace integration",
    category: "Marketplace",
    status: "available",
    features: ["Products", "Orders", "Reviews"],
    docsUrl: "/docs/integration/marketplaces/etsy",
    popularity: 78,
  },
  {
    id: "ebay",
    name: "eBay",
    description: "Global auction and shopping marketplace",
    category: "Marketplace",
    status: "available",
    features: ["Products", "Orders", "Inventory"],
    docsUrl: "/docs/integration/marketplaces/ebay",
    popularity: 80,
  },
  {
    id: "bigcommerce",
    name: "BigCommerce",
    description: "Enterprise e-commerce platform",
    category: "E-Commerce",
    status: "available",
    features: ["Products", "Orders", "Customers"],
    docsUrl: "/docs/integration/marketplaces/bigcommerce",
    popularity: 72,
  },
  {
    id: "square",
    name: "Square",
    description: "POS and e-commerce integration",
    category: "POS",
    status: "coming_soon",
    features: ["Products", "Orders", "Inventory", "POS"],
    popularity: 60,
  },
  {
    id: "prestashop",
    name: "PrestaShop",
    description: "Open-source e-commerce solution",
    category: "E-Commerce",
    status: "coming_soon",
    features: ["Products", "Orders", "Customers"],
    popularity: 55,
  },
];

// Categories for filtering
const categories = ["All", "E-Commerce", "Marketplace", "POS"];

export default function MarketplaceConnectorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedConnector, setSelectedConnector] = useState<typeof marketplaceConnectors[0] | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const filteredConnectors = marketplaceConnectors.filter((connector) => {
    const matchesSearch = connector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connector.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || connector.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.popularity - a.popularity);

  const availableCount = marketplaceConnectors.filter(c => c.status === "available").length;
  const comingSoonCount = marketplaceConnectors.filter(c => c.status === "coming_soon").length;

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConnecting(false);
    setSelectedConnector(null);
  };

  return (
    <PermissionGate
      permission={Permission.SETTINGS_INTEGRATIONS_MANAGE}
      fallback="styled"
      fallbackTitle="Marketplace Integrations Access Required"
      fallbackDescription="You don't have the required permissions to view marketplace integrations. Please contact your administrator to request access."
    >
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/integrations" className="hover:text-foreground">Integrations</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Marketplace Connectors</span>
          </div>
          <h1 className="text-3xl font-bold text-primary">
            Marketplace Connectors
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect your store with popular e-commerce platforms and marketplaces
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{availableCount}</p>
                <p className="text-sm text-muted-foreground">Available Now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning-muted dark:bg-warning/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{comingSoonCount}</p>
                <p className="text-sm text-muted-foreground">Coming Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 dark:bg-primary/30 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search marketplaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConnectors.map((connector) => (
          <Card key={connector.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                  <Store className="w-6 h-6 text-muted-foreground dark:text-muted-foreground" />
                </div>
                <Badge
                  variant="outline"
                  className={connector.status === "available"
                    ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20"
                    : "text-warning border-warning/30 bg-warning-muted dark:bg-warning/20"
                  }
                >
                  {connector.status === "available" ? "Available" : "Coming Soon"}
                </Badge>
              </div>
              <CardTitle className="mt-4">{connector.name}</CardTitle>
              <CardDescription>{connector.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {connector.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline" className="text-xs">
                    {connector.category}
                  </Badge>
                  {connector.status === "available" ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedConnector(connector)}>
                          Connect
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Connect to {connector.name}</DialogTitle>
                          <DialogDescription>
                            Enter your {connector.name} credentials to connect your account.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {connector.id === "shopify" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="storeDomain">Store Domain</Label>
                                <Input id="storeDomain" placeholder="your-store.myshopify.com" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="accessToken">Access Token</Label>
                                <Input id="accessToken" type="password" placeholder="shpat_xxxxxxxxxxxxx" />
                              </div>
                            </>
                          )}
                          {connector.id === "amazon" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="marketplace">Marketplace</Label>
                                <Select defaultValue="us">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="us">United States</SelectItem>
                                    <SelectItem value="in">India</SelectItem>
                                    <SelectItem value="uk">United Kingdom</SelectItem>
                                    <SelectItem value="de">Germany</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="sellerId">Seller ID</Label>
                                <Input id="sellerId" placeholder="AXXXXXXXXX" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="refreshToken">Refresh Token</Label>
                                <Input id="refreshToken" type="password" placeholder="Atzr|..." />
                              </div>
                            </>
                          )}
                          {connector.id === "flipkart" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="appId">Application ID</Label>
                                <Input id="appId" placeholder="Your Flipkart App ID" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="appSecret">Application Secret</Label>
                                <Input id="appSecret" type="password" placeholder="Your App Secret" />
                              </div>
                            </>
                          )}
                          {!["shopify", "amazon", "flipkart"].includes(connector.id) && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="apiKey">API Key</Label>
                                <Input id="apiKey" placeholder="Your API Key" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="apiSecret">API Secret</Label>
                                <Input id="apiSecret" type="password" placeholder="Your API Secret" />
                              </div>
                            </>
                          )}
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 dark:bg-primary/20 text-sm">
                            <AlertCircle className="w-4 h-4 text-primary" />
                            <span className="text-primary dark:text-primary/70">
                              Your credentials are encrypted and stored securely.
                            </span>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedConnector(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleConnect} disabled={isConnecting}>
                            {isConnecting ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              "Connect"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredConnectors.length === 0 && (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Store className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No connectors found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-muted">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Need a custom integration?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                If you need to connect to a platform not listed here, you can use our API or webhooks
                to build custom integrations.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/integrations/api-keys">
                    <Key className="w-4 h-4 mr-2" />
                    API Keys
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/integrations/webhooks">
                    <Webhook className="w-4 h-4 mr-2" />
                    Webhooks
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </PermissionGate>
  );
}
