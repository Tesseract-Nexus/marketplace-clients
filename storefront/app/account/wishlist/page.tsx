'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, Share2, Plus, Folder, ChevronDown, Loader2, ListPlus, FolderHeart } from 'lucide-react';
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
import { useListsStore, List } from '@/store/lists';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { getProduct } from '@/lib/api/storefront';
import { getProductShippingData } from '@/lib/utils/product-shipping';
import { PriceDisplay } from '@/components/currency/PriceDisplay';

export default function WishlistPage() {
  const getNavPath = useNavPath();
  const { tenant } = useTenant();
  const { customer, accessToken, isAuthenticated } = useAuthStore();
  const {
    lists,
    isLoading,
    fetchLists,
    createList,
    removeFromList,
    getList
  } = useListsStore();
  const addToCart = useCartStore((state) => state.addItem);

  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Fetch lists when authenticated
  useEffect(() => {
    if (isAuthenticated && tenant && customer) {
      fetchLists(tenant.id, tenant.storefrontId, customer.id, accessToken || '');
    }
  }, [isAuthenticated, tenant, customer?.id, accessToken, fetchLists]);

  // Set selected list to default list when lists load
  useEffect(() => {
    if (lists.length > 0 && !selectedList) {
      const defaultList = lists.find(l => l.isDefault);
      setSelectedList(defaultList || lists[0] || null);
    }
  }, [lists, selectedList]);

  // Refresh selected list when lists update
  useEffect(() => {
    if (selectedList) {
      const updatedList = lists.find(l => l.id === selectedList.id);
      if (updatedList) {
        setSelectedList(updatedList);
      }
    }
  }, [lists, selectedList?.id]);

  const handleAddToCart = async (item: NonNullable<List['items']>[0]) => {
    if (!tenant) return;

    setIsAddingToCart(item.id);
    try {
      let shippingData = {};
      const product = await getProduct(tenant.id, tenant.storefrontId, item.productId);
      if (product) {
        shippingData = getProductShippingData(product);
      }

      addToCart({
        productId: item.productId,
        name: item.productName,
        price: item.productPrice,
        quantity: 1,
        image: item.productImage,
        ...shippingData,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!tenant || !customer || !selectedList) return;

    setIsRemoving(itemId);
    try {
      await removeFromList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', selectedList.id, itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setIsRemoving(null);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim() || !tenant || !customer) return;

    setIsCreating(true);
    try {
      const newList = await createList(
        tenant.id,
        tenant.storefrontId,
        customer.id,
        accessToken || '',
        newListName.trim(),
        newListDescription.trim() || undefined
      );
      setNewListName('');
      setNewListDescription('');
      setIsCreateOpen(false);
      setSelectedList(newList);
    } catch (error) {
      console.error('Failed to create list:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddAllToCart = async () => {
    if (!selectedList?.items || !tenant) return;

    for (const item of selectedList.items) {
      await handleAddToCart(item);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-tenant-primary" />
        </div>
      </div>
    );
  }

  // Empty state when no lists or no items
  const hasItems = selectedList?.items && selectedList.items.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border p-6">
        {/* Header with list selector and create button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {/* List Selector Dropdown */}
            {lists.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {selectedList?.isDefault ? (
                      <Heart className="h-4 w-4 text-red-500" />
                    ) : (
                      <Folder className="h-4 w-4 text-tenant-primary" />
                    )}
                    <span className="font-semibold">{selectedList?.name || 'Select List'}</span>
                    <span className="text-muted-foreground">
                      ({selectedList?.itemCount || 0} <TranslatedUIText text="items" />)
                    </span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {lists.map((list) => (
                    <DropdownMenuItem
                      key={list.id}
                      onClick={() => setSelectedList(list)}
                      className="flex items-center gap-2 py-2.5 cursor-pointer"
                    >
                      {list.isDefault ? (
                        <Heart className="h-4 w-4 text-red-500" />
                      ) : (
                        <Folder className="h-4 w-4 text-tenant-primary" />
                      )}
                      <span className="flex-1 truncate">{list.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {list.itemCount}
                      </span>
                      {list.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                          Default
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex gap-2">
            {/* Create New List Button */}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsCreateOpen(true)}
            >
              <ListPlus className="h-4 w-4" />
              <TranslatedUIText text="Create New List" />
            </Button>

            {hasItems && (
              <Button className="btn-tenant-primary" size="sm" onClick={handleAddAllToCart}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                <TranslatedUIText text="Add All to Cart" />
              </Button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {!hasItems ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center">
              <Heart className="h-10 w-10 text-tenant-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              <TranslatedUIText text={selectedList ? `${selectedList.name} is empty` : "Your wishlist is empty"} />
            </h3>
            <p className="text-muted-foreground mb-4">
              <TranslatedUIText text="Save items you love by clicking the heart icon on products." />
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="btn-tenant-primary">
                <Link href={getNavPath('/products')}>
                  <TranslatedUIText text="Discover Products" />
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <TranslatedUIText text="Create New List" />
              </Button>
            </div>
          </div>
        ) : (
          /* Items Grid */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {selectedList?.items?.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-card rounded-xl overflow-hidden border hover-lift"
                >
                  <Link href={getNavPath(`/products/${item.productId}`)}>
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      <Image
                        src={item.productImage || '/placeholder.svg'}
                        alt={item.productName}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--tenant-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link
                      href={getNavPath(`/products/${item.productId}`)}
                      className="font-semibold line-clamp-2 hover:text-tenant-primary transition-colors duration-300"
                    >
                      {item.productName}
                    </Link>
                    <div className="mt-2">
                      <PriceDisplay amount={item.productPrice} size="lg" />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        className="flex-1 btn-tenant-primary shadow-sm"
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                        disabled={isAddingToCart === item.id}
                      >
                        {isAddingToCart === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            <TranslatedUIText text="Add to Cart" />
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 hover:text-red-500 hover:border-red-200 hover:bg-red-50"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isRemoving === item.id}
                      >
                        {isRemoving === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="icon" className="shrink-0 hover:text-tenant-primary hover:border-[var(--tenant-primary)]/30 hover:bg-[var(--tenant-primary)]/5">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* All Lists Overview */}
      {lists.length > 1 && (
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              <TranslatedUIText text="All My Lists" />
            </h3>
            <Link
              href={getNavPath('/account/lists')}
              className="text-sm text-tenant-primary hover:underline"
            >
              <TranslatedUIText text="Manage Lists" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => setSelectedList(list)}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  selectedList?.id === list.id
                    ? 'bg-[var(--tenant-primary)]/10 border border-[var(--tenant-primary)]/30'
                    : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--tenant-primary)]/10 flex items-center justify-center">
                  {list.isDefault ? (
                    <Heart className="h-5 w-5 text-tenant-primary" />
                  ) : (
                    <Folder className="h-5 w-5 text-tenant-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{list.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create New List Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FolderHeart className="h-5 w-5 text-primary" />
              </div>
              <TranslatedUIText text="Create New List" />
            </DialogTitle>
            <DialogDescription>
              <TranslatedUIText text="Create a new list to organize your favorite products." />
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                <TranslatedUIText text="List Name" /> *
              </label>
              <Input
                id="name"
                placeholder="e.g., Christmas Ideas, Birthday Gifts"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                maxLength={100}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newListName.trim()) {
                    handleCreateList();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                <TranslatedUIText text="Description" /> (<TranslatedUIText text="optional" />)
              </label>
              <Input
                id="description"
                placeholder="Add a description..."
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              <TranslatedUIText text="Cancel" />
            </Button>
            <Button
              className="btn-tenant-primary"
              onClick={handleCreateList}
              disabled={!newListName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <TranslatedUIText text="Creating..." />
                </>
              ) : (
                <TranslatedUIText text="Create List" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
