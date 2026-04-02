/**
 * Product Skeleton Loader
 * Shows while products are loading with smooth animations
 */
export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#dce8dc] bg-white shadow-[0_2px_12px_rgba(30,79,46,0.06)]">
      {/* Image skeleton with gradient shimmer */}
      <div className="aspect-[4/3.2] w-full bg-gradient-to-r from-[#f2f7f2] via-[#e8f2e8] to-[#f2f7f2] animate-pulse" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3.5">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-5 w-3/4 rounded-lg bg-gradient-to-r from-[#e8f2e8] via-[#d8e8d8] to-[#e8f2e8] animate-pulse" />
          <div className="h-3 w-1/2 rounded-lg bg-gradient-to-r from-[#eaf3ea] via-[#dce8dc] to-[#eaf3ea] animate-pulse" />
        </div>

        {/* Weight pills skeleton */}
        <div className="grid grid-cols-3 gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-gradient-to-r from-[#f4f9f4] via-[#eaf3ea] to-[#f4f9f4] animate-pulse" />
          ))}
        </div>

        {/* Price and quantity skeleton */}
        <div className="rounded-xl border border-[#dce8dc] bg-gradient-to-b from-[#f8fbf8] to-[#eaf3ea] p-3 space-y-2">
          <div className="flex justify-between items-center">
            <div className="h-3 w-1/4 rounded bg-gradient-to-r from-[#eaf3ea] to-[#dce8dc] animate-pulse" />
            <div className="h-6 w-1/3 rounded bg-gradient-to-r from-[#d8e8d8] via-[#c8dec8] to-[#d8e8d8] animate-pulse" />
          </div>
          <div className="h-10 w-full rounded-lg bg-gradient-to-r from-[#e8f2e8] via-[#dce8dc] to-[#e8f2e8] animate-pulse" />
        </div>

        {/* Add to Cart button skeleton */}
        <div className="h-11 w-full rounded-xl bg-gradient-to-r from-[#1a5c2a]/30 via-[#0f3d1c]/30 to-[#1a5c2a]/30 animate-pulse" />
      </div>
    </div>
  );
}

export function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
      {[...Array(8)].map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
