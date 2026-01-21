'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
  DollarSign,
  Package,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';

export interface SearchFiltersState {
  priceRange: [number, number];
  inStockOnly: boolean;
  onSaleOnly: boolean;
  categories: string[];
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
  availableCategories?: string[];
  priceMin?: number;
  priceMax?: number;
  resultCount?: number;
}

const DEFAULT_PRICE_MAX = 1000;

export function SearchFilters({
  filters,
  onFiltersChange,
  availableCategories = [],
  priceMin = 0,
  priceMax = DEFAULT_PRICE_MAX,
  resultCount,
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Count active filters
  const activeFilterCount = [
    filters.priceRange[0] > priceMin || filters.priceRange[1] < priceMax,
    filters.inStockOnly,
    filters.onSaleOnly,
    filters.categories.length > 0,
  ].filter(Boolean).length;

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: SearchFiltersState = {
      priceRange: [priceMin, priceMax],
      inStockOnly: false,
      onSaleOnly: false,
      categories: [],
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const removeFilter = (type: 'price' | 'stock' | 'sale' | 'category', value?: string) => {
    const newFilters = { ...filters };
    switch (type) {
      case 'price':
        newFilters.priceRange = [priceMin, priceMax];
        break;
      case 'stock':
        newFilters.inStockOnly = false;
        break;
      case 'sale':
        newFilters.onSaleOnly = false;
        break;
      case 'category':
        newFilters.categories = newFilters.categories.filter((c) => c !== value);
        break;
    }
    onFiltersChange(newFilters);
    setLocalFilters(newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Filter Button + Active Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <TranslatedUIText text="Filters" />
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-[320px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                <TranslatedUIText text="Filters" />
              </SheetTitle>
            </SheetHeader>

            <div className="py-6 space-y-6">
              {/* Price Range */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <TranslatedUIText text="Price Range" />
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <Slider
                    value={localFilters.priceRange}
                    onValueChange={(value) =>
                      setLocalFilters({ ...localFilters, priceRange: value as [number, number] })
                    }
                    min={priceMin}
                    max={priceMax}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="px-2 py-1 bg-muted rounded">
                      ${localFilters.priceRange[0]}
                    </span>
                    <span className="text-muted-foreground">to</span>
                    <span className="px-2 py-1 bg-muted rounded">
                      ${localFilters.priceRange[1]}
                    </span>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Availability */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <TranslatedUIText text="Availability" />
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={localFilters.inStockOnly}
                      onCheckedChange={(checked) =>
                        setLocalFilters({ ...localFilters, inStockOnly: checked === true })
                      }
                    />
                    <span className="text-sm"><TranslatedUIText text="In Stock Only" /></span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={localFilters.onSaleOnly}
                      onCheckedChange={(checked) =>
                        setLocalFilters({ ...localFilters, onSaleOnly: checked === true })
                      }
                    />
                    <span className="text-sm"><TranslatedUIText text="On Sale" /></span>
                  </label>
                </CollapsibleContent>
              </Collapsible>

              {/* Categories */}
              {availableCategories.length > 0 && (
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <TranslatedUIText text="Categories" />
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-2 max-h-48 overflow-y-auto">
                    {availableCategories.map((category) => (
                      <label key={category} className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={localFilters.categories.includes(category)}
                          onCheckedChange={(checked) => {
                            const newCategories = checked
                              ? [...localFilters.categories, category]
                              : localFilters.categories.filter((c) => c !== category);
                            setLocalFilters({ ...localFilters, categories: newCategories });
                          }}
                        />
                        <span className="text-sm">{category}</span>
                      </label>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>

            <SheetFooter className="flex-row gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <TranslatedUIText text="Reset" />
              </Button>
              <Button onClick={handleApply} className="flex-1 btn-tenant-primary">
                <TranslatedUIText text="Apply Filters" />
                {resultCount !== undefined && (
                  <span className="ml-1">({resultCount})</span>
                )}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Active Filter Chips */}
        <AnimatePresence>
          {filters.priceRange[0] > priceMin || filters.priceRange[1] < priceMax ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/10"
                onClick={() => removeFilter('price')}
              >
                ${filters.priceRange[0]} - ${filters.priceRange[1]}
                <X className="h-3 w-3" />
              </Badge>
            </motion.div>
          ) : null}

          {filters.inStockOnly && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/10"
                onClick={() => removeFilter('stock')}
              >
                <TranslatedUIText text="In Stock" />
                <X className="h-3 w-3" />
              </Badge>
            </motion.div>
          )}

          {filters.onSaleOnly && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/10"
                onClick={() => removeFilter('sale')}
              >
                <TranslatedUIText text="On Sale" />
                <X className="h-3 w-3" />
              </Badge>
            </motion.div>
          )}

          {filters.categories.map((category) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/10"
                onClick={() => removeFilter('category', category)}
              >
                {category}
                <X className="h-3 w-3" />
              </Badge>
            </motion.div>
          ))}

          {activeFilterCount > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <TranslatedUIText text="Clear all" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default SearchFilters;
