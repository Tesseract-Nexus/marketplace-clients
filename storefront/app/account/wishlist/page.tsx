'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Share2, Plus, Folder, ChevronDown, Loader2, ListPlus, FolderHeart, AlertTriangle, TrendingUp, TrendingDown, Ban, ArrowRightLeft } from 'lucide-react';
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
    moveItem,
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
  const [isMoving, setIsMoving] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [freshProductData, setFreshProductData] = useState<
    Record<string, { price: number; available: boolean; name: string; image: string; inStock: boolean } | null>
  >({});

  // Fetch fresh product data for items in the selected list
  const refreshProductData = useCallback(async (items: NonNullable<List['items']>) => {
    if (!tenant || items.length === 0) return;

    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled(
        items.map(async (item) => {
          const product = await getProduct(tenant.id, tenant.storefrontId, item.productId);
          if (!product) {
            return { productId: item.productId, data: null };
          }
          const firstImage = product.images?.[0];
          const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;
          return {
            productId: item.productId,
            data: {
              price: parseFloat(String(product.price)) || item.productPrice,
              available: true,
              name: product.name ?? item.productName,
              image: imageUrl ?? item.productImage,
              inStock: product.quantity === undefined || product.quantity > 0,
            },
          };
        })
      );

      const freshData: typeof freshProductData = {};
      for (const result of results) {
        if (result.status === 'fulfilled') {
          freshData[result.value.productId] = result.value.data;
        }
      }
      setFreshProductData(freshData);
    } catch (error) {
      console.error('Failed to refresh product data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [tenant]);

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

  // Fetch full list details (including items) when selected list changes
  useEffect(() => {
    if (selectedList?.id && isAuthenticated && tenant && customer) {
      getList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', selectedList.id)
        .then(fullList => {
          if (fullList) setSelectedList(fullList);
        });
    }
  }, [selectedList?.id, isAuthenticated, tenant?.id, customer?.id]);

  // Refresh selected list when lists update (preserve items if store list lacks them)
  useEffect(() => {
    if (selectedList) {
      const updatedList = lists.find(l => l.id === selectedList.id);
      if (updatedList) {
        setSelectedList(prev => {
          if (!prev) return updatedList;
          // If store list has items (optimistic update), use them; otherwise keep existing
          return {
            ...updatedList,
            items: updatedList.items ?? prev.items,
          };
        });
      }
    }
  }, [lists, selectedList?.id]);

  // Fetch fresh product data when selected list changes
  useEffect(() => {
    if (selectedList?.items && selectedList.items.length > 0) {
      refreshProductData(selectedList.items);
    } else {
      setFreshProductData({});
    }
  }, [selectedList?.id, selectedList?.items?.length, refreshProductData]);

  const getItemAvailability = (productId: string) => {
    const fresh = freshProductData[productId];
    if (fresh === null) return 'unavailable'; // Product deleted
    if (fresh === undefined) return 'unknown'; // Not yet fetched
    if (!fresh.inStock) return 'oos'; // Out of stock
    return 'available';
  };

  const getItemPriceChange = (productId: string, cachedPrice: number) => {
    const fresh = freshProductData[productId];
    if (!fresh || fresh === null) return null;
    if (Math.abs(fresh.price - cachedPrice) < 0.01) return null;
    return { oldPrice: cachedPrice, newPrice: fresh.price };
  };

  const handleAddToCart = async (item: NonNullable<List['items']>[0]) => {
    if (!tenant) return;

    const availability = getItemAvailability(item.productId);
    if (availability === 'unavailable' || availability === 'oos') return;

    setIsAddingToCart(item.id);
    try {
      let shippingData = {};
      const product = await getProduct(tenant.id, tenant.storefrontId, item.productId);
      if (product) {
        shippingData = getProductShippingData(product);
      }

      const fresh = freshProductData[item.productId];
      addToCart({
        productId: item.productId,
        name: fresh?.name || item.productName,
        price: fresh?.price || item.productPrice,
        quantity: 1,
        image: fresh?.image || item.productImage,
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
      // Immediately update local selectedList to reflect removal
      setSelectedList(prev => {
        if (!prev) return prev;
        const updatedItems = prev.items?.filter(i => i.id !== itemId) || [];
        return { ...prev, items: updatedItems, itemCount: updatedItems.length };
      });
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setIsRemoving(null);
    }
  };

  const handleMoveItem = async (itemId: string, toListId: string, toListName: string) => {
    if (!tenant || !customer || !selectedList) return;

    setIsMoving(itemId);
    try {
      await moveItem(tenant.id, tenant.storefrontId, customer.id, accessToken || '', selectedList.id, itemId, toListId);
      // Re-fetch the current list to refresh items
      const refreshed = await getList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', selectedList.id);
      if (refreshed) setSelectedList(refreshed);
    } catch (error) {
      console.error('Failed to move item:', error);
    } finally {
      setIsMoving(null);
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
      const availability = getItemAvailability(item.productId);
      if (availability === 'unavailable' || availability === 'oos') continue;
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
              {selectedList?.items?.map((item, index) => {
                const availability = getItemAvailability(item.productId);
                const priceChange = getItemPriceChange(item.productId, item.productPrice);
                const isUnavailable = availability === 'unavailable';
                const isOOS = availability === 'oos';
                const isDisabled = isUnavailable || isOOS;
                const fresh = freshProductData[item.productId];

                return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group bg-card rounded-xl overflow-hidden border hover-lift ${isDisabled ? 'opacity-75' : ''}`}
                >
                  <Link href={getNavPath(`/products/${item.productId}`)}>
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      <Image
                        src={(fresh?.image || item.productImage) || '/placeholder.svg'}
                        alt={fresh?.name || item.productName}
                        fill
                        className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isDisabled ? 'grayscale' : ''}`}
                      />
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--tenant-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Status badges */}
                      {isUnavailable && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                          <Ban className="h-3 w-3" />
                          Unavailable
                        </div>
                      )}
                      {isOOS && !isUnavailable && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Out of Stock
                        </div>
                      )}
                      {isRefreshing && availability === 'unknown' && (
                        <div className="absolute top-2 right-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link
                      href={getNavPath(`/products/${item.productId}`)}
                      className="font-semibold line-clamp-2 hover:text-tenant-primary transition-colors duration-300"
                    >
                      {fresh?.name || item.productName}
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                      {priceChange ? (
                        <>
                          <PriceDisplay amount={priceChange.newPrice} size="lg" />
                          <span className="text-sm text-muted-foreground line-through">
                            <PriceDisplay amount={priceChange.oldPrice} size="sm" />
                          </span>
                          {priceChange.newPrice > priceChange.oldPrice ? (
                            <TrendingUp className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          )}
                        </>
                      ) : (
                        <PriceDisplay amount={fresh?.price ?? item.productPrice} size="lg" />
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        className="flex-1 btn-tenant-primary shadow-sm"
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                        disabled={isAddingToCart === item.id || isDisabled}
                      >
                        {isAddingToCart === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isDisabled ? (
                          <TranslatedUIText text={isUnavailable ? "Unavailable" : "Out of Stock"} />
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
                        className="shrink-0 text-[var(--wishlist-active)] border-[var(--wishlist-active)]/30 hover:bg-red-50"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isRemoving === item.id}
                        title="Remove from list"
                      >
                        {isRemoving === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart className="h-4 w-4 fill-current" />
                        )}
                      </Button>
                      {/* Move to list dropdown - only show when 2+ lists */}
                      {lists.length > 1 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="shrink-0 hover:text-tenant-primary hover:border-[var(--tenant-primary)]/30 hover:bg-[var(--tenant-primary)]/5"
                              disabled={isMoving === item.id}
                            >
                              {isMoving === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowRightLeft className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                              <TranslatedUIText text="Move to..." />
                            </div>
                            {lists
                              .filter((l) => l.id !== selectedList?.id)
                              .map((list) => (
                                <DropdownMenuItem
                                  key={list.id}
                                  className="cursor-pointer flex items-center gap-2"
                                  onClick={() => handleMoveItem(item.id, list.id, list.name)}
                                >
                                  {list.isDefault ? (
                                    <Heart className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <Folder className="h-4 w-4 text-tenant-primary" />
                                  )}
                                  <span className="truncate">{list.name}</span>
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <Button variant="outline" size="icon" className="shrink-0 hover:text-tenant-primary hover:border-[var(--tenant-primary)]/30 hover:bg-[var(--tenant-primary)]/5">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
                );
              })}
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
