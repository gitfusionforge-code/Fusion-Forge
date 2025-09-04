import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  placeholder?: string;
  width?: number;
  height?: number;
}

export default function LazyImage({ 
  src, 
  alt, 
  className, 
  fallback = "/images/placeholder.svg",
  placeholder = "/images/loading.svg",
  width,
  height
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: "200px" } // Load images earlier to improve LCP
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Calculate aspect ratio to prevent layout shifts
  const aspectRatio = width && height ? `${width}/${height}` : '16/9';

  return (
    <div 
      className={cn("relative overflow-hidden bg-gray-100", className)}
      style={{ aspectRatio }}
    >
      <img
        ref={imgRef}
        src={isInView ? (hasError ? fallback : src) : placeholder}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        width={width}
        height={height}
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-200",
          isLoaded ? "opacity-100" : "opacity-50" // Start at 50% opacity instead of 0 to reduce CLS
        )}
        loading="lazy"
        decoding="async"
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}