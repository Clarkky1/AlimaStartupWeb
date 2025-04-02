// Cloudinary configuration constants
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'duslhnwq0';
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

// Console log for debugging
console.log(`Client Cloudinary Config: cloud_name=${CLOUDINARY_CLOUD_NAME}`);

export function getOptimizedImageUrl(originalUrl: string, width: number, height: number): string {
    if (!originalUrl || !originalUrl.includes("cloudinary.com")) {
      return originalUrl
    }
  
    // Insert transformation parameters into the URL
    return originalUrl.replace("/upload/", `/upload/c_fill,w_${width},h_${height}/`)
}