"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { AdminUIText } from "@/components/translation/AdminTranslatedText";

// Navigation item type (must match layout.tsx)
interface NavItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  minRole?: string;
  children?: NavItem[];
}

// Flattened search item for menu search
interface FlattenedNavItem {
  name: string;
  href: string;
  path: string[]; // Breadcrumb path like ["Settings", "QR Codes"]
  icon?: React.ComponentType<{ className?: string }>;
  keywords: string[]; // Search keywords including parent names
}

// Flatten navigation items for search - extracts all leaf items with their paths
function flattenNavItems(
  items: NavItem[],
  parentPath: string[] = [],
  parentIcon?: React.ComponentType<{ className?: string }>
): FlattenedNavItem[] {
  const flattened: FlattenedNavItem[] = [];

  for (const item of items) {
    const currentPath = [...parentPath, item.name];
    const itemIcon = item.icon || parentIcon;

    if (item.href) {
      // This is a navigable item
      flattened.push({
        name: item.name,
        href: item.href,
        path: currentPath,
        icon: itemIcon,
        // Keywords include all path segments for fuzzy matching
        keywords: currentPath.map((p) => p.toLowerCase()),
      });
    }

    if (item.children) {
      // Recursively flatten children
      flattened.push(...flattenNavItems(item.children, currentPath, itemIcon));
    }
  }

  return flattened;
}

// Simple fuzzy search scoring - returns score based on match quality
function fuzzyMatch(query: string, item: FlattenedNavItem): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  const name = item.name.toLowerCase();
  const fullPath = item.path.join(" ").toLowerCase();

  // Exact name match gets highest score
  if (name === q) return 100;

  // Name starts with query
  if (name.startsWith(q)) return 90;

  // Name contains query
  if (name.includes(q)) return 80;

  // Full path contains query (e.g., "settings qr" matches "Settings > QR Codes")
  if (fullPath.includes(q)) return 70;

  // Any keyword starts with query
  if (item.keywords.some((k) => k.startsWith(q))) return 60;

  // Any keyword contains query
  if (item.keywords.some((k) => k.includes(q))) return 50;

  // Check for partial word matches (e.g., "prod" matches "Products")
  const queryWords = q.split(/\s+/);
  const matchedWords = queryWords.filter((word) =>
    item.keywords.some((k) => k.includes(word))
  );
  if (matchedWords.length === queryWords.length) return 40;
  if (matchedWords.length > 0)
    return 30 * (matchedWords.length / queryWords.length);

  return 0;
}

// Highlight matching text in result
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className="bg-accent0/30 text-primary/50 rounded px-0.5">
        {text.slice(index, index + lowerQuery.length)}
      </span>
      {text.slice(index + lowerQuery.length)}
    </>
  );
}

interface SidebarMenuSearchProps {
  navigation: NavItem[];
}

