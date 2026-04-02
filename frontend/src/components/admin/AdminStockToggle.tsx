import { useState } from "react";
import { motion } from "framer-motion";
import { useProductsQuery, getDbProductId } from "@/lib/api";
import { useStockQuery, useUpdateStockMutation } from "@/lib/api";
import { CheckCircle, AlertCircle, Loader2, Package, ToggleLeft, ToggleRight, Eye } from "lucide-react";

export const AdminStockToggle = () => {
  const { data: products = [], isLoading: loadingProducts } = useProductsQuery();
  const { data: stockData = new Map(), isLoading: loadingStock } = useStockQuery();
  const updateStockMutation = useUpdateStockMutation();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggleStock = async (productId: string, currentStatus: boolean) => {
    setUpdating(productId);
    try {
      console.log("Toggling stock for product:", productId, "from", currentStatus, "to", !currentStatus);
      await updateStockMutation.mutateAsync({
        productId,
        isAvailable: !currentStatus,
      });
      console.log("Stock toggle successful for product:", productId);
    } catch (error) {
      console.error("Error updating stock:", error);
    } finally {
      setUpdating(null);
    }
  };

  if (loadingProducts || loadingStock) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-flex items-center gap-3 rounded-full bg-gold/15 px-6 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gold" />
          <span className="font-semibold text-theme-heading">Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-theme-heading flex items-center gap-3">
          <Package className="h-8 w-8 text-gold" />
          Product Stock Status
        </h2>
        <p className="text-theme-body mt-2">
          Manage inventory for all products. Toggle between In Stock and Out of Stock.
        </p>
      </div>

      {/* Stock Grid */}
      <div className="grid gap-4">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gold/30 mx-auto mb-4" />
            <p className="text-theme-body text-lg">No products found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product, index) => {
              const dbProductId = getDbProductId(Number(product.id), product.name);
              const isAvailable = stockData.get(dbProductId) ?? true;
              const isUpdating = updating === dbProductId;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex items-center justify-between gap-4 rounded-2xl border-2 p-6 transition-all ${
                    isAvailable
                      ? "border-green-500 bg-gradient-to-r from-green-500/15 via-green-400/5 to-transparent"
                      : "border-gold bg-gradient-to-r from-gold/15 via-amber-300/5 to-transparent"
                  }`}
                >
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-theme-heading line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-theme-body-soft mt-1">
                          Category: <span className="capitalize text-theme-body">{product.category}</span>
                          {" • "}
                          Price: <span className="font-semibold text-theme-heading">₹{product.price_per_kg}/kg</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge + Toggle */}
                  <div className="flex items-center gap-4">
                    {/* Status Display */}
                    <div className="flex flex-col items-end gap-2">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isUpdating ? 0.95 : 1,
                        }}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black ${
                          isAvailable
                            ? "bg-green-600 text-white border-2 border-green-700"
                            : "bg-gold text-white border-2 border-amber-700"
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                        {isAvailable ? "✓ IN STOCK" : "✗ OUT OF STOCK"}
                      </motion.div>
                    </div>

                    {/* Toggle Button */}
                    <motion.button
                      onClick={() => handleToggleStock(dbProductId, isAvailable)}
                      disabled={isUpdating}
                      whileHover={{ scale: isUpdating ? 1 : 1.05 }}
                      whileTap={{ scale: isUpdating ? 1 : 0.95 }}
                      className={`flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all border-2 ${
                        isAvailable
                          ? "bg-green-600 text-white border-green-700 hover:bg-green-700"
                          : "bg-gold text-white border-amber-700 hover:bg-amber-500"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Updating...</span>
                        </>
                      ) : isAvailable ? (
                        <>
                          <ToggleRight className="h-5 w-5" />
                          <span className="hidden sm:inline">Mark Out</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5" />
                          <span className="hidden sm:inline">Mark In</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-green-500/50 bg-green-500/20 p-6">
          <p className="text-sm font-bold text-green-700 uppercase tracking-widest">✓ In Stock</p>
          <p className="mt-3 text-4xl font-black text-green-600">
            {products.filter(p => stockData.get(p.id) ?? true).length}
          </p>
          <p className="text-sm text-green-600 mt-2 font-semibold">Products available for customers</p>
        </div>
        <div className="rounded-2xl border-2 border-gold/50 bg-gold/20 p-6">
          <p className="text-sm font-bold text-amber-700 uppercase tracking-widest">✗ Out of Stock</p>
          <p className="mt-3 text-4xl font-black text-gold">
            {products.filter(p => !(stockData.get(p.id) ?? true)).length}
          </p>
          <p className="text-sm text-gold/80 mt-2 font-semibold">Products hidden from customers</p>
        </div>
      </div>
    </div>
  );
};
