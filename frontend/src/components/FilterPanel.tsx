import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Filter, DollarSign, Zap } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { content } from "@/content/translations";
import { type ProductCategory } from "@/data/site";

export type FilterOptions = {
  categories: ProductCategory[];
  priceRange: [number, number];
  subcategories: string[];
  sortBy: "newest" | "price-low" | "price-high" | "popularity";
};

type FilterPanelProps = {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClose?: () => void;
};

const PRICE_RANGES = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 - ₹1000", min: 500, max: 1000 },
  { label: "₹1000+", min: 1000, max: Infinity },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "popularity", label: "Most Popular" },
] as const;

export function FilterPanel({ filters, onFiltersChange, onClose }: FilterPanelProps) {
  const { language } = useLanguage();
  const t = content[language];

  const handleCategoryChange = (category: ProductCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handlePriceChange = (min: number, max: number) => {
    onFiltersChange({ ...filters, priceRange: [min, max] });
  };

  const handleSortChange = (sort: "newest" | "price-low" | "price-high" | "popularity") => {
    onFiltersChange({ ...filters, sortBy: sort });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      categories: [],
      priceRange: [0, Infinity],
      subcategories: [],
      sortBy: "newest",
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 || filters.priceRange[1] !== Infinity || filters.sortBy !== "newest";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl bg-gradient-to-r from-white via-[#f8fbf8] to-white border border-[#dce8dc] shadow-md overflow-hidden"
    >
      {/* Top Bar: Header + Clear Button */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#dce8dc]/50 bg-gradient-to-r from-[#f8fbf8] to-white">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-south-green" />
          <h3 className="text-base font-bold text-theme-heading">Filters</h3>
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearFilters}
              className="text-xs font-bold text-south-green hover:text-south-green/80 px-3 py-1.5 rounded-full hover:bg-south-green/5 transition-all"
            >
              ✕ Reset
            </motion.button>
          )}
          {onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={onClose}
              className="p-1 hover:bg-[#f2f7f2] rounded-lg transition-colors lg:hidden"
            >
              <X className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Filters Container - Horizontal Scrollable */}
      <div className="flex flex-col gap-3 px-6 py-5 overflow-x-auto">
        
        {/* Category Filters */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-1 rounded-full bg-south-green" />
            <span className="text-xs font-bold uppercase tracking-wider text-theme-body/60">Categories</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {(["pickles", "powders", "fryums"] as const).map((category) => {
              const isSelected = filters.categories.includes(category);
              const categoryLabel = t.categories[category].label;
              
              return (
                <motion.button
                  key={category}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
                    isSelected
                      ? "border-south-green bg-south-green text-white shadow-[0_4px_12px_rgba(26,92,42,0.2)]"
                      : "border-[#cde3ce] bg-white text-theme-heading hover:border-south-green hover:text-south-green"
                  }`}
                >
                  {categoryLabel}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Price Filter */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-1 rounded-full bg-south-yellow" />
            <span className="text-xs font-bold uppercase tracking-wider text-theme-body/60">Price</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {PRICE_RANGES.map((range) => {
              const isSelected =
                filters.priceRange[0] === range.min && filters.priceRange[1] === range.max;
              
              return (
                <motion.button
                  key={range.label}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePriceChange(range.min, range.max)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
                    isSelected
                      ? "border-south-yellow bg-south-yellow/20 text-south-yellow font-extrabold shadow-[0_4px_12px_rgba(252,179,66,0.25)]"
                      : "border-[#f5e5b8] bg-white text-theme-heading hover:border-south-yellow hover:text-south-yellow"
                  }`}
                >
                  <DollarSign className="h-4 w-4 inline mr-1.5" />
                  {range.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-1 rounded-full bg-south-orange" />
            <span className="text-xs font-bold uppercase tracking-wider text-theme-body/60">Sort</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {SORT_OPTIONS.map((option) => {
              const isSelected = filters.sortBy === option.value;
              
              return (
                <motion.button
                  key={option.value}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSortChange(option.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
                    isSelected
                      ? "border-south-orange bg-south-orange/20 text-south-orange font-extrabold shadow-[0_4px_12px_rgba(255,152,0,0.25)]"
                      : "border-[#f5d8b5] bg-white text-theme-heading hover:border-south-orange hover:text-south-orange"
                  }`}
                >
                  <Zap className="h-4 w-4 inline mr-1.5" />
                  {option.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Note: FilterSection component removed in favor of modern horizontal pill-based layout
