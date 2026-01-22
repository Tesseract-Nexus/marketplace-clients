"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { PermissionGate, Permission } from '@/components/permission-gate';
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  RefreshCw,
  Trash2,
  Eye,
  MoreVertical,
  ChevronRight,
  Package,
  ShoppingCart,
  Users,
  Building2,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Entity types for import
const entityTypes = [
  {
    id: "products",
    name: "Products",
    description: "Import product catalog with variants, pricing, and inventory",
    icon: Package,
    color: "from-blue-500 to-cyan-500",
    requiredFields: ["name", "sku", "price"],
    optionalFields: ["description", "category", "images", "quantity", "weight"],
  },
  {
    id: "orders",
    name: "Orders",
    description: "Import historical orders with line items and customer data",
    icon: ShoppingCart,
    color: "from-purple-500 to-pink-500",
    requiredFields: ["orderNumber", "orderDate", "total", "customerEmail"],
    optionalFields: ["status", "shippingAddress", "lineItems", "notes"],
  },
  {
    id: "customers",
    name: "Customers",
    description: "Import customer profiles with contact information",
    icon: Users,
    color: "from-emerald-500 to-teal-500",
    requiredFields: ["email", "firstName", "lastName"],
    optionalFields: ["phone", "address", "company", "tags"],
  },
  {
    id: "categories",
    name: "Categories",
    description: "Import product categories and hierarchy",
    icon: FolderOpen,
    color: "from-orange-500 to-amber-500",
    requiredFields: ["name"],
    optionalFields: ["description", "parentCategory", "slug", "image"],
  },
  {
    id: "vendors",
    name: "Vendors",
    description: "Import vendor and supplier information",
    icon: Building2,
    color: "from-slate-500 to-zinc-500",
    requiredFields: ["name", "email"],
    optionalFields: ["phone", "address", "website", "contactPerson"],
  },
];

// Source platforms
const sourcePlatforms = [
  { id: "shopify", name: "Shopify Export" },
  { id: "amazon", name: "Amazon Seller Central" },
  { id: "flipkart", name: "Flipkart Seller" },
  { id: "woocommerce", name: "WooCommerce" },
  { id: "csv", name: "Generic CSV" },
  { id: "excel", name: "Excel Spreadsheet" },
  { id: "json", name: "JSON File" },
];

