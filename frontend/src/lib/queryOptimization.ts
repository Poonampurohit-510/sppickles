/**
 * Database Query Optimization
 * Caching strategies, connection pooling, and query efficiency
 */

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  PRODUCTS: 5 * 60, // 5 minutes for product listings
  PRODUCT_DETAIL: 10 * 60, // 10 minutes for single product
  STOCK: 1 * 60, // 1 minute for stock status
  ORDERS: 30, // 30 seconds for orders (fresh data)
  CATEGORIES: 60 * 60, // 1 hour for categories
};

/**
 * Generate cache key for products based on filters
 */
export function generateProductsCacheKey(
  filters?: Record<string, any>
): string {
  const key = filters ? JSON.stringify(filters) : "all";
  return `products:${key}`;
}

/**
 * Generate cache key for single product
 */
export function generateProductCacheKey(productId: string): string {
  return `product:${productId}`;
}

/**
 * Set cache headers for successful responses
 */
export function setCacheHeaders(
  res: any,
  duration: number,
  isPublic: boolean = true
): void {
  const scope = isPublic ? "public" : "private";
  res.set?.("Cache-Control", `${scope}, max-age=${duration}`);
  res.set?.("Expires", new Date(Date.now() + duration * 1000).toUTCString());
}

/**
 * Set no-cache headers for dynamic content
 */
export function setNoCacheHeaders(res: any): void {
  res.set?.("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set?.("Pragma", "no-cache");
  res.set?.("Expires", "0");
}

/**
 * Add ETag to response for conditional requests
 */
export function generateETag(data: any): string {
  // Simple hash generation
  let hash = 0;
  const str = JSON.stringify(data);
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `"${hash.toString(16)}"`;
}

/**
 * Optimize query: Use projections to select only needed columns
 * Instead of SELECT *, SELECT id, name, price, image, category, stock
 */
export const OPTIMIZED_PRODUCT_QUERY = `
  SELECT 
    id, 
    name, 
    name_te,
    price_per_kg, 
    category, 
    subcategory, 
    image, 
    isBestSeller,
    slug
  FROM products
  WHERE 1=1
`;

/**
 * Optimize query: Use indexes for common filters
 * CREATE INDEX idx_products_category ON products(category);
 * CREATE INDEX idx_products_slug ON products(slug);
 * CREATE INDEX idx_stock_status_in_stock ON stock_status(in_stock);
 */
export const INDEX_RECOMMENDATIONS = [
  "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
  "CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)",
  "CREATE INDEX IF NOT EXISTS idx_stock_status_in_stock ON stock_status(in_stock)",
  "CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)",
  "CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)",
];

/**
 * Connection pooling configuration
 * For PostgreSQL production deployment
 */
export const POOL_CONFIG = {
  min: 2, // Minimum connections to maintain
  max: 10, // Maximum connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout for acquiring connection
};

/**
 * Batch load products (N+1 query prevention)
 * Load all products at once instead of per-request
 */
export async function batchLoadProducts(
  db: any,
  productIds: string[]
): Promise<Record<string, any>> {
  const placeholders = productIds.map(() => "?").join(",");
  const query = `
    SELECT * FROM products 
    WHERE id IN (${placeholders})
  `;

  const products = await db.all(query, productIds);
  const result: Record<string, any> = {};

  products.forEach((product: any) => {
    result[product.id] = product;
  });

  return result;
}

/**
 * Pagination helper to prevent large data transfers
 */
export function getPaginationParams(
  page: string | number = 1,
  limit: string | number = 20
): { offset: number; limit: number } {
  const pageNum = Math.max(1, parseInt(String(page), 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));

  return {
    offset: (pageNum - 1) * limitNum,
    limit: limitNum,
  };
}

/**
 * Query optimization middleware
 * Logs slow queries for analysis
 */
export function slowQueryLogger(threshold: number = 100) {
  return (query: string, params: any[], duration: number) => {
    if (duration > threshold) {
      console.log(
        `[SLOW QUERY] ${duration}ms - ${query.substring(0, 100)}...`,
        params
      );
    }
  };
}

/**
 * In-memory cache for frequently accessed data
 * TTL-based expiration
 */
export class QueryCache {
  private cache: Map<
    string,
    { data: any; expiration: number }
  > = new Map();

  set(key: string, data: any, ttlSeconds: number): void {
    const expiration = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiration });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiration < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Database connection pool manager
 */
export class ConnectionPool {
  private activeConnections: number = 0;
  private maxConnections: number = 10;
  private queue: Array<() => void> = [];

  constructor(maxConnections: number = 10) {
    this.maxConnections = maxConnections;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    while (this.activeConnections >= this.maxConnections) {
      await new Promise((resolve: any) => this.queue.push(resolve));
    }

    this.activeConnections++;

    try {
      return await fn();
    } finally {
      this.activeConnections--;
      const next = this.queue.shift();
      if (next) next();
    }
  }

  getStats(): {
    active: number;
    max: number;
    queued: number;
    utilization: number;
  } {
    return {
      active: this.activeConnections,
      max: this.maxConnections,
      queued: this.queue.length,
      utilization: Math.round(
        (this.activeConnections / this.maxConnections) * 100
      ),
    };
  }
}
