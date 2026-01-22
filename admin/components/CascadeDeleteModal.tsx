"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2, AlertTriangle, X, Loader2, CheckCircle, XCircle,
  Package, Layers, Building2, Truck, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { productsService } from '@/lib/api/products';
import type {
  CascadeDeleteOptions,
  CascadeValidationResult,
  CascadeDeleteResult,
  BlockedEntity,
  AffectedSummary,
} from '@/lib/types/cascade-delete';
import { getDefaultCascadeOptions } from '@/lib/types/cascade-delete';

interface ProductInfo {
  id: string;
  name: string;
}

interface CascadeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: CascadeDeleteResult) => void;
  products: ProductInfo[];
  isBulk?: boolean;
}

export function CascadeDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  products,
  isBulk = false,
}: CascadeDeleteModalProps) {
  const [options, setOptions] = useState<CascadeDeleteOptions>(getDefaultCascadeOptions());
  const [validating, setValidating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [validation, setValidation] = useState<CascadeValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Validate cascade options whenever they change
  const validateOptions = useCallback(async () => {
    if (products.length === 0) return;

    setValidating(true);
    setError(null);

    try {
      let result;
      if (isBulk || products.length > 1) {
        const response = await productsService.validateBulkCascadeDelete(
          products.map(p => p.id),
          options
        );
        result = response.data;
      } else {
        const response = await productsService.validateCascadeDelete(
          products[0].id,
          options
        );
        result = response.data;
      }
      setValidation(result ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
      setValidation(null);
    } finally {
      setValidating(false);
    }
  }, [products, options, isBulk]);

  // Run validation when modal opens or options change
  useEffect(() => {
    if (isOpen && products.length > 0) {
      validateOptions();
    }
  }, [isOpen, options, validateOptions]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOptions(getDefaultCascadeOptions());
      setValidation(null);
      setError(null);
      setDeleteError(null);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      let result: CascadeDeleteResult | undefined;
      if (isBulk || products.length > 1) {
        const response = await productsService.bulkDeleteWithCascade(
          products.map(p => p.id),
          options
        );
        result = response.data;
      } else {
        const response = await productsService.deleteWithCascade(
          products[0].id,
          options
        );
        result = response.data;
      }

      if (result) {
        onSuccess(result);
        onClose();
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const updateOption = (key: keyof CascadeDeleteOptions, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const isEntityBlocked = (type: string): BlockedEntity | undefined => {
    return validation?.blockedEntities?.find(b => b.type === type);
  };

  if (!isOpen) return null;

  const productCount = products.length;
  const title = isBulk || productCount > 1
    ? `Delete ${productCount} Products`
    : `Delete "${products[0]?.name}"`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-2xl shadow-2xl max-w-lg w-full pointer-events-auto animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col items-center p-6 border-b bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg mb-4">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center">{title}</h2>
            {productCount > 1 && (
              <p className="text-sm text-muted-foreground mt-1">
                {productCount} products selected for deletion
              </p>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Delete error */}
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{deleteError}</p>
              </div>
            )}

            {/* Cascade Options */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Delete Options
              </h3>

              {/* Variants Option */}
              <CascadeOption
                icon={<Tag className="w-4 h-4 text-violet-500" />}
                label="Delete Variants"
                description={
                  validation?.affectedSummary?.variantCount
                    ? `${validation.affectedSummary.variantCount} variant(s) will be deleted`
                    : "Product variants will be deleted"
                }
                checked={options.deleteVariants}
                onChange={(checked) => updateOption('deleteVariants', checked)}
                blocked={isEntityBlocked('variants')}
                loading={validating}
              />

              {/* Category Option */}
              <CascadeOption
                icon={<Package className="w-4 h-4 text-primary" />}
                label="Delete Category"
                description={
                  validation?.affectedSummary?.categoryNames?.length
                    ? `"${validation.affectedSummary.categoryNames.join('", "')}"`
                    : "Associated category (if not used by other products)"
                }
                checked={options.deleteCategory}
                onChange={(checked) => updateOption('deleteCategory', checked)}
                blocked={isEntityBlocked('category')}
                loading={validating}
              />

              {/* Warehouse Option */}
              <CascadeOption
                icon={<Building2 className="w-4 h-4 text-warning" />}
                label="Delete Warehouse"
                description={
                  validation?.affectedSummary?.warehouseNames?.length
                    ? `"${validation.affectedSummary.warehouseNames.join('", "')}"`
                    : "Associated warehouse (if not used by other products)"
                }
                checked={options.deleteWarehouse}
                onChange={(checked) => updateOption('deleteWarehouse', checked)}
                blocked={isEntityBlocked('warehouse')}
                loading={validating}
              />

              {/* Supplier Option */}
              <CascadeOption
                icon={<Truck className="w-4 h-4 text-success" />}
                label="Delete Supplier"
                description={
                  validation?.affectedSummary?.supplierNames?.length
                    ? `"${validation.affectedSummary.supplierNames.join('", "')}"`
                    : "Associated supplier (if not used by other products)"
                }
                checked={options.deleteSupplier}
                onChange={(checked) => updateOption('deleteSupplier', checked)}
                blocked={isEntityBlocked('supplier')}
                loading={validating}
              />
            </div>

            {/* Validation Summary */}
            {validation && !validating && (
              <div className="mt-6">
                <DeleteSummary
                  summary={validation.affectedSummary}
                  canDelete={validation.canDelete}
                  blockedEntities={validation.blockedEntities}
                />
              </div>
            )}

            {/* Loading indicator */}
            {validating && (
              <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Validating delete options...</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 pt-0 border-t bg-muted">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-4 py-3 bg-muted text-foreground rounded-xl hover:bg-muted transition-all font-semibold border-2 border-border hover:border-border disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={validating || deleting || !validation?.canDelete}
              className={cn(
                "flex-1 px-4 py-3 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl bg-gradient-to-r flex items-center justify-center gap-2",
                validation?.canDelete
                  ? "from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                  : "from-gray-400 to-gray-500 cursor-not-allowed"
              )}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/80 hover:bg-white transition-colors shadow-md"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </>
  );
}

// Cascade option component
interface CascadeOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  blocked?: BlockedEntity;
  loading?: boolean;
}

function CascadeOption({
  icon,
  label,
  description,
  checked,
  onChange,
  blocked,
  loading,
}: CascadeOptionProps) {
  const isBlocked = !!blocked;
  const isCheckedButBlocked = checked && isBlocked;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border-2 transition-all",
        isBlocked
          ? "bg-warning-muted border-warning/30"
          : checked
            ? "bg-primary/10 border-primary/30"
            : "bg-muted border-border hover:border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Checkbox
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={loading}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-foreground">{label}</span>
            {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>

          {/* Blocked warning */}
          {isCheckedButBlocked && (
            <div className="mt-2 p-2 bg-warning-muted rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Cannot delete</p>
                <p className="text-xs text-warning-foreground">{blocked.reason}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Delete summary component
interface DeleteSummaryProps {
  summary: AffectedSummary;
  canDelete: boolean;
  blockedEntities: BlockedEntity[];
}

function DeleteSummary({ summary, canDelete, blockedEntities }: DeleteSummaryProps) {
  const hasBlockedEntities = blockedEntities.length > 0;

  return (
    <div className={cn(
      "p-4 rounded-xl border-2",
      canDelete
        ? "bg-success-muted border-success/30"
        : "bg-red-50 border-red-200"
    )}>
      <div className="flex items-start gap-2">
        {canDelete ? (
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className={cn(
            "font-semibold",
            canDelete ? "text-green-800" : "text-red-800"
          )}>
            {canDelete ? "Ready to delete" : "Cannot proceed with current options"}
          </p>

          {/* Summary of what will be deleted */}
          <div className="mt-2 space-y-1">
            <SummaryItem label="Products" count={summary.productCount} />
            {summary.variantCount > 0 && (
              <SummaryItem label="Variants" count={summary.variantCount} />
            )}
            {summary.categoryCount > 0 && (
              <SummaryItem label="Categories" count={summary.categoryCount} />
            )}
            {summary.warehouseCount > 0 && (
              <SummaryItem label="Warehouses" count={summary.warehouseCount} />
            )}
            {summary.supplierCount > 0 && (
              <SummaryItem label="Suppliers" count={summary.supplierCount} />
            )}
          </div>

          {/* Blocked entities message */}
          {hasBlockedEntities && !canDelete && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-sm text-red-700">
                Uncheck the blocked options to proceed with deletion.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, count }: { label: string; count: number }) {
  return (
    <p className="text-sm text-foreground">
      <span className="font-medium">{count}</span> {label.toLowerCase()}
      {count !== 1 ? '' : label.endsWith('s') ? '' : ''}
    </p>
  );
}
