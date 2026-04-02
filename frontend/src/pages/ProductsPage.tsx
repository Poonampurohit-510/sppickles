import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Filter } from "lucide-react";
import PrimaryButton from "@/components/PrimaryButton";
import ProductCard from "@/components/ProductCard";
import Seo from "@/components/Seo";
import SkeletonCard from "@/components/SkeletonCard";
import { FilterPanel, type FilterOptions } from "@/components/FilterPanel";
import { useStore } from "@/components/StoreProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { content } from "@/content/translations";
import { type StoreFilter } from "@/data/site";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { useStockQuery, getDbProductId } from "@/lib/api";

type ProductsPageProps = {
  initialFilter?: StoreFilter;
};

const pageWrap = "w-full px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 max-w-[1920px] mx-auto";

const filterRoutes: Record<StoreFilter, string> = {
  all: "/products",
  pickles: "/products/pickles",
  "salted-pickles": "/products/pickles/salted",
  "tempered-pickles": "/products/pickles/tempered",
  powders: "/products/podulu",
  fryums: "/products/fryums",
};

/* ── Reusable stat card ── */
const StatCard = ({
  label,
  value,
  variant = "neutral",
}: {
  label: string;
  value: number | string;
  variant?: "gold" | "neutral";
}) => (
  <div
    className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-[0_8px_24px_rgba(30,79,46,0.08)] ${
      variant === "gold"
        ? "border-[#e4dac0]/60 bg-white/60"
        : "border-[#d8e5d8]/60 bg-white/60"
    }`}
  >
    {/* Ambient glow on hover */}
    <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 rounded-full bg-[#f6c443]/10 blur-xl transition-all duration-500 group-hover:bg-[#f6c443]/20" />
    <p
      className={`text-[10px] font-black uppercase tracking-[0.2em] ${
        variant === "gold" ? "text-[#896318]" : "text-theme-body/60"
      }`}
    >
      {label}
    </p>
    <p className="mt-2 text-[2rem] font-extrabold leading-none tracking-tight text-theme-heading tabular-nums">
      {value}
    </p>
  </div>
);

const ProductsPage = ({ initialFilter = "all" }: ProductsPageProps) => {
  const navigate = useNavigate();
  const { products, isProductsLoading, productsError } = useStore();
  const { data: stockData = new Map() } = useStockQuery();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const t = content[language];
  const isTe = language === "te";

  const pageCopy = useMemo(
    () => ({
      stockErrorTitle: isTe ? "స్టాక్ సేవ అందుబాటులో లేదు" : "Stock service unavailable",
      collectionTag: isTe ? "ప్రీమియం కలెక్షన్" : "Premium Collection",
      totalItems: isTe ? "మొత్తం ఐటమ్స్" : "Total Items",
      bestSellers: isTe ? "బెస్ట్ సెల్లర్స్" : "Best Sellers",
      inStock: isTe ? "స్టాక్‌లో" : "In Stock",
      featuredPick: isTe ? "ఫీచర్డ్ ఎంపిక" : "Featured Pick",
      visualsLoading: isTe ? "ఉత్పత్తుల చిత్రాలు లోడ్ అవుతున్నాయి..." : "Product visuals are loading...",
      processEyebrow: isTe ? "తయారీ మరియు సపోర్ట్" : "Preparation and Support",
      processTitle: isTe ? "ప్రతి విభాగాన్ని ఎలా తింటారు" : "How to Enjoy Each Category",
      processParagraphs: isTe
        ? [
            "ఉప్పు పచ్చళ్ళు వేడి అన్నం, నెయ్యి అన్నం, పెరుగు అన్నంతో చాలా బాగా సరిపోతాయి. ఇంగువ తాలింపు పచ్చళ్ళు ముద్దపప్పు-అన్నం వంటి మధ్యాహ్న భోజనంతో అద్భుతంగా రుచిస్తాయి.",
            "పొడులు వేడి అన్నం-నెయ్యితో తక్షణ భోజనానికి అనువైనవి. అప్పడాలు, వడియాలు రోజువారీ భోజనం మరియు పండుగ విందుకు క్రంచ్‌ను ఇస్తాయి.",
          ]
        : [
            "Salted pickles pair beautifully with hot rice, ghee rice, and curd rice. Hing-tempered pickles taste excellent with mudda pappu and plain rice for lunch.",
            "Podulu are ideal for quick meals with hot rice and ghee. Appadalu and vadiyalu add a traditional crunch to daily meals and festive spreads.",
          ],
      processList: isTe
        ? [
            "ఉప్పు పచ్చళ్ళు: రోజువారీ వాడకానికి తగిన సహజ ఉప్పు రుచి.",
            "ఇంగువ తాలింపు: ఇంగువ వాసనతో ఘనమైన మధ్యాహ్న భోజన రుచి.",
            "పొడులు: సాధారణ ఇంటి ఆహారానికి సులభమైన ప్రోటీన్-రిచ్ సహాయం.",
            "అప్పడాలు, వడియాలు: శుద్ధ శాకాహార ప్లేట్‌కి సంప్రదాయ క్రంచ్ జోడింపు.",
          ]
        : [
            "Salted pickles: naturally balanced salty profile suited for everyday meals.",
            "Hing tempering: aromatic asafoetida-led profile for richer lunch combinations.",
            "Podulu: a simple protein-rich side support for regular home food.",
            "Appadalu and vadiyalu: classic vegetarian crunch that completes the plate.",
          ],
    }),
    [isTe],
  );

  const [selectedFilter, setSelectedFilter] = useState<StoreFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    priceRange: [0, Infinity],
    subcategories: [],
    sortBy: "newest",
  });
  const [heroIndex, setHeroIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setSelectedFilter(initialFilter); }, [initialFilter]);

  useEffect(() => {
    if (!productsError) return;
    toast({ title: pageCopy.stockErrorTitle, description: productsError.message, variant: "destructive" });
  }, [pageCopy.stockErrorTitle, productsError, toast]);

  const productCounts = useMemo(
    () =>
      products.reduce(
        (counts, product) => {
          counts.all += 1;
          if (product.category === "pickles") {
            counts.pickles += 1;
            if (product.subcategory === "salt") counts["salted-pickles"] += 1;
            if (product.subcategory === "asafoetida") counts["tempered-pickles"] += 1;
          }
          if (product.category === "powders") counts.powders += 1;
          if (product.category === "fryums") counts.fryums += 1;
          return counts;
        },
        { all: 0, pickles: 0, "salted-pickles": 0, "tempered-pickles": 0, powders: 0, fryums: 0 } satisfies Record<StoreFilter, number>,
      ),
    [products],
  );

  // Get visible products based on category filter first
  const categoryFilteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (selectedFilter === "all") return true;
        if (selectedFilter === "pickles") return product.category === "pickles";
        if (selectedFilter === "salted-pickles") return product.category === "pickles" && product.subcategory === "salt";
        if (selectedFilter === "tempered-pickles") return product.category === "pickles" && product.subcategory === "asafoetida";
        return product.category === selectedFilter;
      }),
    [products, selectedFilter],
  );

  // Apply search and filter to category-filtered products
  const visibleProducts = useSearchFilter(categoryFilteredProducts, searchQuery, filters);

  const tabs: Array<{ key: StoreFilter; label: string; count: number }> = [
    { key: "all", label: t.products.allProducts, count: productCounts.all },
    { key: "pickles", label: t.products.pickles, count: productCounts.pickles },
    { key: "salted-pickles", label: t.products.saltedPickles, count: productCounts["salted-pickles"] },
    { key: "tempered-pickles", label: t.products.temperedPickles, count: productCounts["tempered-pickles"] },
    { key: "powders", label: t.products.powders, count: productCounts.powders },
    { key: "fryums", label: t.products.fryums, count: productCounts.fryums },
  ];

  const filterMeta: Record<StoreFilter, { title: string; description: string }> = {
    all: {
      title: t.products.allProducts,
      description: isTe
        ? "పచ్చళ్ళు, పొడులు, ఫ్రైయమ్స్ అన్నీ ఒకే చోట చూడడానికి ఈ పూర్తి కాటలాగ్."
        : "The full catalogue for browsing pickles, podulu, and fryums in one place.",
    },
    pickles: {
      title: t.products.pickles,
      description: isTe
        ? "ఉప్పు మరియు తాలింపు పచ్చళ్ళన్నీ ఒకే చోట ఇక్కడ కనిపిస్తాయి."
        : "See every pickle variety together, including both salted and tempered ranges.",
    },
    "salted-pickles": {
      title: t.products.saltedPickles,
      description: isTe
        ? "సాధారణ భోజనాలకు సరిపోయే ఉప్పు పచ్చళ్ళు మాత్రమే ఇక్కడ చూపబడతాయి."
        : "Only the salted pickle range is shown here for customers who want that exact style.",
    },
    "tempered-pickles": {
      title: t.products.temperedPickles,
      description: isTe
        ? "తాలింపు, మసాలా రుచులు ఎక్కువగా ఉండే పచ్చళ్ళు ఇక్కడ చూపబడతాయి."
        : "This view focuses on the tempered pickle range with deeper masala-led flavour.",
    },
    powders: {
      title: t.products.powders,
      description: isTe
        ? "అన్నం, ఇడ్లీ, దోశల కోసం సిద్ధం చేసే పొడులన్నీ ఇక్కడ ఉన్నాయి."
        : "Browse every podulu item for hot rice, tiffins, and everyday Andhra meals.",
    },
    fryums: {
      title: t.products.fryums,
      description: isTe
        ? "వడియాలు, అప్పడాలు మరియు ఫ్రైయమ్స్ ఈ విభాగంలో కనిపిస్తాయి."
        : "Find all fryums, vadiyalu, and crunchy side-dish favourites in one section.",
    },
  };

  const heroGallery = useMemo(() => {
    const source = visibleProducts.length > 0 ? visibleProducts : products;
    return source.slice(0, 3);
  }, [products, visibleProducts]);

  useEffect(() => {
    if (heroGallery.length <= 1) { setHeroIndex(0); return; }
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroGallery.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [heroGallery]);

  const activeHeroProduct = heroGallery[heroIndex] ?? heroGallery[0] ?? null;

  const bestSellerCount = useMemo(() => products.filter((p) => p.isBestSeller).length, [products]);
  const inStockCount = useMemo(() => products.filter((p) => p.isAvailable !== false).length, [products]);

  const handleSelectFilter = (filter: StoreFilter) => {
    setSelectedFilter(filter);
    navigate(filterRoutes[filter]);
    window.requestAnimationFrame(() => {
      const gridNode = gridRef.current;
      if (!gridNode) return;
      const targetTop = gridNode.getBoundingClientRect().top + window.scrollY - 138;
      if (window.scrollY < targetTop - 24) window.scrollTo({ top: targetTop, behavior: "smooth" });
    });
  };

  return (
    <main className="bg-[linear-gradient(180deg,#f7f5f1_0%,#f9fbf8_32%,#f5f8f5_100%)]">
      <Seo
        title="SP Traditional Pickles | Products"
        description="Browse pickles, podulu, and fryums from SP Traditional Pickles."
      />

      {/* ══════════════════════════════════
          HERO SECTION
      ══════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[#d8e5d8]/50 bg-[radial-gradient(circle_at_12%_20%,rgba(247,220,147,0.22)_0%,rgba(247,220,147,0)_44%),radial-gradient(circle_at_90%_16%,rgba(32,117,67,0.1)_0%,rgba(32,117,67,0)_45%),linear-gradient(180deg,#fffcf4,#f8fcf8)]">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#f0d288]/18 blur-[90px]" />
        <div className="pointer-events-none absolute -right-16 top-20 h-64 w-64 rounded-full bg-[#2e7f4c]/8 blur-[90px]" />

        <div className={`${pageWrap} relative pb-0 pt-10 md:pt-14`}>
          <div className="grid gap-10 pb-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:pb-14">

            {/* ── Left: copy + stats ── */}
            <div className="space-y-8">
              <div className="space-y-4">
                {/* Gold eyebrow badge */}
                <span className="inline-flex items-center rounded-full border border-[#ebd590]/50 bg-[#fff7df]/80 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#8b6511] shadow-sm backdrop-blur-md">
                  {pageCopy.collectionTag}
                </span>

                {/* Animated title transition when filter changes */}
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={selectedFilter + "-title"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`text-balance font-heading text-4xl font-extrabold tracking-[-0.02em] text-theme-heading md:text-5xl xl:text-[3.4rem] xl:leading-[1.06] ${
                      isTe ? "font-telugu leading-[1.25]" : "leading-tight"
                    }`}
                  >
                    {filterMeta[selectedFilter].title}
                  </motion.h1>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={selectedFilter + "-desc"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    className={`max-w-xl text-lg leading-relaxed text-theme-body/80 md:text-[1.1rem] ${isTe ? "font-telugu" : ""}`}
                  >
                    {filterMeta[selectedFilter].description}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <StatCard label={pageCopy.totalItems} value={productCounts.all} variant="gold" />
                <StatCard label={pageCopy.bestSellers} value={bestSellerCount} />
                <StatCard label={pageCopy.inStock} value={inStockCount} />
              </div>
            </div>

            {/* ── Right: hero carousel ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto w-full max-w-xl lg:ml-auto lg:max-w-none"
            >
              {/* Decorative floating orbs */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-8 -top-6 z-0 hidden h-24 w-24 rounded-full border border-[#f2db9c]/60 bg-[#fff7de]/60 backdrop-blur-xl sm:block"
              />
              <motion.div
                animate={{ y: [0, 14, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -right-8 z-0 hidden h-28 w-28 rounded-full border border-[#c9e0cf]/60 bg-[#edf8ef]/60 backdrop-blur-xl sm:block"
              />

              {activeHeroProduct ? (
                <div className="relative z-10 overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 p-4 shadow-[0_16px_56px_rgba(25,62,41,0.11)] backdrop-blur-xl sm:p-5">
                  {/* Main hero image */}
                  <div className="relative overflow-hidden rounded-[1.5rem] bg-[#f2f7f2]">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeHeroProduct.id}
                        src={activeHeroProduct.image}
                        alt={isTe ? (activeHeroProduct.name_te ?? activeHeroProduct.name) : activeHeroProduct.name}
                        className="aspect-[16/10] w-full object-cover"
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                        loading="lazy"
                      />
                    </AnimatePresence>

                    {/* Gradient overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                    {/* Product name overlay */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${activeHeroProduct.id}-text`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6"
                      >
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#ffe6ab] drop-shadow-sm">
                          {pageCopy.featuredPick}
                        </p>
                        <p className={`mt-1 text-xl font-bold leading-snug drop-shadow-md sm:text-2xl ${isTe ? "font-telugu" : "font-heading"}`}>
                          {isTe ? (activeHeroProduct.name_te ?? activeHeroProduct.name) : activeHeroProduct.name}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Thumbnail strip — Apple picker style */}
                  <div className="mt-3.5 grid grid-cols-3 gap-2.5">
                    {heroGallery.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setHeroIndex(index)}
                        aria-label={isTe ? `చిత్రం ${index + 1}` : `View image ${index + 1}`}
                        className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-south-green ${
                          heroIndex === index
                            ? "border-[#dfc980] shadow-md scale-[1.02]"
                            : "border-transparent hover:border-[#bdd3c0]"
                        }`}
                      >
                        <img
                          src={product.image}
                          alt={isTe ? (product.name_te ?? product.name) : product.name}
                          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        {/* Selected ring inset */}
                        <div className={`absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 transition-opacity duration-300 ${heroIndex === index ? "opacity-100" : "opacity-0"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[2rem] border border-[#d8e5d8]/60 bg-white/80 p-12 text-center text-sm font-medium text-theme-body shadow-sm backdrop-blur-md">
                  {pageCopy.visualsLoading}
                </div>
              )}

              {/* Pagination dots — pill style */}
              <div className="mt-5 flex justify-center gap-2">
                {heroGallery.map((product, index) => (
                  <button
                    key={`${product.id}-dot`}
                    type="button"
                    onClick={() => setHeroIndex(index)}
                    aria-label={isTe ? `స్లైడ్ ${index + 1}` : `Slide ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-south-green ${
                      heroIndex === index ? "w-7 bg-south-green" : "w-1.5 bg-[#c0d6c5] hover:bg-[#9eb9a5]"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Filter tabs — horizontally scrollable, pill style ── */}
          <div className="rounded-t-[1.75rem] border border-b-0 border-[#d9e6d9]/60 bg-white/65 px-2.5 pt-2.5 shadow-[0_-4px_20px_rgba(30,79,46,0.03)] backdrop-blur-xl sm:px-3 sm:pt-3">
            <div className="flex gap-1.5 overflow-x-auto pb-2.5 sm:gap-2 sm:pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleSelectFilter(tab.key)}
                  className={`group relative shrink-0 whitespace-nowrap rounded-[1.25rem] border px-4 py-2.5 text-[0.8rem] font-bold transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-south-green ${
                    selectedFilter === tab.key
                      ? "border-[#ddc67c] bg-gradient-to-br from-[#fff3c9] to-[#f8e8b0] text-[#5c430a] shadow-sm"
                      : "border-transparent text-theme-body/75 hover:bg-[#f4faf5] hover:text-theme-heading"
                  } ${isTe ? "font-telugu" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                    {/* Count badge */}
                    <span
                      className={`inline-flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full px-1.5 text-[9px] font-black transition-colors duration-200 ${
                        selectedFilter === tab.key
                          ? "bg-white/75 text-[#5c430a]"
                          : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          PRODUCT GRID
      ══════════════════════════════════ */}
      <section className={`${pageWrap} py-10 md:py-16`}>
        {isProductsLoading ? (
          /* Skeleton state */
          <div
            ref={gridRef}
            className={`grid gap-5 ${
              isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4 lg:gap-6"
            }`}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : visibleProducts.length > 0 ? (
          <div ref={gridRef} className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
              {/* Search Bar - takes full width on mobile, 1fr on desktop */}
              <div className="flex-1">
                <SearchBarWithState 
                  onSearchChange={setSearchQuery}
                  placeholder={isTe ? "పచ్చళ్ళు, పరిమాణం వెతకండి..." : "Search pickles, size..."}
                />
              </div>

              {/* Filter Button - mobile only */}
              {isMobile && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 rounded-xl bg-south-green text-white px-4 py-3 font-semibold self-end"
                >
                  <Filter className="h-5 w-5" />
                  {isTe ? "ఫిల్టర్‌లు" : "Filters"}
                </motion.button>
              )}
            </div>

            {/* Filters Panel - desktop: always visible; mobile: toggle */}
            {showFilters && (
              <FilterPanel 
                filters={filters}
                onFiltersChange={setFilters}
                onClose={isMobile ? () => setShowFilters(false) : undefined}
              />
            )}

            {/* Toolbar bar — product count + live indicator */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#d8e5d8]/60 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.8rem] font-black uppercase tracking-[0.18em] text-theme-heading">
                  {isTe ? `${visibleProducts.length} ఉత్పత్తులు చూపిస్తున్నాం` : `Showing ${visibleProducts.length} products`}
                </p>
                <p className={`mt-0.5 text-xs text-theme-body/60 ${isTe ? "font-telugu" : ""}`}>
                  {isTe
                    ? "స్టాక్‌లో లేని ఉత్పత్తులూ కూడా కనిపిస్తాయి."
                    : "Out-of-stock products stay visible so you can see the full range."}
                </p>
              </div>

              {/* Live stock pill */}
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#d8e5d8]/80 bg-zinc-50 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-theme-body shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {t.products.liveStock}
              </span>
            </div>

            {/* Grid */}
            <div
              className={`grid gap-5 ${
                isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4 lg:gap-6"
              }`}
            >
              {visibleProducts.map((product, index) => {
                const dbProductId = getDbProductId(product.id, product.name);
                const isAvailable = stockData.get(dbProductId) ?? true;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    isAvailable={isAvailable}
                    compact={!isMobile}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div
            ref={gridRef}
            className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-[#d8e5d8]/60 bg-white/80 px-8 py-20 text-center shadow-[0_8px_32px_rgba(30,79,46,0.05)] backdrop-blur-sm"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f4faf5] text-2xl shadow-sm">
              📦
            </div>
            <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-theme-heading">
              {t.products.noProductsTitle}
            </p>
            <p className={`mx-auto mt-3 max-w-lg text-base leading-relaxed text-theme-body/75 ${isTe ? "font-telugu" : ""}`}>
              {t.products.noProductsDescription}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleSelectFilter("all")}
                className="inline-flex items-center justify-center rounded-xl border border-[#d8e5d8] bg-white px-7 py-3 text-sm font-bold text-theme-heading shadow-sm transition-all duration-200 hover:border-[#e2b93b] hover:bg-[#fff9e6] hover:shadow-md active:scale-[0.97]"
              >
                {t.products.allProducts}
              </button>
              <PrimaryButton to="/" className="w-full sm:w-auto rounded-xl px-7 py-3 font-bold shadow-sm">
                {isTe ? "హోమ్‌కు తిరుగు" : "Back to Home"}
              </PrimaryButton>
              <PrimaryButton
                to="/contact"
                variant="secondary"
                className="w-full sm:w-auto rounded-xl border-2 border-zinc-200 bg-transparent px-7 py-3 font-bold text-zinc-700 shadow-none hover:border-zinc-300 hover:bg-zinc-50"
              >
                {isTe ? "సంప్రదించండి" : "Contact Us"}
              </PrimaryButton>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════
          PROCESS / HOW TO ENJOY
      ══════════════════════════════════ */}
      <section className="border-t border-[#d8e5d8]/40 bg-gradient-to-b from-[#fffaee] to-[#faf8f3]">
        <div className={`${pageWrap} grid gap-14 py-16 md:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20`}>

          {/* Left copy */}
          <div className="max-w-xl space-y-6">
            <span className="inline-flex items-center rounded-full bg-[#fff0c4]/80 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#8d6611] backdrop-blur-md shadow-sm">
              {pageCopy.processEyebrow}
            </span>
            <h2 className={`font-heading text-4xl font-bold tracking-[-0.02em] text-theme-heading md:text-5xl ${isTe ? "font-telugu leading-[1.24]" : "leading-tight"}`}>
              {pageCopy.processTitle}
            </h2>
            <div className="space-y-5">
              {pageCopy.processParagraphs.map((paragraph) => (
                <p key={paragraph} className={`text-[1.05rem] leading-relaxed text-theme-body/80 ${isTe ? "font-telugu" : ""}`}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Right: numbered cards */}
          <div className="space-y-3.5">
            {pageCopy.processList.map((item, index) => (
              <div
                key={item}
                className="group flex items-start gap-4 rounded-2xl border border-[#e5dcc2]/50 bg-white/70 p-5 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_32px_rgba(48,44,33,0.07)]"
              >
                {/* Number badge */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#e0ca8b]/50 bg-gradient-to-br from-[#fff2c9] to-[#ffe8a1] text-sm font-black text-[#8d6611] shadow-sm transition-transform duration-300 group-hover:scale-105">
                  {index + 1}
                </div>
                <p className={`pt-1.5 text-[0.9rem] font-medium leading-relaxed text-theme-heading ${isTe ? "font-telugu" : ""}`}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

// Simple wrapper for search bar with state management
function SearchBarWithState({ 
  onSearchChange, 
  placeholder 
}: { 
  onSearchChange: (query: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearchChange(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearchChange("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative flex items-center gap-3 rounded-2xl px-4 py-3 bg-white border-2 border-south-green/20 hover:border-south-green/50 transition-all duration-300 focus-within:border-south-green focus-within:shadow-[0_8px_32px_rgba(30,79,46,0.15)]"
    >
      <svg className="h-5 w-5 text-south-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder || "Search products..."}
        className="flex-1 border-0 bg-transparent outline-none text-theme-heading placeholder:text-theme-body/40 font-medium"
      />

      {query && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          type="button"
          onClick={handleClear}
          className="p-1 hover:bg-[#f2f7f2] rounded-lg transition-colors"
          aria-label="Clear search"
        >
          <svg className="h-5 w-5 text-theme-body/60 hover:text-south-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </motion.button>
      )}
    </motion.div>
  );
}

export default ProductsPage;
