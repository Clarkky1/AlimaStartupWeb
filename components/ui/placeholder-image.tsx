"use client";

import { useState } from 'react';
import Image from 'next/image';

interface PlaceholderImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function PlaceholderImage({ src, alt, width, height, className }: PlaceholderImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      // Replace with a placeholder image from placehold.co
      setImgSrc(`https://placehold.co/${width}x${height}/9CA3AF/FFFFFF?text=${encodeURIComponent(alt)}`);
      setHasError(true);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      onError={handleError}
      className={className || ''}
    />
  );
} 