// Sample import history (placeholder)
const importHistory = [
  {
    id: "imp_001",
    entityType: "products",
    source: "shopify",
    fileName: "shopify_products_export.csv",
    totalRows: 1500,
    successRows: 1485,
    errorRows: 15,
    status: "completed",
    startedAt: "2024-12-26T10:30:00Z",
    completedAt: "2024-12-26T10:35:22Z",
  },
  {
    id: "imp_002",
    entityType: "customers",
    source: "csv",
    fileName: "customer_list_q4.csv",
    totalRows: 850,
    successRows: 850,
    errorRows: 0,
    status: "completed",
    startedAt: "2024-12-25T14:20:00Z",
    completedAt: "2024-12-25T14:22:15Z",
  },
  {
    id: "imp_003",
    entityType: "orders",
    source: "amazon",
    fileName: "amazon_orders_dec.csv",
    totalRows: 2340,
    successRows: 0,
    errorRows: 0,
    status: "processing",
    progress: 67,
    startedAt: "2024-12-27T08:00:00Z",
    completedAt: null,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-primary/20 text-primary border-primary/30">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Processing
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

const getEntityIcon = (entityType: string) => {
  const entity = entityTypes.find((e) => e.id === entityType);
  if (entity) {
    const Icon = entity.icon;
    return <Icon className="w-4 h-4" />;
  }
  return <FileText className="w-4 h-4" />;
};

export default function DataImportPage() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadedFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const startNewImport = (entityId: string) => {
    setSelectedEntity(entityId);
    setSelectedSource("");
    setUploadedFile(null);
    setImportDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const selectedEntityData = entityTypes.find((e) => e.id === selectedEntity);

  return (
    <PermissionGate
      permission={Permission.SETTINGS_INTEGRATIONS_MANAGE}
      fallback="styled"
      fallbackTitle="Data Import Access Required"
      fallbackDescription="You don't have the required permissions to view data import. Please contact your administrator to request access."
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
            <span>Data Import</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Data Import
          </h1>
          <p className="text-muted-foreground mt-1">
            Import products, orders, and customers from CSV, Excel, or other platforms
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Imports</p>
                <p className="text-2xl font-bold">{importHistory.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/20 dark:bg-blue-900/30 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Records Imported</p>
                <p className="text-2xl font-bold">
                  {importHistory.reduce((acc, imp) => acc + imp.successRows, 0).toLocaleString()}
                </p>
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
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">
                  {importHistory.filter((i) => i.status === "processing").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning-muted dark:bg-amber-900/30 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold">
                  {importHistory.reduce((acc, imp) => acc + imp.errorRows, 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entity Type Selection */}
      <div>
        <h2 className="text-xl font-semibold mb-4">What would you like to import?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entityTypes.map((entity) => (
            <Card
              key={entity.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 group"
              onClick={() => startNewImport(entity.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${entity.color} flex items-center justify-center`}
                  >
                    <entity.icon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                  {entity.name}
                </CardTitle>
                <CardDescription>{entity.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Required:</span>{" "}
                  {entity.requiredFields.join(", ")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Import History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Import History</h2>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Import</th>
                    <th className="text-left p-4 font-medium">Source</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Progress</th>
                    <th className="text-left p-4 font-medium">Started</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {importHistory.map((imp) => (
                    <tr key={imp.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            {getEntityIcon(imp.entityType)}
                          </div>
                          <div>
                            <p className="font-medium">{imp.fileName}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {imp.entityType}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize">
                          {imp.source}
                        </Badge>
                      </td>
                      <td className="p-4">{getStatusBadge(imp.status)}</td>
                      <td className="p-4">
                        {imp.status === "processing" ? (
                          <div className="w-32">
                            <Progress value={imp.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {imp.progress}%
                            </p>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <span className="text-emerald-600">{imp.successRows.toLocaleString()}</span>
                            {imp.errorRows > 0 && (
                              <span className="text-red-600 ml-2">
                                ({imp.errorRows} errors)
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(imp.startedAt)}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download Report
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supported Formats */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Supported File Formats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium">CSV Files</p>
                <p className="text-sm text-muted-foreground">
                  Comma-separated values, UTF-8 encoded
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 dark:bg-blue-900/30 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Excel Files</p>
                <p className="text-sm text-muted-foreground">
                  .xlsx format, up to 50MB
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <FileJson className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">JSON Files</p>
                <p className="text-sm text-muted-foreground">
                  Array of objects format
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link href="/docs/integration/quick-start">
                <FileText className="w-4 h-4 mr-2" />
                View Import Documentation
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEntityData && (
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedEntityData.color} flex items-center justify-center`}
                >
                  <selectedEntityData.icon className="w-4 h-4 text-white" />
                </div>
              )}
              Import {selectedEntityData?.name}
            </DialogTitle>
            <DialogDescription>
              Upload your file and configure import settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Source Platform */}
            <div className="space-y-2">
              <Label>Source Platform</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source platform" />
                </SelectTrigger>
                <SelectContent>
                  {sourcePlatforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                    <div className="text-left">
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-1">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports CSV, XLSX, and JSON files up to 100MB
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Select File
                      </label>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Required Fields Info */}
            {selectedEntityData && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Required Fields</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEntityData.requiredFields.map((field) => (
                    <Badge key={field} variant="secondary">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!uploadedFile || !selectedSource}>
              <Upload className="w-4 h-4 mr-2" />
              Continue to Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PermissionGate>
  );
}
