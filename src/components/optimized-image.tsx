'use client'

/**
 * Optimized Image Component
 * Production-grade image handling with lazy loading, placeholders, and error handling
 */

import Image, { ImageProps } from 'next/image'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string
  showSkeleton?: boolean
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto'
  onError?: () => void
}

// ============================================================================
// Aspect Ratio Classes
// ============================================================================

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  auto: '',
}

// ============================================================================
// Default Fallback
// ============================================================================

const DEFAULT_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%239ca3af" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'

// Pet placeholder
const PET_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23fef3c7" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="40" text-anchor="middle" dy=".3em"%3E🐾%3C/text%3E%3C/svg%3E'

// ============================================================================
// Component
// ============================================================================

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  showSkeleton = true,
  aspectRatio = 'auto',
  className,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleError = useCallback(() => {
    setHasError(true)
    setIsLoading(false)
    setImageSrc(fallbackSrc)
    onError?.()
  }, [fallbackSrc, onError])

  return (
    <div className={cn('relative overflow-hidden', aspectRatioClasses[aspectRatio], className)}>
      {/* Skeleton loader */}
      {showSkeleton && isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Image */}
      <Image
        {...props}
        src={imageSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          props.fill ? 'object-cover' : ''
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={props.priority ? 'eager' : 'lazy'}
        decoding={props.priority ? 'sync' : 'async'}
      />
    </div>
  )
}

// ============================================================================
// Specialized Components
// ============================================================================

/**
 * Avatar Image with circular shape and fallback
 */
interface AvatarImageProps extends Omit<OptimizedImageProps, 'aspectRatio'> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  name?: string
}

const avatarSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

export function AvatarImage({ src, alt, size = 'md', name, className, ...props }: AvatarImageProps) {
  const [hasError, setHasError] = useState(false)

  // Generate initials fallback
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (hasError || !src) {
    return (
      <div
        className={cn(
          'rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium',
          avatarSizes[size],
          className
        )}
      >
        {initials || '?'}
      </div>
    )
  }

  return (
    <OptimizedImage
      {...props}
      src={src}
      alt={alt}
      className={cn('rounded-full', avatarSizes[size], className)}
      aspectRatio="square"
      onError={() => setHasError(true)}
    />
  )
}

/**
 * Pet Profile Image with species-specific placeholder
 */
interface PetImageProps extends Omit<OptimizedImageProps, 'fallbackSrc'> {
  species?: 'DOG' | 'CAT'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const petSizes = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
}

export function PetImage({ src, alt, species, size = 'md', className, ...props }: PetImageProps) {
  const [hasError, setHasError] = useState(false)

  const emoji = species === 'CAT' ? '🐱' : '🐕'

  if (hasError || !src) {
    return (
      <div
        className={cn(
          'rounded-full bg-amber-100 flex items-center justify-center',
          petSizes[size],
          className
        )}
      >
        <span className="text-2xl">{emoji}</span>
      </div>
    )
  }

  return (
    <OptimizedImage
      {...props}
      src={src}
      alt={alt}
      fallbackSrc={PET_PLACEHOLDER}
      className={cn('rounded-full', petSizes[size], className)}
      aspectRatio="square"
      onError={() => setHasError(true)}
    />
  )
}

/**
 * Gallery Image with lightbox support
 */
interface GalleryImageProps extends OptimizedImageProps {
  onClick?: () => void
}

export function GalleryImage({ src, alt, onClick, className, ...props }: GalleryImageProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'group cursor-pointer',
        className
      )}
      type="button"
    >
      <OptimizedImage
        {...props}
        src={src}
        alt={alt}
        className="transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
    </button>
  )
}

// ============================================================================
// Blur Placeholder Generator
// ============================================================================

/**
 * Generate a simple blur placeholder data URL
 */
export function generateBlurPlaceholder(
  color: string = '#e5e7eb',
  width: number = 8,
  height: number = 8
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect fill="${color}" width="${width}" height="${height}"/>
    </svg>
  `
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`
}
