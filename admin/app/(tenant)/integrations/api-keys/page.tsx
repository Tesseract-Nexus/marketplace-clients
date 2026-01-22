"use client";

import { useState } from "react";
import Link from "next/link";
import { PermissionGate, Permission } from '@/components/permission-gate';
import {
  Key,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// API Key scopes
const apiScopes = [
  { id: "products:read", name: "Read Products", description: "View product catalog and inventory" },
  { id: "products:write", name: "Write Products", description: "Create, update, and delete products" },
  { id: "orders:read", name: "Read Orders", description: "View orders and order history" },
  { id: "orders:write", name: "Write Orders", description: "Create and update orders" },
  { id: "customers:read", name: "Read Customers", description: "View customer data" },
  { id: "customers:write", name: "Write Customers", description: "Create and update customers" },
  { id: "inventory:read", name: "Read Inventory", description: "View stock levels" },
  { id: "inventory:write", name: "Write Inventory", description: "Update stock levels" },
  { id: "analytics:read", name: "Read Analytics", description: "Access reports and analytics data" },
  { id: "settings:read", name: "Read Settings", description: "View store settings" },
  { id: "settings:write", name: "Write Settings", description: "Modify store settings" },
];

// Sample API keys (placeholder)
const sampleApiKeys = [
  {
    id: "key_001",
    name: "Mobile App Integration",
    prefix: "sk_live_abc123",
    scopes: ["products:read", "orders:read", "orders:write", "customers:read"],
    environment: "production",
    createdAt: "2024-11-01T10:00:00Z",
    lastUsed: "2024-12-27T08:30:00Z",
    expiresAt: null,
    requestCount: 45230,
    status: "active",
  },
  {
    id: "key_002",
    name: "ERP Sync Service",
    prefix: "sk_live_def456",
    scopes: ["products:read", "products:write", "inventory:read", "inventory:write"],
    environment: "production",
    createdAt: "2024-10-15T14:30:00Z",
    lastUsed: "2024-12-27T07:15:00Z",
    expiresAt: "2025-10-15T14:30:00Z",
    requestCount: 128450,
    status: "active",
  },
  {
    id: "key_003",
    name: "Development Testing",
    prefix: "sk_test_ghi789",
    scopes: ["products:read", "products:write", "orders:read", "orders:write"],
    environment: "test",
    createdAt: "2024-12-01T09:00:00Z",
    lastUsed: "2024-12-26T16:45:00Z",
    expiresAt: null,
    requestCount: 3420,
    status: "active",
  },
  {
    id: "key_004",
    name: "Legacy Integration (Deprecated)",
    prefix: "sk_live_jkl012",
    scopes: ["products:read"],
    environment: "production",
    createdAt: "2024-06-01T10:00:00Z",
    lastUsed: "2024-09-15T12:00:00Z",
    expiresAt: "2024-12-31T23:59:59Z",
    requestCount: 8920,
    status: "expiring",
  },
];

const getStatusBadge = (status: string, expiresAt: string | null) => {
  if (status === "revoked") {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Revoked
      </Badge>
    );
  }
  if (status === "expiring" || (expiresAt && new Date(expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))) {
    return (
      <Badge className="bg-warning-muted text-warning-foreground border-warning/30">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Expiring Soon
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
      <CheckCircle2 className="w-3 h-3 mr-1" />
      Active
    </Badge>
  );
};

const getEnvironmentBadge = (env: string) => {
  return env === "production" ? (
    <Badge variant="default" className="bg-primary">Production</Badge>
  ) : (
    <Badge variant="outline">Test</Badge>
  );
};

export default function ApiKeysPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [keyName, setKeyName] = useState("");
  const [keyEnvironment, setKeyEnvironment] = useState("production");
  const [keyExpiration, setKeyExpiration] = useState("never");
  const [generatedKey, setGeneratedKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const filteredKeys = sampleApiKeys.filter(
    (key) =>
      key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.prefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeKeys = sampleApiKeys.filter((k) => k.status === "active").length;
  const productionKeys = sampleApiKeys.filter((k) => k.environment === "production").length;

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId)
        ? prev.filter((s) => s !== scopeId)
        : [...prev, scopeId]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const handleCreateKey = () => {
    // Simulate key generation
    setGeneratedKey("sk_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    setCreateDialogOpen(false);
    setNewKeyDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Would show toast notification here
  };

  // Group scopes by category
  const scopeCategories = {
    "Products & Inventory": apiScopes.filter(s => s.id.startsWith("products") || s.id.startsWith("inventory")),
    "Orders & Customers": apiScopes.filter(s => s.id.startsWith("orders") || s.id.startsWith("customers")),
    "Analytics & Settings": apiScopes.filter(s => s.id.startsWith("analytics") || s.id.startsWith("settings")),
  };

  return (
    <PermissionGate
      permission={Permission.SETTINGS_INTEGRATIONS_MANAGE}
      fallback="styled"
      fallbackTitle="API Keys"
      fallbackDescription="You don't have permission to manage API keys."
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
            <span>API Keys</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-600 via-zinc-600 to-gray-600 bg-clip-text text-transparent">
            API Keys
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage API credentials for custom integrations and third-party access
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search API keys..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Keys</p>
                <p className="text-2xl font-bold">{sampleApiKeys.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center">
                <Key className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeKeys}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Production</p>
                <p className="text-2xl font-bold">{productionKeys}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/20 dark:bg-blue-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Calls (24h)</p>
                <p className="text-2xl font-bold">12.5K</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Keep your API keys secure</AlertTitle>
        <AlertDescription>
          Never share your secret API keys in public repositories or client-side code.
          Use environment variables and server-side requests to protect your credentials.
        </AlertDescription>
      </Alert>

      {/* API Keys List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your API Keys</h2>
        <div className="space-y-4">
          {filteredKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-zinc-600 flex items-center justify-center">
                      <Key className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{apiKey.name}</h3>
                        {getStatusBadge(apiKey.status, apiKey.expiresAt)}
                        {getEnvironmentBadge(apiKey.environment)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                          {apiKey.prefix}...
                        </code>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {apiKey.scopes.slice(0, 4).map((scope) => (
                          <Badge key={scope} variant="secondary" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                        {apiKey.scopes.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{apiKey.scopes.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Created</p>
                      <p>{formatDate(apiKey.createdAt)}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Last used</p>
                      <p>{formatDateTime(apiKey.lastUsed)}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Expires</p>
                      <p>{formatDate(apiKey.expiresAt)}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Requests</p>
                      <p className="font-medium">{apiKey.requestCount.toLocaleString()}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Activity className="w-4 h-4 mr-2" />
                          View Usage
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Revoke
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredKeys.length === 0 && (
            <Card className="p-8 text-center">
              <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No API keys found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first API key to start building integrations
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* API Documentation Link */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-zinc-600 flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">API Documentation</h3>
              <p className="text-sm text-muted-foreground">
                Learn how to use the Tesseract Hub API to build custom integrations
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/docs/api">
                View Documentation
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key with specific permissions for your integration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Key Name */}
            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., Mobile App Integration"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name to identify this API key
              </p>
            </div>

            {/* Environment */}
            <div className="space-y-2">
              <Label>Environment</Label>
              <Select value={keyEnvironment} onValueChange={setKeyEnvironment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="test">Test / Sandbox</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label>Expiration</Label>
              <Select value={keyExpiration} onValueChange={setKeyExpiration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never expires</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scope Selection */}
            <div className="space-y-4">
              <Label>Permissions</Label>
              {Object.entries(scopeCategories).map(([category, scopes]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {scopes.map((scope) => (
                      <div
                        key={scope.id}
                        className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleScope(scope.id)}
                      >
                        <Checkbox
                          id={scope.id}
                          checked={selectedScopes.includes(scope.id)}
                          onChange={() => toggleScope(scope.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={scope.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {scope.name}
                          </label>
                          <p className="text-xs text-muted-foreground">{scope.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!keyName || selectedScopes.length === 0}
              onClick={handleCreateKey}
            >
              <Key className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Generated Dialog */}
      <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Make sure to copy your API key now. You won&apos;t be able to see it again!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive" className="border-warning/30 bg-warning-muted text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                This is the only time you&apos;ll see this API key. Store it securely.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={generatedKey}
                    readOnly
                    className="font-mono pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(generatedKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setNewKeyDialogOpen(false);
              setKeyName("");
              setSelectedScopes([]);
              setGeneratedKey("");
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PermissionGate>
  );
}
