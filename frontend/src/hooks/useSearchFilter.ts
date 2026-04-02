import { useMemo } from "react";
import { type ProductRecord } from "@/data/site";
import { type FilterOptions } from "@/components/FilterPanel";

export function useSearchFilter(
  products: ProductRecord[],
  searchQuery: string,
  filters: FilterOptions
) {
  return useMemo(() => {
    let filtered = [...products];

    // 1. Search filter - check product name, category, and subcategory
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) => {
        const name = product.name.toLowerCase();
        const nameTe = product.name_te?.toLowerCase() || "";
        const category = product.category.toLowerCase();
        const subcategory = product.subcategory?.toLowerCase() || "";

        return (
          name.includes(query) ||
          nameTe.includes(query) ||
          category.includes(query) ||
          subcategory.includes(query)
        );
      });
    }

    // 2. Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((product) =>
        filters.categories.includes(product.category)
      );
    }

    // 3. Price filter
    filtered = filtered.filter((product) => {
      // Assuming price_per_kg is the base price, calculate average 250g price
      const avgPrice = (product.price_per_kg * 250) / 1000;
      return (
        avgPrice >= filters.priceRange[0] && avgPrice <= filters.priceRange[1]
      );
    });

    // 4. Sorting
    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => {
          const priceA = (a.price_per_kg * 250) / 1000;
          const priceB = (b.price_per_kg * 250) / 1000;
          return priceA - priceB;
        });
        break;
      case "price-high":
        filtered.sort((a, b) => {
          const priceA = (a.price_per_kg * 250) / 1000;
          const priceB = (b.price_per_kg * 250) / 1000;
          return priceB - priceA;
        });
        break;
      case "popularity":
        // Sort by isBestSeller first, then by id
        filtered.sort((a, b) => {
          if (a.isBestSeller === b.isBestSeller) {
            return 0;
          }
          return a.isBestSeller ? -1 : 1;
        });
        break;
      case "newest":
      default:
        // Keep original order (by id)
        filtered.sort((a, b) => {
          const idA = typeof a.id === "string" ? parseInt(a.id, 10) : (a.id as any);
          const idB = typeof b.id === "string" ? parseInt(b.id, 10) : (b.id as any);
          return idA - idB;
        });
        break;
    }

    return filtered;
  }, [products, searchQuery, filters]);
}

// Helper to get product count by category
export function getCategoryCount(
  products: ProductRecord[],
  category: string
): number {
  return products.filter((p) => p.category === category).length;
}

// Helper to check if filters are active
export function hasActiveFilters(filters: FilterOptions): boolean {
  return (
    filters.categories.length > 0 ||
    filters.priceRange[1] !== Infinity ||
    filters.sortBy !== "newest"
  );
}
