'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  ArrowLeft,
  Trash2,
  ShoppingCart,
  Loader2,
  Edit2,
  MoreVertical,
  Package,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavPath, useTenant } from '@/context/TenantContext';
import { useListsStore, List, ListItem } from '@/store/lists';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { getProduct } from '@/lib/api/storefront';
import { getProductShippingData } from '@/lib/utils/product-shipping';
import { formatPrice } from '@/lib/utils';

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const getNavPath = useNavPath();
  const { tenant } = useTenant();
  const { customer, isAuthenticated } = useAuthStore();
  const { getList, updateList, removeFromList, lists, fetchLists } = useListsStore();
  const { addItem } = useCartStore();

  const [list, setList] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [removeConfirmItem, setRemoveConfirmItem] = useState<ListItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    const loadList = async () => {
      if (!isAuthenticated || !tenant || !customer) return;

      setIsLoading(true);
      try {
        const fetchedList = await getList(
          tenant.id,
          tenant.storefrontId,
          customer.id,
          slug
        );
        setList(fetchedList);
        if (fetchedList) {
          setEditName(fetchedList.name);
          setEditDescription(fetchedList.description || '');
        }
      } catch (error) {
        console.error('Failed to load list:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadList();
  }, [isAuthenticated, tenant, customer?.id, slug, getList]);

  const handleUpdateList = async () => {
    if (!editName.trim() || !tenant || !customer || !list) return;

    setIsUpdating(true);
    try {
      const updatedList = await updateList(
        tenant.id,
        tenant.storefrontId,
        customer.id,
        list.id,
        editName.trim(),
        editDescription.trim() || undefined
      );
      setList(updatedList);
      setIsEditOpen(false);
    } catch (error) {
      console.error('Failed to update list:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (item: ListItem) => {
    if (!tenant || !customer || !list) return;

    setIsRemoving(true);
    try {
      await removeFromList(
        tenant.id,
        tenant.storefrontId,
        customer.id,
        list.id,
        item.id
      );
      // Update local list state
      setList((prev) =>
        prev
          ? {
              ...prev,
              itemCount: Math.max(0, prev.itemCount - 1),
              items: prev.items?.filter((i) => i.id !== item.id),
            }
          : null
      );
      setRemoveConfirmItem(null);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAddToCart = async (item: ListItem) => {
    if (!tenant) return;

    setAddingToCart(item.id);
    try {
      let shippingData = {};
      const product = await getProduct(tenant.id, tenant.storefrontId, item.productId);
      if (product) {
        shippingData = getProductShippingData(product);
      }
      addItem({
        productId: item.productId,
        name: item.productName,
        price: item.productPrice,
        image: item.productImage,
        quantity: 1,
        ...shippingData,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAddingToCart(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center">
            <Heart className="h-10 w-10 text-tenant-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Sign in to view your list</h3>
          <p className="text-muted-foreground mb-4">
            Access your saved items by signing in.
          </p>
          <Button asChild className="btn-tenant-primary">
            <Link href={getNavPath('/auth/login')}>Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-tenant-primary" />
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">List not found</h3>
          <p className="text-muted-foreground mb-4">
            The list you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button asChild className="btn-tenant-primary">
            <Link href={getNavPath('/account/lists')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lists
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={getNavPath('/account/lists')}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {list.name}
                {list.isDefault && (
                  <span className="text-xs bg-[var(--tenant-primary)]/10 text-tenant-primary px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </h2>
              {list.description && (
                <p className="text-sm text-muted-foreground">{list.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          {!list.isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(list.name);
                setEditDescription(list.description || '');
                setIsEditOpen(true);
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit List
            </Button>
          )}
        </div>

        {/* Items */}
        {(!list.items || list.items.length === 0) ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center">
              <Package className="h-10 w-10 text-tenant-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">This list is empty</h3>
            <p className="text-muted-foreground mb-4">
              Start adding products to your list while browsing.
            </p>
            <Button asChild className="btn-tenant-primary">
              <Link href={getNavPath('/')}>Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {list.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-muted/30 rounded-xl border border-transparent hover:border-[var(--tenant-primary)]/20 overflow-hidden"
                >
                  {/* Product Image */}
                  <Link
                    href={getNavPath(`/products/${item.productId}`)}
                    className="block aspect-square relative"
                  >
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </Link>

                  {/* Actions Menu */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleAddToCart(item)}
                          disabled={addingToCart === item.id}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setRemoveConfirmItem(item)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from List
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link
                      href={getNavPath(`/products/${item.productId}`)}
                      className="block"
                    >
                      <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-tenant-primary transition-colors">
                        {item.productName}
                      </h3>
                    </Link>
                    <p className="text-lg font-bold text-tenant-primary">
                      {formatPrice(item.productPrice)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 btn-tenant-primary text-xs"
                        onClick={() => handleAddToCart(item)}
                        disabled={addingToCart === item.id}
                      >
                        {addingToCart === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRemoveConfirmItem(item)}
                        className="text-muted-foreground hover:text-red-500 hover:border-red-200"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit List Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
            <DialogDescription>
              Update your list name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                List Name *
              </label>
              <Input
                id="edit-name"
                placeholder="e.g., Christmas Ideas, Birthday Gifts"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Input
                id="edit-description"
                placeholder="Add a description..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="btn-tenant-primary"
              onClick={handleUpdateList}
              disabled={!editName.trim() || isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Item Confirmation Dialog */}
      <Dialog
        open={!!removeConfirmItem}
        onOpenChange={() => setRemoveConfirmItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{removeConfirmItem?.productName}&quot;
              from this list?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveConfirmItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => removeConfirmItem && handleRemoveItem(removeConfirmItem)}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