export function SidebarMenuSearch({ navigation }: SidebarMenuSearchProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Flatten navigation for search - memoized to avoid recalculation
  const flattenedItems = useMemo(
    () => flattenNavItems(navigation),
    [navigation]
  );

  // Filter and sort search results based on query
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results = flattenedItems
      .map((item) => ({ item, score: fuzzyMatch(query, item) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8) // Limit to 8 results
      .map(({ item }) => item);

    return results;
  }, [query, flattenedItems]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && searchResults.length > 0) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, searchResults.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!searchResults.length) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            const item = searchResults[selectedIndex];
            router.push(item.href);
            setQuery("");
            setIsFocused(false);
            inputRef.current?.blur();
          }
          break;
        case "Escape":
          e.preventDefault();
          setQuery("");
          setIsFocused(false);
          inputRef.current?.blur();
          break;
      }
    },
    [searchResults, selectedIndex, router]
  );

  // Navigate to selected search result
  const handleResultClick = useCallback(
    (item: FlattenedNavItem) => {
      router.push(item.href);
      setQuery("");
      setIsFocused(false);
    },
    [router]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showResults = isFocused && query.trim().length > 0;

  return (
    <div className="p-4 border-b border-slate-700/50">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors z-10"
          style={{ color: "var(--color-sidebar-text, #94a3b8)" }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search menu..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border"
          style={{
            backgroundColor: "var(--color-sidebar-bg, #334155)" + "aa",
            borderColor: isFocused
              ? "var(--color-primary, #3b82f6)"
              : "var(--color-sidebar-text, #475569)" + "60",
            color: "var(--color-sidebar-text, #e2e8f0)",
          }}
        />

        {/* Search Results Dropdown */}
        {showResults && (
          <div
            ref={resultsRef}
            className="absolute left-0 right-0 top-full mt-2 rounded-lg border shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            style={{
              backgroundColor: "var(--color-sidebar-bg, #1e293b)",
              borderColor: "var(--color-sidebar-text, #475569)" + "60",
            }}
          >
            {searchResults.length > 0 ? (
              <div className="max-h-80 overflow-y-auto py-1">
                {searchResults.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={item.href}
                      data-index={index}
                      onClick={() => handleResultClick(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? "var(--color-primary, #3b82f6)" + "20"
                          : "transparent",
                      }}
                    >
                      {Icon && (
                        <span
                          className="flex-shrink-0"
                          style={{
                            color: isSelected
                              ? "var(--color-primary, #60a5fa)"
                              : "var(--color-sidebar-text, #64748b)",
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium truncate"
                          style={{
                            color: isSelected
                              ? "var(--color-sidebar-active-text, #ffffff)"
                              : "var(--color-sidebar-text, #e2e8f0)",
                          }}
                        >
                          {highlightMatch(item.name, query)}
                        </div>
                        {item.path.length > 1 && (
                          <div
                            className="text-xs truncate flex items-center gap-1 mt-0.5"
                            style={{
                              color: "var(--color-sidebar-text, #64748b)",
                            }}
                          >
                            {item.path.slice(0, -1).map((segment, i) => (
                              <span key={i} className="flex items-center gap-1">
                                {i > 0 && (
                                  <ChevronRight className="w-3 h-3 opacity-50" />
                                )}
                                <span>{segment}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <kbd
                          className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded"
                          style={{
                            backgroundColor:
                              "var(--color-sidebar-text, #475569)" + "40",
                            color: "var(--color-sidebar-text, #94a3b8)",
                          }}
                        >
                          Enter
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                className="px-4 py-6 text-center text-sm"
                style={{ color: "var(--color-sidebar-text, #64748b)" }}
              >
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>
                  <AdminUIText text="No menu items found" />
                </p>
                <p className="text-xs mt-1 opacity-70">
                  <AdminUIText text='Try searching for "products", "orders", or "settings"' />
                </p>
              </div>
            )}

            {/* Keyboard hints */}
            {searchResults.length > 0 && (
              <div
                className="px-3 py-2 border-t text-xs flex items-center gap-4"
                style={{
                  borderColor: "var(--color-sidebar-text, #475569)" + "40",
                  color: "var(--color-sidebar-text, #64748b)",
                }}
              >
                <span className="flex items-center gap-1">
                  <kbd
                    className="px-1 rounded"
                    style={{
                      backgroundColor:
                        "var(--color-sidebar-text, #475569)" + "40",
                    }}
                  >
                    ↑↓
                  </kbd>
                  <AdminUIText text="Navigate" />
                </span>
                <span className="flex items-center gap-1">
                  <kbd
                    className="px-1 rounded"
                    style={{
                      backgroundColor:
                        "var(--color-sidebar-text, #475569)" + "40",
                    }}
                  >
                    Enter
                  </kbd>
                  <AdminUIText text="Select" />
                </span>
                <span className="flex items-center gap-1">
                  <kbd
                    className="px-1 rounded"
                    style={{
                      backgroundColor:
                        "var(--color-sidebar-text, #475569)" + "40",
                    }}
                  >
                    Esc
                  </kbd>
                  <AdminUIText text="Close" />
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
