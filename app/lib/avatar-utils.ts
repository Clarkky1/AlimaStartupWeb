/**
 * Utility functions for avatar handling
 */

const DEFAULT_AVATAR = '/person-male-1.svg';

/**
 * Get a fallback illustration for a user
 */
export function getFallbackIllustration(): string {
  return DEFAULT_AVATAR;
}

/**
 * Get initials for a user
 */
export function getInitials(name?: string): string {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
}

/**
 * Get payment confirmation image
 */
export function getPaymentConfirmationImage(): string {
  return '/peace-hand.svg';
}

/**
 * Create an onError handler for Images that replaces broken images with initials
 */
export function createImageErrorHandler(uid?: string) {
  return function handleImageError(event: React.SyntheticEvent<HTMLImageElement, Event>) {
    // Remove the broken image
    const imgElement = event.currentTarget;
    imgElement.style.display = 'none';
    // The AvatarFallback component will show automatically
    imgElement.onerror = null;
  };
}

/**
 * Get a default avatar
 */
export function getDefaultAvatar(uid?: string): string {
  return DEFAULT_AVATAR;
}
