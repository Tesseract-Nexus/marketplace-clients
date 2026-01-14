'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { Loader2, AlertCircle, Package } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

interface RequestReturnDialogProps {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'Product is defective or damaged' },
  { value: 'WRONG_ITEM', label: 'Wrong item received' },
  { value: 'NOT_AS_DESCRIBED', label: 'Product not as described' },
  { value: 'CHANGED_MIND', label: 'Changed my mind' },
  { value: 'BETTER_PRICE', label: 'Found better price elsewhere' },
  { value: 'NO_LONGER_NEEDED', label: 'No longer needed' },
  { value: 'OTHER', label: 'Other reason' },
];

const RETURN_TYPES = [
  { value: 'REFUND', label: 'Refund to original payment method' },
  { value: 'EXCHANGE', label: 'Exchange for another product' },
  { value: 'CREDIT', label: 'Store credit' },
];

interface SelectedItem {
  orderItemId: string;
  quantity: number;
  reason: string;
  notes: string;
}

export function RequestReturnDialog({
  orderId,
  orderNumber,
  items,
  open,
  onOpenChange,
  onSuccess,
}: RequestReturnDialogProps) {
  const { tenant } = useTenant();
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reason, setReason] = useState('DEFECTIVE');
  const [returnType, setReturnType] = useState('REFUND');
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());

  const toggleItem = (item: OrderItem) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.set(item.id, {
        orderItemId: item.id,
        quantity: item.quantity,
        reason: reason,
        notes: '',
      });
    }
    setSelectedItems(newSelected);
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(itemId);
    if (item) {
      newSelected.set(itemId, { ...item, quantity });
      setSelectedItems(newSelected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !accessToken) return;

    if (selectedItems.size === 0) {
      setError('Please select at least one item to return');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const returnItems = Array.from(selectedItems.values()).map(item => ({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        reason: reason,
        notes: item.notes,
      }));

      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-ID': tenant.id,
          'X-Storefront-ID': tenant.storefrontId,
        },
        body: JSON.stringify({
          orderId,
          reason,
          returnType,
          customerNotes,
          items: returnItems,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit return request');
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setSelectedItems(new Map());
        setCustomerNotes('');
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedItems(new Map());
      setCustomerNotes('');
      setError(null);
      setSuccess(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Return</DialogTitle>
          <DialogDescription>
            Submit a return request for Order #{orderNumber}. Select the items you wish to return.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Return Request Submitted</h3>
            <p className="text-sm text-muted-foreground">
              We have received your return request. You will receive an email with further instructions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select Items */}
            <div className="space-y-3">
              <Label>Select Items to Return</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                {items.map((item) => {
                  const isSelected = selectedItems.has(item.id);
                  const selectedItem = selectedItems.get(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleItem(item)}
                      />
                      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        {item.variant && (
                          <p className="text-xs text-muted-foreground">{item.variant}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Qty:</Label>
                          <Select
                            value={String(selectedItem?.quantity || 1)}
                            onValueChange={(v) => updateItemQuantity(item.id, parseInt(v))}
                          >
                            <SelectTrigger className="w-16 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: item.quantity }, (_, i) => i + 1).map((qty) => (
                                <SelectItem key={qty} value={String(qty)}>
                                  {qty}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Return Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Return</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Return Type */}
            <div className="space-y-2">
              <Label htmlFor="returnType">Preferred Resolution</Label>
              <Select value={returnType} onValueChange={setReturnType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Please provide any additional details about your return..."
                rows={3}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="btn-tenant-primary" disabled={loading || selectedItems.size === 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Return Request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
