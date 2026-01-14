'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

export type EntityType = 'products' | 'categories' | 'warehouses' | 'suppliers' | 'staff' | 'departments' | 'teams' | 'roles';

interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  createdCount?: number;
  updatedCount?: number;
  failedCount: number;
  skippedCount?: number;
  errors?: Array<{
    row: number;
    column?: string;
    code: string;
    message: string;
  }>;
  createdIds?: string[];
  updatedIds?: string[];
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  entityType: EntityType;
  entityLabel: string;
  tenantId?: string;
}

const entityConfig: Record<EntityType, {
  apiBase: string;
  icon: string;
  templateDescription: string;
}> = {
  products: {
    apiBase: '/api/products',
    icon: '📦',
    templateDescription: 'name, sku, price, categoryId, vendorId, description, quantity, tags...',
  },
  categories: {
    apiBase: '/api/categories',
    icon: '📂',
    templateDescription: 'name, slug, description, parentId, position, isActive, tier, tags...',
  },
  warehouses: {
    apiBase: '/api/inventory/warehouses',
    icon: '🏭',
    templateDescription: 'code, name, address1, city, state, postalCode, country, phone...',
  },
  suppliers: {
    apiBase: '/api/inventory/suppliers',
    icon: '🚚',
    templateDescription: 'code, name, contactName, email, phone, address, paymentTerms...',
  },
  staff: {
    apiBase: '/api/staff',
    icon: '👥',
    templateDescription: 'firstName, lastName, email, phoneNumber, role, employmentType, departmentName, teamName, jobTitle...',
  },
  departments: {
    apiBase: '/api/departments',
    icon: '🏢',
    templateDescription: 'name, code, description, parentDepartmentName',
  },
  teams: {
    apiBase: '/api/teams',
    icon: '👨‍👩‍👧‍👦',
    templateDescription: 'name, code, departmentName, maxCapacity',
  },
  roles: {
    apiBase: '/api/roles',
    icon: '🔐',
    templateDescription: 'name, displayName, description, priority, permissions',
  },
};

