"use client";

import { useState } from "react";
import Link from "next/link";
import { PermissionGate, Permission } from '@/components/permission-gate';
import {
  Webhook,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  RefreshCw,
  Play,
  Pause,
  Eye,
  Activity,
  Zap,
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

// Webhook event types
const eventTypes = [
  { id: "order.created", name: "Order Created", category: "Orders" },
  { id: "order.updated", name: "Order Updated", category: "Orders" },
  { id: "order.fulfilled", name: "Order Fulfilled", category: "Orders" },
  { id: "order.cancelled", name: "Order Cancelled", category: "Orders" },
  { id: "order.refunded", name: "Order Refunded", category: "Orders" },
  { id: "product.created", name: "Product Created", category: "Products" },
  { id: "product.updated", name: "Product Updated", category: "Products" },
  { id: "product.deleted", name: "Product Deleted", category: "Products" },
  { id: "inventory.low", name: "Low Stock Alert", category: "Inventory" },
  { id: "inventory.updated", name: "Inventory Updated", category: "Inventory" },
  { id: "customer.created", name: "Customer Created", category: "Customers" },
  { id: "customer.updated", name: "Customer Updated", category: "Customers" },
  { id: "return.requested", name: "Return Requested", category: "Returns" },
  { id: "return.approved", name: "Return Approved", category: "Returns" },
  { id: "return.completed", name: "Return Completed", category: "Returns" },
];

// Sample webhooks (placeholder)
const sampleWebhooks = [
  {
    id: "wh_001",
    name: "Order Notifications",
    url: "https://api.example.com/webhooks/orders",
    events: ["order.created", "order.fulfilled", "order.cancelled"],
    active: true,
    secret: "whsec_abc123...",
    createdAt: "2024-12-01T10:00:00Z",
    lastTriggered: "2024-12-27T08:15:00Z",
    successRate: 99.5,
    totalDeliveries: 1250,
  },
  {
    id: "wh_002",
    name: "Inventory Sync",
    url: "https://erp.company.com/api/inventory",
    events: ["inventory.updated", "inventory.low"],
    active: true,
    secret: "whsec_def456...",
    createdAt: "2024-11-15T14:30:00Z",
    lastTriggered: "2024-12-27T07:45:00Z",
    successRate: 98.2,
    totalDeliveries: 3420,
  },
  {
    id: "wh_003",
    name: "CRM Customer Sync",
    url: "https://crm.example.com/hooks/customers",
    events: ["customer.created", "customer.updated"],
    active: false,
    secret: "whsec_ghi789...",
    createdAt: "2024-10-20T09:00:00Z",
    lastTriggered: "2024-12-20T16:30:00Z",
    successRate: 95.8,
    totalDeliveries: 890,
  },
];

// Sample delivery logs
const deliveryLogs = [
  {
    id: "del_001",
    webhookId: "wh_001",
    event: "order.created",
    status: "success",
    statusCode: 200,
    duration: 245,
    timestamp: "2024-12-27T08:15:00Z",
  },
  {
    id: "del_002",
    webhookId: "wh_002",
    event: "inventory.updated",
    status: "success",
    statusCode: 200,
    duration: 180,
    timestamp: "2024-12-27T07:45:00Z",
  },
  {
    id: "del_003",
    webhookId: "wh_001",
    event: "order.fulfilled",
    status: "failed",
    statusCode: 500,
    duration: 3200,
    timestamp: "2024-12-27T06:30:00Z",
  },
];

const getStatusBadge = (active: boolean) => {
  return active ? (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
      <CheckCircle2 className="w-3 h-3 mr-1" />
      Active
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      <Pause className="w-3 h-3 mr-1" />
      Paused
    </Badge>
  );
};

const getDeliveryStatusBadge = (status: string) => {
  switch (status) {
    case "success":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Success
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-warning-muted text-warning-foreground border-warning/30">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function WebhooksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookName, setWebhookName] = useState("");

  const filteredWebhooks = sampleWebhooks.filter(
    (webhook) =>
      webhook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      webhook.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeWebhooks = sampleWebhooks.filter((w) => w.active).length;

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const groupedEvents = eventTypes.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof eventTypes>);

  return (
    <PermissionGate
      permission={Permission.SETTINGS_INTEGRATIONS_MANAGE}
      fallback="styled"
      fallbackTitle="Webhooks Access Required"
      fallbackDescription="You don't have the required permissions to view webhooks. Please contact your administrator to request access."
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
            <span>Webhooks</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Webhooks
          </h1>
          <p className="text-muted-foreground mt-1">
            Set up real-time notifications for order events, inventory changes, and more
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search webhooks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Webhook
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Webhooks</p>
                <p className="text-2xl font-bold">{sampleWebhooks.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Webhook className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeWebhooks}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deliveries (24h)</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/20 dark:bg-blue-900/30 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">98.5%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Webhooks</h2>
        <div className="space-y-4">
          {filteredWebhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <Webhook className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{webhook.name}</h3>
                        {getStatusBadge(webhook.active)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {webhook.url}
                        </code>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Last triggered</p>
                      <p>{formatDate(webhook.lastTriggered)}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Success rate</p>
                      <p className="font-medium text-emerald-600">{webhook.successRate}%</p>
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
                          <Eye className="w-4 h-4 mr-2" />
                          View Logs
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Play className="w-4 h-4 mr-2" />
                          Test Webhook
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate Secret
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredWebhooks.length === 0 && (
            <Card className="p-8 text-center">
              <Webhook className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No webhooks found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first webhook to start receiving real-time notifications
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Webhook
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Deliveries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Deliveries</h2>
          <Button variant="outline" size="sm">
            View All Logs
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Event</th>
                    <th className="text-left p-4 font-medium">Webhook</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Response</th>
                    <th className="text-left p-4 font-medium">Duration</th>
                    <th className="text-left p-4 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryLogs.map((log) => {
                    const webhook = sampleWebhooks.find((w) => w.id === log.webhookId);
                    return (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4">
                          <Badge variant="outline">{log.event}</Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{webhook?.name}</span>
                        </td>
                        <td className="p-4">{getDeliveryStatusBadge(log.status)}</td>
                        <td className="p-4">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {log.statusCode}
                          </code>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {log.duration}ms
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Webhook Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Configure a webhook endpoint to receive real-time event notifications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Webhook Name */}
            <div className="space-y-2">
              <Label htmlFor="webhook-name">Webhook Name</Label>
              <Input
                id="webhook-name"
                placeholder="e.g., Order Notifications"
                value={webhookName}
                onChange={(e) => setWebhookName(e.target.value)}
              />
            </div>

            {/* Endpoint URL */}
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://api.example.com/webhooks"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll send POST requests to this URL when events occur
              </p>
            </div>

            {/* Event Selection */}
            <div className="space-y-4">
              <Label>Events to Subscribe</Label>
              {Object.entries(groupedEvents).map(([category, events]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleEvent(event.id)}
                      >
                        <Checkbox
                          id={event.id}
                          checked={selectedEvents.includes(event.id)}
                          onChange={() => toggleEvent(event.id)}
                        />
                        <label
                          htmlFor={event.id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {event.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Secret Key Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Webhook Secret</h4>
              <p className="text-sm text-muted-foreground">
                A secret key will be generated automatically. Use it to verify that
                webhook payloads are from Tesseract Hub.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!webhookUrl || !webhookName || selectedEvents.length === 0}>
              <Webhook className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PermissionGate>
  );
}
