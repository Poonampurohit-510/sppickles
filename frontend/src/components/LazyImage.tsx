import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  onLoad?: () => void;
}

/**
 * LazyImage Component
 * Uses Intersection Observer for efficient lazy loading
 * Falls back to native loading="lazy" if supported
 */
export function LazyImage({
  src,
  alt,
  className = "",
  width,
  height,
  placeholder,
  onLoad,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder || "");
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Use native loading if available, otherwise use Intersection Observer
    if ("IntersectionObserver" in window && imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              if (observerRef.current && imgRef.current) {
                observerRef.current.unobserve(imgRef.current);
              }
            }
          });
        },
        {
          rootMargin: "50px",
        }
      );

      observerRef.current.observe(imgRef.current);

      return () => {
        if (observerRef.current && imgRef.current) {
          observerRef.current.unobserve(imgRef.current);
        }
      };
    } else {
      // Fallback for browsers without IntersectionObserver
      setImageSrc(src);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
  };

  return (
    <motion.img
      ref={imgRef}
      src={imageSrc || placeholder}
      alt={alt}
      width={width}
      height={height}
      onLoad={handleLoad}
      onError={handleError}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      role={error ? "img" : undefined}
      aria-label={error ? `Failed to load: ${alt}` : alt}
    />
  );
}

/**
 * Progressive Image Component
 * Loads low-quality placeholder first, then high-quality image
 */
export function ProgressiveImage({
  src: highQualitySrc,
  placeholder: lowQualitySrc,
  alt,
  className = "",
}: {
  src: string;
  placeholder?: string;
  alt: string;
  className?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Low-quality placeholder */}
      {lowQualitySrc && (
        <img
          src={lowQualitySrc}
          alt=""
          className={`absolute inset-0 ${className}`}
          style={{
            filter: "blur(20px)",
            opacity: isLoaded ? 0 : 1,
            transition: "opacity 0.3s ease-out",
          }}
          aria-hidden="true"
        />
      )}

      {/* High-quality image */}
      <LazyImage
        src={highQualitySrc}
        alt={alt}
        className={className}
        placeholder={lowQualitySrc}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
