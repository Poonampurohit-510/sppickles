/**
 * Performance Monitoring
 * Tracks Core Web Vitals and custom metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

interface WebVitals {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay (deprecated, use INP)
  INP?: number; // Interaction to Next Paint
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private vitals: WebVitals = {};
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
    this.initializeWebVitalsObserver();
  }

  /**
   * Initialize Web Vitals observer using PerformanceObserver API
   */
  private initializeWebVitalsObserver(): void {
    if (!this.enabled || !("PerformanceObserver" in window)) {
      return;
    }

    try {
      // Observe Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const value = lastEntry.renderTime || lastEntry.loadTime || 0;
        this.recordMetric("LCP", value, "ms");
        this.vitals.LCP = value;
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // Observe Interaction to Next Paint (INP)
      const inpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1] as any;
          this.recordMetric(
            "INP",
            lastEntry.processingDuration || 0,
            "ms"
          );
          this.vitals.INP = lastEntry.processingDuration;
        }
      });
      inpObserver.observe({ entryTypes: ["event"] });

      // Observe Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let clsValue = 0;
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric("CLS", clsValue, "");
        this.vitals.CLS = clsValue;
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });

      // Measure Time to First Byte
      this.vitals.TTFB = this.measureTTFB();
    } catch (error) {
      console.error("[Performance] Failed to observe Web Vitals:", error);
    }
  }

  /**
   * Measure Time to First Byte (TTFB)
   */
  private measureTTFB(): number {
    try {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        return navigation.responseStart - navigation.fetchStart;
      }
    } catch (error) {
      console.error("[Performance] TTFB measurement failed:", error);
    }
    return 0;
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(name: string, value: number, unit: string = "ms"): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);

    // Log significant metrics
    if (value > this.getThreshold(name)) {
      console.warn(
        `[Performance] High ${name}: ${value.toFixed(2)}${unit}`
      );
    }

    console.debug(`[Performance] ${name}: ${value.toFixed(2)}${unit}`);
  }

  /**
   * Get performance threshold based on metric
   */
  private getThreshold(metricName: string): number {
    const thresholds: Record<string, number> = {
      LCP: 2500, // Good: <= 2.5s
      INP: 200, // Good: <= 200ms
      CLS: 0.1, // Good: <= 0.1
      TTFB: 600, // Good: <= 600ms
      TTI: 3800, // Time to Interactive threshold
      FCP: 1800, // First Contentful Paint
    };
    return thresholds[metricName] || 1000;
  }

  /**
   * Mark the start of a custom operation
   */
  mark(name: string): void {
    if (!this.enabled || !("performance" in window)) return;
    try {
      performance.mark(name);
    } catch (error) {
      console.error(`[Performance] Failed to mark ${name}:`, error);
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark: string): number {
    if (!this.enabled || !("performance" in window)) return 0;

    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      this.recordMetric(name, measure.duration, "ms");
      return measure.duration;
    } catch (error) {
      console.error(`[Performance] Failed to measure ${name}:`, error);
      return 0;
    }
  }

  /**
   * Measure operation time with async support
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    this.mark(startMark);

    try {
      const result = await fn();
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      return result;
    } catch (error) {
      console.error(`[Performance] ${name} failed:`, error);
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): Record<string, PerformanceMetric[]> {
    const result: Record<string, PerformanceMetric[]> = {};
    for (const [key, value] of this.metrics) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Get Web Vitals summary
   */
  getWebVitals(): WebVitals {
    return { ...this.vitals };
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    vitals: WebVitals;
    avgMetrics: Record<string, number>;
    timestamp: number;
  } {
    const avgMetrics: Record<string, number> = {};

    for (const [name, metricsList] of this.metrics) {
      const sum = metricsList.reduce((acc, m) => acc + m.value, 0);
      avgMetrics[name] = sum / metricsList.length;
    }

    return {
      vitals: this.getWebVitals(),
      avgMetrics,
      timestamp: Date.now(),
    };
  }

  /**
   * Send metrics to analytics endpoint (optional)
   */
  async sendMetrics(
    endpoint: string = "/api/metrics"
  ): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const summary = this.getSummary();

      // Use sendBeacon for reliability
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          endpoint,
          JSON.stringify(summary)
        );
        return true;
      }

      // Fallback to fetch
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summary),
        keepalive: true,
      });

      return true;
    } catch (error) {
      console.error("[Performance] Failed to send metrics:", error);
      return false;
    }
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Clear all recorded metrics
   */
  clear(): void {
    this.metrics.clear();
    this.vitals = {};
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    const summary = this.getSummary();
    console.group("[Performance] Summary");
    console.table(summary.vitals);
    console.table(summary.avgMetrics);
    console.groupEnd();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor(true);

// Export for use in components
export default performanceMonitor;

/**
 * React hook for performance tracking in components
 */
export function usePerformanceMonitor(componentName: string) {
  const mark = (name: string) => {
    performanceMonitor.mark(`${componentName}-${name}`);
  };

  const measure = (name: string, startMark: string, endMark: string) => {
    performanceMonitor.measure(
      `${componentName}-${name}`,
      `${componentName}-${startMark}`,
      `${componentName}-${endMark}`
    );
  };

  const recordMetric = (name: string, value: number, unit?: string) => {
    performanceMonitor.recordMetric(
      `${componentName}-${name}`,
      value,
      unit
    );
  };

  return { mark, measure, recordMetric };
}
