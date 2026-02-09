'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  SlidersHorizontal,
  Grid,
  List,
  Star,
  Heart,
  ShoppingCart,
  Package,
  X,
  Sparkles,
  Bookmark,
  Check,
  Ban,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTenant, useProductConfig, useNavPath } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { useListsStore } from '@/store/lists';
import { useAuthStore } from '@/store/auth';
import { usePriceFormatting } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getProductShippingData } from '@/lib/utils/product-shipping';
import { Product, Category } from '@/types/storefront';
import {
  TranslatedUIText,
  TranslatedProductName,
  TranslatedProductDescription,
  TranslatedCategoryName,
  TranslatedText
} from '@/components/translation/TranslatedText';

interface ProductsClientProps {
  initialProducts: Product[];
  categories: Category[];
  totalProducts: number;
}

export function ProductsClient({ initialProducts, categories, totalProducts }: ProductsClientProps) {
  const productConfig = useProductConfig();
  const getNavPath = useNavPath();
  const { formatDisplayPrice } = usePriceFormatting();
  const addToCart = useCartStore((state) => state.addItem);

  // Calculate dynamic price range from products
  const maxProductPrice = useMemo(() => {
    if (initialProducts.length === 0) return 10000;
    return Math.max(...initialProducts.map(p => parseFloat(p.price))) * 1.1; // 10% buffer
  }, [initialProducts]);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Math.ceil(maxProductPrice)]);

  const filteredProducts = useMemo(() => {
    let products = [...initialProducts];

    if (selectedCategories.length > 0) {
      products = products.filter((p) => selectedCategories.includes(p.categoryId || ''));
    }

    products = products.filter((p) => {
      const price = parseFloat(p.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortBy) {
      case 'price-asc':
        products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-desc':
        products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'rating':
        products.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'name':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return products;
  }, [initialProducts, selectedCategories, priceRange, sortBy]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, Math.ceil(maxProductPrice)]);
  };

  const hasActiveFilters = selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < Math.ceil(maxProductPrice);

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-tenant-primary rounded-full" />
          <TranslatedUIText text="Categories" />
        </h3>
        <div className="space-y-1">
          {categories.map((category) => (
            <div
              key={category.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer min-h-[44px]", // Touch-friendly min height
                selectedCategories.includes(category.id)
                  ? "bg-tenant-primary/10"
                  : "hover:bg-muted active:bg-muted"
              )}
              onClick={() => handleCategoryToggle(category.id)}
            >
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
                className="data-[state=checked]:bg-tenant-primary data-[state=checked]:border-tenant-primary h-5 w-5"
              />
              <Label htmlFor={category.id} className="flex-1 cursor-pointer text-sm">
                <TranslatedCategoryName name={category.name} />
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-tenant-secondary rounded-full" />
          <TranslatedUIText text="Price Range" />
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-3 py-2 rounded-lg bg-muted text-center text-sm font-medium">
            {formatDisplayPrice(priceRange[0])}
          </div>
          <span className="text-muted-foreground"><TranslatedUIText text="to" /></span>
          <div className="flex-1 px-3 py-2 rounded-lg bg-muted text-center text-sm font-medium">
            {formatDisplayPrice(priceRange[1])}
          </div>
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-tenant-accent rounded-full" />
          <TranslatedUIText text="Availability" />
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
            <Checkbox id="in-stock" defaultChecked />
            <Label htmlFor="in-stock" className="cursor-pointer text-sm"><TranslatedUIText text="In Stock" /></Label>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
            <Checkbox id="on-sale" />
            <Label htmlFor="on-sale" className="cursor-pointer text-sm"><TranslatedUIText text="On Sale" /></Label>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            <TranslatedUIText text="Clear All Filters" />
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)]/5 via-background to-[var(--tenant-secondary)]/5" />
        <div
          className="absolute top-0 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--tenant-primary)' }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--tenant-secondary)' }}
        />

        <div className="container-tenant relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tenant-primary/10 text-tenant-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium"><TranslatedUIText text="Discover Our Collection" /></span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              <TranslatedUIText text="All Products" />
            </h1>
            <p className="text-muted-foreground">
              <TranslatedUIText text="Explore" /> {totalProducts} <TranslatedUIText text="carefully curated products" />
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="container-tenant">
          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-4 rounded-xl bg-card border"
          >
            <div className="flex items-center gap-3">
              {/* Mobile Filters */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden gap-2 h-10">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden xs:inline"><TranslatedUIText text="Filters" /></span>
                    {hasActiveFilters && (
                      <Badge className="ml-1 bg-tenant-primary text-on-tenant-primary h-5 w-5 p-0 flex items-center justify-center">
                        {selectedCategories.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
                  <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
                    <SheetTitle className="flex items-center justify-between">
                      <TranslatedUIText text="Filters" />
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                          <TranslatedUIText text="Clear all" />
                        </Button>
                      )}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                    <FiltersContent />
                  </div>
                </SheetContent>
              </Sheet>

              <p className="text-sm text-muted-foreground">
                <TranslatedUIText text="Showing" /> <span className="font-semibold text-foreground">{filteredProducts.length}</span> <TranslatedUIText text="of" /> {totalProducts} <TranslatedUIText text="products" />
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="hidden sm:flex items-center border rounded-lg p-1 bg-muted/50">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort - responsive width */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest"><TranslatedUIText text="Newest First" /></SelectItem>
                  <SelectItem value="price-asc"><TranslatedUIText text="Price: Low to High" /></SelectItem>
                  <SelectItem value="price-desc"><TranslatedUIText text="Price: High to Low" /></SelectItem>
                  <SelectItem value="rating"><TranslatedUIText text="Top Rated" /></SelectItem>
                  <SelectItem value="name"><TranslatedUIText text="Name A-Z" /></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Desktop Filters Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="sticky top-24 bg-card rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg"><TranslatedUIText text="Filters" /></h2>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                      <TranslatedUIText text="Clear all" />
                    </Button>
                  )}
                </div>
                <FiltersContent />
              </div>
            </motion.div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {filteredProducts.length > 0 ? (
                  <motion.div
                    key="products"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'grid gap-3 sm:gap-4 md:gap-6',
                      viewMode === 'grid'
                        ? {
                            2: 'grid-cols-2',
                            3: 'grid-cols-2 md:grid-cols-3',
                            4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
                          }[productConfig.gridColumns] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        : 'grid-cols-1'
                    )}
                  >
                    {filteredProducts.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        viewMode={viewMode}
                        productConfig={productConfig}
                        getNavPath={getNavPath}
                        addToCart={addToCart}
                        formatDisplayPrice={formatDisplayPrice}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-20"
                  >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2"><TranslatedUIText text="No Products Found" /></h3>
                    <p className="text-muted-foreground mb-6">
                      <TranslatedUIText text="Try adjusting your filters to find what you're looking for" />
                    </p>
                    <Button onClick={clearFilters} className="btn-tenant-primary">
                      <TranslatedUIText text="Clear All Filters" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  index: number;
  viewMode: 'grid' | 'list';
  productConfig: ReturnType<typeof useProductConfig>;
  getNavPath: (path: string) => string;
  addToCart: (item: { productId: string; name: string; price: number; quantity: number; image?: string }) => void;
  formatDisplayPrice: (amount: number) => string;
}

function ProductCard({
  product,
  index,
  viewMode,
  productConfig,
  getNavPath,
  addToCart,
  formatDisplayPrice
}: ProductCardProps) {
  const { tenant } = useTenant();
  const { lists, fetchLists, addToList, addToDefaultList, removeProductFromList, isInAnyList } = useListsStore();
  const { customer, accessToken, isAuthenticated } = useAuthStore();

  // Detect touch device for consistent mobile behavior
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const price = parseFloat(product.price);
  const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  const isOutOfStock = product.inventoryStatus === 'OUT_OF_STOCK' || (product.quantity !== undefined && product.quantity <= 0);
  // Get images, prioritizing primary images first
  const images = useMemo(() => {
    const imgs = product.images || [];
    const sorted = [...imgs].sort((a, b) => {
      const aIsPrimary = typeof a !== 'string' && a?.isPrimary ? 1 : 0;
      const bIsPrimary = typeof b !== 'string' && b?.isPrimary ? 1 : 0;
      if (bIsPrimary !== aIsPrimary) return bIsPrimary - aIsPrimary;
      const aPos = typeof a !== 'string' ? (a?.position ?? 999) : 999;
      const bPos = typeof b !== 'string' ? (b?.position ?? 999) : 999;
      return aPos - bPos;
    });
    return sorted.map((img) => typeof img === 'string' ? img : img.url);
  }, [product.images]);
  const wishlisted = isInAnyList(product.id);

  // Fetch lists when authenticated
  useEffect(() => {
    if (isAuthenticated && tenant && customer && lists.length === 0) {
      fetchLists(tenant.id, tenant.storefrontId, customer.id, accessToken || '');
    }
  }, [isAuthenticated, tenant, lists.length, customer?.id, accessToken, fetchLists]);

  const handleQuickToggleDefault = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !customer || !tenant) {
      window.location.href = getNavPath(`/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const defaultList = lists.find((l) => l.isDefault);
    const isInDefaultList = defaultList?.items?.some((i) => i.productId === product.id);

    try {
      if (isInDefaultList && defaultList) {
        await removeProductFromList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', defaultList.id, product.id);
        toast.success(`Removed from ${defaultList.name}`);
      } else {
        await addToDefaultList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', {
          id: product.id,
          name: product.name,
          image: images[0],
          price,
        });
        toast.success(`Added to ${defaultList?.name || 'Wishlist'}`);
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleAddToList = async (listId: string, listName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !customer || !tenant) return;
    try {
      await addToList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', listId, {
        id: product.id,
        name: product.name,
        image: images[0],
        price,
      });
      toast.success(`Added to ${listName}`);
    } catch {
      toast.error(`Failed to add to ${listName}`);
    }
  };

  const handleRemoveFromList = async (listId: string, listName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !customer || !tenant) return;
    try {
      await removeProductFromList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', listId, product.id);
      toast.success(`Removed from ${listName}`);
    } catch {
      toast.error(`Failed to remove from ${listName}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'group bg-card rounded-xl border overflow-hidden hover-lift',
        viewMode === 'list' && 'flex'
      )}
    >
      <Link
        href={getNavPath(`/products/${product.id}`)}
        className={cn(viewMode === 'list' ? 'w-48 shrink-0' : '')}
      >
        <div className={cn("relative aspect-square bg-muted overflow-hidden", isOutOfStock && "opacity-75")}>
          <Image
            src={images[0] || '/placeholder.svg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--tenant-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {hasDiscount && (
              <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg">
                -{discountPercent}%
              </Badge>
            )}
            {product.inventoryStatus === 'LOW_STOCK' && (
              <Badge variant="secondary" className="glass-dark text-white border-0">
                <TranslatedUIText text="Low Stock" />
              </Badge>
            )}
            {isOutOfStock && (
              <Badge className="bg-muted-foreground text-background border-0 shadow-lg">
                <TranslatedUIText text="Sold Out" />
              </Badge>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
              <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                <TranslatedUIText text="Out of Stock" />
              </div>
            </div>
          )}

          {/* Mobile: simple heart toggle (always visible) */}
          {isTouchDevice && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute top-2 right-2 h-8 w-8 rounded-full transition-all duration-200 z-20',
                wishlisted
                  ? 'bg-[var(--wishlist-active)] text-white'
                  : 'bg-background/90 backdrop-blur-sm text-muted-foreground shadow-md border border-border/50'
              )}
              onClick={handleQuickToggleDefault}
            >
              <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
            </Button>
          )}

          {/* Desktop: dropdown for 2+ lists, simple toggle for 1 list */}
          {!isTouchDevice && (
            lists.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'absolute top-2 right-2 h-9 w-9 rounded-full transition-all duration-200 z-20',
                      wishlisted
                        ? 'opacity-100 bg-[var(--wishlist-active)] text-white hover:opacity-90'
                        : 'opacity-0 group-hover:opacity-100 bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-[var(--wishlist-active)] shadow-md border border-border/50'
                    )}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  {lists.map((list) => {
                    const isProductInThisList = list.items?.some((i) => i.productId === product.id);
                    return (
                      <DropdownMenuItem
                        key={list.id}
                        className="cursor-pointer flex items-center gap-2"
                        onClick={(e) => {
                          if (isProductInThisList) {
                            handleRemoveFromList(list.id, list.name, e);
                          } else {
                            handleAddToList(list.id, list.name, e);
                          }
                        }}
                      >
                        {isProductInThisList ? (
                          <Check className="h-4 w-4 text-[var(--wishlist-active)]" />
                        ) : (
                          <Bookmark className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={cn(isProductInThisList && 'font-medium')}>{list.name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'absolute top-2 right-2 h-9 w-9 rounded-full transition-all duration-200 z-20',
                  wishlisted
                    ? 'opacity-100 bg-[var(--wishlist-active)] text-white hover:opacity-90'
                    : 'opacity-0 group-hover:opacity-100 bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-[var(--wishlist-active)] shadow-md border border-border/50'
                )}
                onClick={handleQuickToggleDefault}
              >
                <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
              </Button>
            )
          )}

          {/* Quick Add Button - Only show in grid view (list view has its own button) */}
          {viewMode === 'grid' && !isOutOfStock && (
            <motion.div
              initial={false}
              className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Button
                size="sm"
                className="w-full btn-tenant-primary shadow-lg"
                onClick={(e) => {
                  e.preventDefault();
                  const shippingData = getProductShippingData(product);
                  addToCart({
                    productId: product.id,
                    name: product.name,
                    price,
                    quantity: 1,
                    image: images[0],
                    ...shippingData,
                  });
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                <TranslatedUIText text="Add to Cart" />
              </Button>
            </motion.div>
          )}
        </div>
      </Link>

      <div className={cn('p-4', viewMode === 'list' && 'flex-1 flex flex-col')}>
        {/* Rating */}
        {productConfig.showRatings && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3.5 w-3.5',
                    i < Math.round(product.averageRating || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200'
                  )}
                />
              ))}
            </div>
            {product.averageRating ? (
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                No reviews yet
              </span>
            )}
          </div>
        )}

        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-tenant-primary/70 uppercase tracking-wider mb-1 font-medium">
            <TranslatedText text={product.brand} context="brand name" />
          </p>
        )}

        {/* Name */}
        <Link
          href={getNavPath(`/products/${product.id}`)}
          className="font-semibold line-clamp-2 hover:text-tenant-primary transition-colors duration-300"
        >
          <TranslatedProductName name={product.name} />
        </Link>

        {/* Description (list view only) */}
        {viewMode === 'list' && product.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
            <TranslatedProductDescription description={product.description} as="span" />
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-3">
          <span className={cn('text-lg font-bold', hasDiscount && 'text-tenant-primary')}>
            {formatDisplayPrice(price)}
          </span>
          {hasDiscount && comparePrice && (
            <span className="text-sm text-muted-foreground line-through decoration-red-400/50">
              {formatDisplayPrice(comparePrice)}
            </span>
          )}
        </div>

        {/* Add to Cart (list view) - compact button, not full width */}
        {viewMode === 'list' && (
          isOutOfStock ? (
            <Button
              size="sm"
              variant="secondary"
              className="mt-4 w-fit cursor-not-allowed opacity-80"
              disabled
            >
              <Ban className="h-4 w-4 mr-2" />
              <TranslatedUIText text="Out of Stock" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="mt-4 w-fit btn-tenant-primary"
              onClick={() =>
                addToCart({
                  productId: product.id,
                  name: product.name,
                  price,
                  quantity: 1,
                  image: images[0],
                  ...getProductShippingData(product),
                })
              }
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              <TranslatedUIText text="Add to Cart" />
            </Button>
          )
        )}
      </div>
    </motion.div>
  );
}
