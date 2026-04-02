import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Minus, Plus, ShoppingCart, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type ProductRecord, type WeightOption, weightOptions } from "@/data/site";
import { content, getWeightLabel } from "@/content/translations";
import { calculateWeightPrice, formatCurrency } from "@/lib/pricing";
import { useStore } from "@/components/StoreProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { ProgressiveImage } from "@/components/LazyImage";

type ProductCardProps = {
  product: ProductRecord;
  index?: number;
  isAvailable?: boolean;
  compact?: boolean;
};

const ProductCard = ({ product, index = 0, isAvailable = true, compact = false }: ProductCardProps) => {
  const { toast } = useToast();
  const { addToCart } = useStore();
  const { language } = useLanguage();

  const [weight, setWeight] = useState<WeightOption>("250g");
  const [quantityStr, setQuantityStr] = useState("1");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const quantity = Math.max(1, parseInt(quantityStr, 10) || 1);

  // Mock stock levels (in production, this would come from backend)
  const stockLevels: Record<string, number> = {
    "product-1-chintakaya-thokku": 8,
    "product-2-usiri-thokku": 3,
    "product-3-gongura-salt": 12,
  };
  
  const stockLevel = stockLevels[product.slug || `product-${product.id}`] || 15;
  const isLowStock = stockLevel <= 5 && isAvailable;

  const productCardCopy = content[language].productCard;
  const categoryCopy = content[language].categories[product.category];
  const featuredCopy = content[language].featured;
  const pickleStyleCopy =
    product.category === "pickles" && product.subcategory
      ? content[language].pickleStyles[product.subcategory]
      : null;

  const livePrice = useMemo(
    () => calculateWeightPrice(product.price_per_kg, weight),
    [product.price_per_kg, weight],
  );

  const displayName = language === "te" ? (product.name_te ?? product.name) : product.name;

  const shortTagline =
    product.category === "pickles"
      ? product.subcategory === "salt"
        ? language === "te" ? "ఉప్పు పచ్చళ్ళు" : "Salted Pickles"
        : product.subcategory === "asafoetida"
          ? language === "te" ? "తాలింపు పచ్చళ్ళు" : "Tempered Pickles"
          : language === "te" ? "పచ్చళ్ళు" : "Pickles"
      : categoryCopy.label;

  const handleAddToCart = () => {
    if (!isAvailable) {
      toast({
        title: productCardCopy.outOfStock,
        description: language === "te"
          ? `${displayName} ప్రస్తుతం స్టాక్‌లో లేదు.`
          : `${displayName} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }
    addToCart(product, weight, quantity);
    toast({
      title: productCardCopy.addedToCartTitle,
      description: productCardCopy.addedToCartDescription(
        displayName,
        getWeightLabel(language, weight),
        quantity,
      ),
    });
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) setQuantityStr(val);
  };

  const handleQtyBlur = () => {
    const parsed = parseInt(quantityStr, 10);
    setQuantityStr(String(Math.max(1, isNaN(parsed) ? 1 : parsed)));
  };

  const categoryPillClass =
    product.category === "pickles"
      ? "bg-south-green text-white border-south-green"
      : product.category === "powders"
        ? "bg-south-yellow text-south-dark border-south-yellow"
        : product.category === "fryums"
          ? "bg-south-orange text-white border-south-orange"
          : "bg-white text-theme-body border-[#d8e5d8]";

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 28, delay: Math.min(index * 0.05, 0.2) }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white
        border border-[#dce8dc]
        shadow-[0_2px_12px_rgba(30,79,46,0.06)]
        hover:shadow-[0_16px_48px_rgba(30,79,46,0.13)]
        hover:border-[#b4ccb4]
        transition-[box-shadow,border-color] duration-300 ease-out
        ${!isAvailable ? "opacity-65" : ""}`}
    >
      <div className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-south-green opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-20" />
      <div className="absolute inset-0 banana-leaf-bg opacity-[0.035] pointer-events-none" />

      {/* ── IMAGE ── */}
      <div className="relative overflow-hidden bg-[#f2f7f2]">
        <ProgressiveImage
          src={product.image}
          alt={displayName}
          placeholderSrc={`${product.image}?w=20&blur=20`}
          className="aspect-[4/3.2] w-full object-cover mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        <AnimatePresence>
          {product.isBestSeller && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.1 }}
              className="absolute right-3.5 top-3.5 z-20 flex items-center gap-1.5
                rounded-full border border-[#ffc4c4] bg-[#fff0f0]/95 backdrop-blur-md px-2.5 py-1 shadow-sm
                animate-pulse"
            >
              <motion.span 
                className="relative flex h-1.5 w-1.5 shrink-0"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d01515] opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#d01515]" />
              </motion.span>
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9a1111]">
                {featuredCopy.bestSeller}
              </span>
            </motion.span>
          )}
        </AnimatePresence>

        <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-1.5 z-10">
          {!isAvailable && (
            <span className="flex items-center gap-1 rounded-full bg-south-red/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white shadow-sm">
              <AlertCircle className="h-3 w-3" />
              {productCardCopy.outOfStock}
            </span>
          )}
          {isAvailable && isLowStock && (
            <motion.span 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 rounded-full bg-[#ff9800]/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white shadow-sm"
            >
              <TrendingUp className="h-3 w-3" />
              Only {stockLevel} left
            </motion.span>
          )}
          <span className={`flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] shadow-sm backdrop-blur-md ${categoryPillClass}`}>
            {categoryCopy.label}
          </span>
          {pickleStyleCopy && (
            <span className="flex items-center rounded-full border border-white/70 bg-white/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[#6b5207] shadow-sm">
              {pickleStyleCopy}
            </span>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className={`relative flex flex-1 flex-col z-10 bg-white ${compact ? "p-4 gap-3" : "p-4 gap-3"}`}>

        <div className="space-y-0.5">
          <h3 className={`font-bold text-theme-heading leading-tight tracking-[-0.01em]
            ${compact ? "text-[0.95rem]" : "text-[1.05rem]"}
            ${language === "te" ? "font-telugu leading-relaxed" : "font-heading"}`}>
            {displayName}
          </h3>
          <p className={`text-[10px] font-semibold text-theme-body/50 uppercase tracking-[0.12em] ${language === "te" ? "font-telugu" : ""}`}>
            {shortTagline}
          </p>
        </div>

        {/* ── FULL CARD ── */}
        {!compact ? (
          <div className="mt-auto flex flex-col gap-3">

            {/* Pack size — grid-cols-3 so all 3 pills always visible */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-south-green/85">
                {productCardCopy.weight}
              </p>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f4f9f4] p-1 border border-[#dce8dc]">
                {weightOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setWeight(option.label)}
                    className={`min-w-0 truncate rounded-lg py-2.5 text-[12px] font-bold
                      transition-all duration-200 text-center leading-none
                      ${weight === option.label
                        ? "border border-[#d7b15b] bg-[#fff3c9] !text-[#173d1c] font-extrabold shadow-[0_8px_18px_rgba(201,139,0,0.14)]"
                        : "text-[#1f4125] hover:text-[#1a5c2a] hover:bg-[#eaf3ea]"
                      }`}
                  >
                    <span
                      className={weight === option.label ? "text-[#173d1c]" : "text-[#1f4125]"}
                    >
                      {getWeightLabel(language, option.label)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Total + Qty block */}
            <div className="rounded-xl border border-south-green/20 bg-gradient-to-br from-[#f8fbf8] via-[#f2f7f2] to-[#eaf3ea] overflow-hidden shadow-[inset_0_1px_3px_rgba(30,79,46,0.08)]">

              {/* Total row */}
              <div className="flex items-baseline justify-between px-3 pt-2.5 pb-2 border-b border-south-green/15 bg-gradient-to-r from-transparent to-south-green/5">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-theme-body/50">
                  {language === "te" ? "మొత్తం" : "Total"}
                </p>
                <AnimatePresence mode="popLayout">
                  <motion.p
                    key={`${livePrice}-${quantity}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.16 }}
                    className="price-figure text-[2.1rem] sm:text-[1.75rem] font-extrabold tracking-tight text-south-green leading-none tabular-nums"
                  >
                    {formatCurrency(livePrice * quantity)}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Qty row — minus | editable input | plus */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setQuantityStr(String(Math.max(1, quantity - 1)))}
                  aria-label="Decrease quantity"
                  className="flex h-10 w-12 shrink-0 items-center justify-center text-theme-body/50
                    border-r border-[#dce8dc] transition-colors hover:bg-[#eaf3ea] hover:text-south-green active:scale-90"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>

                {/* Tap to type quantity directly */}
                <input
                  type="number"
                  min="1"
                  value={quantityStr}
                  onChange={handleQtyChange}
                  onBlur={handleQtyBlur}
                  aria-label="Quantity"
                  className="h-10 min-w-0 flex-1 border-0 bg-transparent text-center text-[1rem] font-extrabold
                    text-theme-heading tabular-nums outline-none
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                    focus:bg-[#eaf3ea]/40 transition-colors duration-150 cursor-text"
                />

                <button
                  type="button"
                  onClick={() => setQuantityStr(String(quantity + 1))}
                  aria-label="Increase quantity"
                  className="flex h-10 w-12 shrink-0 items-center justify-center text-theme-body/50
                    border-l border-[#dce8dc] transition-colors hover:bg-[#eaf3ea] hover:text-south-green active:scale-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Add to Cart — deep green, single line */}
            <motion.button
              type="button"
              onClick={handleAddToCart}
              disabled={!isAvailable}
              whileHover={{ scale: isAvailable ? 1.02 : 1 }}
              whileTap={{ scale: isAvailable ? 0.98 : 1 }}
              className={`flex w-full items-center justify-center gap-3 rounded-xl py-3.5 text-[14px] font-bold tracking-wide
                transition-all duration-200
                ${!isAvailable
                  ? "bg-gradient-to-r from-[#c8deca] to-[#bdd5c1] text-white/60 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-[#1a5c2a] to-[#0f3d1c] text-white shadow-[0_6px_20px_rgba(26,92,42,0.25)] hover:from-[#163f1e] hover:to-[#0b2c15] hover:shadow-[0_8px_28px_rgba(26,92,42,0.35)]"
                }`}
            >
              <motion.div
                animate={isAvailable ? { y: [0, -2, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ShoppingCart className="h-5 w-5 shrink-0" />
              </motion.div>
              {isAvailable ? productCardCopy.addToCart : productCardCopy.outOfStock}
            </motion.button>
          </div>
        ) : (
          /* ── COMPACT CARD ── */
          <div className="mt-auto flex flex-col gap-3 pt-3 border-t border-[#dce8dc]">
            <div className="space-y-1.5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-south-green/85">
                {productCardCopy.weight}
              </p>
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#dce8dc] bg-[#f4f9f4] p-1">
                {weightOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setWeight(option.label)}
                    className={`min-w-0 truncate rounded-lg border py-3 text-[12px] font-bold leading-none transition-all duration-200
                      ${weight === option.label
                        ? "scale-[1.03] border-[#d7b15b] bg-[#fff3c9] !text-[#173d1c] shadow-[0_10px_22px_rgba(201,139,0,0.16),0_0_0_2px_rgba(246,196,67,0.16)]"
                        : "border-transparent text-[#1f4125] hover:bg-[#eaf3ea] hover:text-[#1a5c2a] hover:shadow-[0_3px_10px_rgba(26,92,42,0.08)]"
                      }`}
                  >
                    <span
                      className={`${weight === option.label ? "text-[#173d1c]" : "text-[#1f4125]"}`}
                    >
                      {getWeightLabel(language, option.label)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="relative min-w-0 overflow-hidden rounded-xl border border-[#ecd68f] bg-[linear-gradient(135deg,#fffef6_0%,#f4faf3_46%,#fff0c9_100%)] px-3.5 py-3 shadow-[0_12px_26px_rgba(201,139,0,0.12),0_8px_18px_rgba(26,92,42,0.06)]">
                <div className="pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full bg-[#f6c443]/30 blur-2xl" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,rgba(201,139,0,0)_0%,rgba(201,139,0,0.65)_50%,rgba(201,139,0,0)_100%)]" />
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-south-green/80 mb-1">
                  {productCardCopy.price}
                </p>
                <AnimatePresence mode="popLayout">
                  <motion.p
                    key={livePrice}
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 1.02 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="price-figure relative z-10 truncate text-[2.4rem] sm:text-[2.2rem] font-extrabold tracking-tight text-south-red tabular-nums leading-none drop-shadow-[0_4px_14px_rgba(153,27,27,0.12)]"
                  >
                    {formatCurrency(livePrice)}
                  </motion.p>
                </AnimatePresence>
                <p className="relative z-10 mt-1.5 text-[11px] font-semibold text-theme-body/65">
                  {getWeightLabel(language, weight)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isAvailable}
                aria-label={`${productCardCopy.addToCart} ${getWeightLabel(language, weight)}`}
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] border transition-all duration-200
                  ${isAvailable
                    ? "border-[#d7b15b] bg-[linear-gradient(180deg,#216732_0%,#184f25_100%)] text-white shadow-[0_14px_28px_rgba(26,92,42,0.22),0_0_0_3px_rgba(246,196,67,0.12)] hover:-translate-y-0.5 hover:scale-105 hover:bg-[#163f1e] active:scale-95"
                    : "border-[#dce8dc] bg-[#edf5ee] text-theme-body/30 cursor-not-allowed"
                  }`}
              >
                <ShoppingCart className="h-6 w-6" />
                {isAvailable && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/80 bg-[#f6c443] text-[#173d1c] shadow-sm">
                    <Plus className="h-3 w-3" />
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Quick Add Modal Overlay */}
        <AnimatePresence>
          {showQuickAdd && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-[1.75rem]"
              onClick={() => setShowQuickAdd(false)}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 shadow-2xl max-w-[90vw] w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-theme-heading mb-4">{displayName}</h3>
                <p className="text-sm text-theme-body mb-4">{categoryCopy.label}</p>
                
                <div className="space-y-4">
                  {/* Quick weight selector */}
                  <div>
                    <p className="text-xs font-bold uppercase mb-2">Quick Select</p>
                    <div className="grid grid-cols-3 gap-2">
                      {weightOptions.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => setWeight(opt.label)}
                          className={`p-2 rounded-lg text-xs font-bold ${
                            weight === opt.label
                              ? "bg-south-green text-white"
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                        >
                          {getWeightLabel(language, opt.label)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick price display */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 text-center">
                    <p className="text-xs text-theme-body/70">Price</p>
                    <p className="text-2xl font-bold text-south-green">{formatCurrency(livePrice)}</p>
                  </div>

                  {/* Quick add buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleAddToCart();
                        setShowQuickAdd(false);
                      }}
                      className="flex-1 bg-south-green text-white py-2 rounded-lg font-bold"
                    >
                      Add to Cart
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setShowQuickAdd(false)}
                      className="flex-1 bg-gray-200 text-theme-heading py-2 rounded-lg font-bold"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
};

export default ProductCard;
