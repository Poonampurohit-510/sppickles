/**
 * Image Optimization Utilities
 * Handles lazy loading, responsive images, and optimization
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

// Get optimized image URL with size and quality parameters
export function getOptimizedImageUrl(
  url: string,
  width: number,
  quality: number = 80
): string {
  // For local images, return as-is
  // In production, integrate with image service (Cloudinary, ImageKit, etc.)
  if (!url.startsWith('http')) {
    return url;
  }
  
  // Example: Cloudinary optimization
  // const cloudinaryUrl = url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
  return url;
}

// Generate srcset for responsive images
export function generateSrcSet(
  baseUrl: string,
  sizes: number[] = [400, 600, 800]
): string {
  return sizes
    .map((size) => `${getOptimizedImageUrl(baseUrl, size)} ${size}w`)
    .join(', ');
}

// Get appropriate size for device
export function getImageSizeForDevice(): number {
  if (typeof window === 'undefined') return 800;
  
  const width = window.innerWidth;
  if (width < 640) return 400;
  if (width < 1024) return 600;
  return 800;
}

// Preload image
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

// Batch preload images
export function batchPreloadImages(urls: string[]): Promise<PromiseSettledResult<void>[]> {
  return Promise.allSettled(urls.map(preloadImage));
}

// Check if image format is supported
export function isWebPSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
}

// Format image URL to WebP if supported
export function formatImageUrl(url: string): string {
  if (!isWebPSupported() || !url.endsWith('.jpg')) {
    return url;
  }
  return url.replace('.jpg', '.webp');
}