export function BulkImportModal({
  isOpen,
  onClose,
  onSuccess,
  entityType,
  entityLabel,
  tenantId,
}: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<'csv' | 'xlsx' | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [validateOnly, setValidateOnly] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasValidationOnly, setWasValidationOnly] = useState(false); // Track if last operation was validation
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = entityConfig[entityType];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFileType(droppedFile)) {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    } else {
      setError('Please upload a CSV or Excel (.xlsx) file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFileType(selectedFile)) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    } else if (selectedFile) {
      setError('Please upload a CSV or Excel (.xlsx) file');
    }
  };

  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );
    return hasValidType || hasValidExtension;
  };

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    setIsDownloading(format);
    try {
      const response = await fetch(
        `${config.apiBase}/import/template?format=${format}`,
        {
          headers: {
            'X-Tenant-ID': tenantId || '',
            'X-Vendor-ID': tenantId || '',
          },
          credentials: 'include', // Include session cookies for BFF authentication
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}_import_template.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleImport = async (forceImport: boolean = false) => {
    if (!file) return;

    const isValidating = validateOnly && !forceImport;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skipDuplicates', skipDuplicates.toString());
      formData.append('updateExisting', updateExisting.toString());
      formData.append('validateOnly', isValidating.toString());

      const response = await fetch(`${config.apiBase}/import`, {
        method: 'POST',
        headers: {
          'X-Tenant-ID': tenantId || '',
          'X-Vendor-ID': tenantId || '',
        },
        credentials: 'include', // Include session cookies for BFF authentication
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Import failed');
      }

      setResult(data);
      setWasValidationOnly(isValidating);

      if (data.success && data.successCount > 0 && !isValidating) {
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportAfterValidation = () => {
    handleImport(true);
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setSkipDuplicates(true);
    setUpdateExisting(false);
    setValidateOnly(false);
    setWasValidationOnly(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Bulk Import {entityLabel}
              </h2>
              <p className="text-sm text-muted-foreground">
                Import multiple {entityLabel.toLowerCase()} from a file
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Download Template */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
              Download Template
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Download a template file with the correct format and column headers.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleDownloadTemplate('csv')}
                disabled={isDownloading !== null}
                className="flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-border text-foreground rounded-xl hover:bg-muted hover:border-border transition-all"
              >
                {isDownloading === 'csv' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-green-600" />
                )}
                CSV Template
                <Download className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button
                onClick={() => handleDownloadTemplate('xlsx')}
                disabled={isDownloading !== null}
                className="flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-border text-foreground rounded-xl hover:bg-muted hover:border-border transition-all"
              >
                {isDownloading === 'xlsx' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                )}
                Excel Template
                <Download className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Columns: {config.templateDescription}
            </p>
          </div>

          {/* Step 2: Upload File */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
              Upload Your File
            </h3>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                isDragging
                  ? "border-primary/70 bg-primary/10"
                  : file
                    ? "border-green-400 bg-green-50"
                    : "border-border hover:border-primary/70 hover:bg-primary/10/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-10 h-10 text-green-600" />
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setResult(null);
                    }}
                    className="p-1 hover:bg-muted rounded-full ml-2"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-semibold">
                    Drop file here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports CSV and Excel files (max 100 items)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Step 3: Options */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
              Import Options
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => {
                    setUpdateExisting(e.target.checked);
                    if (e.target.checked) setSkipDuplicates(false);
                  }}
                  className="w-4 h-4 rounded border-border text-green-600 focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">Update existing items</span>
                  <p className="text-xs text-muted-foreground">If an item with same SKU exists, update it with new data</p>
                </div>
              </label>
              <label className={cn("flex items-center gap-3 cursor-pointer", updateExisting && "opacity-50")}>
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  disabled={updateExisting}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">Skip duplicates</span>
                  <p className="text-xs text-muted-foreground">Continue importing even if some items already exist (ignored when updating)</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={validateOnly}
                  onChange={(e) => setValidateOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">Validate only (dry run)</span>
                  <p className="text-xs text-muted-foreground">Check for errors without actually importing</p>
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Import Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={cn(
              "mb-4 p-4 rounded-xl border",
              result.success && result.successCount > 0
                ? "bg-green-50 border-green-200"
                : result.failedCount > 0
                  ? "bg-amber-50 border-amber-200"
                  : "bg-red-50 border-red-200"
            )}>
              <div className="flex items-start gap-3">
                {result.success && result.successCount > 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : result.failedCount > 0 && result.successCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {wasValidationOnly ? 'Validation Complete' : 'Import Complete'}
                  </p>
                  <div className="mt-2 grid gap-4 text-sm grid-cols-2 sm:grid-cols-4">
                    <div className="text-center p-2 bg-card rounded-lg">
                      <p className="text-2xl font-bold text-foreground">{result.totalRows}</p>
                      <p className="text-muted-foreground">Total Rows</p>
                    </div>
                    {(result.createdCount !== undefined && result.updatedCount !== undefined) ? (
                      <>
                        <div className="text-center p-2 bg-card rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{result.createdCount}</p>
                          <p className="text-muted-foreground">Created</p>
                        </div>
                        <div className="text-center p-2 bg-card rounded-lg">
                          <p className="text-2xl font-bold text-primary">{result.updatedCount}</p>
                          <p className="text-muted-foreground">Updated</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2 bg-card rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
                        <p className="text-muted-foreground">{wasValidationOnly ? 'Valid' : 'Imported'}</p>
                      </div>
                    )}
                    <div className="text-center p-2 bg-card rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{result.failedCount}</p>
                      <p className="text-muted-foreground">Failed</p>
                    </div>
                    {result.skippedCount && result.skippedCount > 0 && (
                      <div className="text-center p-2 bg-card rounded-lg">
                        <p className="text-2xl font-bold text-amber-600">{result.skippedCount}</p>
                        <p className="text-muted-foreground">Skipped</p>
                      </div>
                    )}
                  </div>

                  {/* Show success message after validation */}
                  {wasValidationOnly && result.successCount > 0 && (
                    <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-2">
                      <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-primary">
                        {result.failedCount > 0 ? (
                          <>
                            <strong>{result.successCount}</strong> items passed validation.{' '}
                            {skipDuplicates ? (
                              <>Click <strong>Import Valid Items</strong> to import only the valid items, or fix errors and re-upload.</>
                            ) : (
                              <>Fix the errors above and re-upload the file.</>
                            )}
                          </>
                        ) : (
                          <>Validation passed! Click <strong>Import Now</strong> to import {result.successCount} {entityLabel.toLowerCase()}.</>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Show message when all rows failed validation */}
                  {wasValidationOnly && result.successCount === 0 && result.failedCount > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">
                        All rows failed validation. Please fix the errors above and re-upload the file.
                      </p>
                    </div>
                  )}

                  {/* Show errors */}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-foreground mb-2">Errors:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {result.errors.slice(0, 10).map((err, i) => (
                          <div key={i} className="text-xs p-2 bg-card rounded border border-red-100">
                            <span className="font-semibold text-red-600">Row {err.row}</span>
                            {err.column && <span className="text-muted-foreground"> ({err.column})</span>}
                            : {err.message}
                          </div>
                        ))}
                        {result.errors.length > 10 && (
                          <p className="text-xs text-muted-foreground italic">
                            ... and {result.errors.length - 10} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted">
          <Button
            onClick={handleClose}
            className="px-6 py-2.5 bg-card border-2 border-border text-foreground rounded-xl hover:bg-muted transition-all"
          >
            {result?.success && result.successCount > 0 && !wasValidationOnly ? 'Close' : 'Cancel'}
          </Button>

          {/* Show "Re-upload" button after validation with errors */}
          {result && wasValidationOnly && result.failedCount > 0 && (
            <Button
              onClick={() => {
                setResult(null);
                setFile(null);
                setWasValidationOnly(false);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="px-6 py-2.5 bg-card border-2 border-amber-300 text-amber-700 rounded-xl hover:bg-amber-50 transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Re-upload File
            </Button>
          )}

          {/* Show "Import Now" / "Import Valid Items" button after validation with valid rows */}
          {result && wasValidationOnly && result.successCount > 0 && (
            <Button
              onClick={handleImportAfterValidation}
              disabled={isUploading}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {result.failedCount > 0
                    ? `Import Valid Items (${result.successCount})`
                    : `Import Now (${result.successCount} items)`}
                </>
              )}
            </Button>
          )}

          {/* Show validate/import button when no result */}
          {!result && (
            <Button
              onClick={() => handleImport()}
              disabled={!file || isUploading}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {validateOnly ? 'Validating...' : 'Importing...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {validateOnly ? 'Validate' : `Import ${entityLabel}`}
                </>
              )}
            </Button>
          )}

          {/* Show retry button after failed import (not validation) */}
          {result && !wasValidationOnly && result.failedCount > 0 && result.successCount === 0 && (
            <Button
              onClick={() => {
                setResult(null);
                setError(null);
              }}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
