export type Platform = 'youtube' | 'instagram' | 'twitter';

export interface URLValidationResult {
  isValid: boolean;
  platform?: Platform;
  error?: string;
}

export function validateURL(url: string): URLValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  // Basic URL format validation
  try {
    new URL(url);
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }

  // YouTube validation
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    if (youtubeRegex.test(url)) {
      return { isValid: true, platform: 'youtube' };
    }
    return { isValid: false, error: 'Invalid YouTube URL' };
  }

  // Instagram validation
  if (url.includes('instagram.com')) {
    const instagramRegex = /instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/;
    if (instagramRegex.test(url)) {
      return { isValid: true, platform: 'instagram' };
    }
    return { isValid: false, error: 'Invalid Instagram URL' };
  }

  // Twitter validation
  if (url.includes('twitter.com') || url.includes('x.com')) {
    const twitterRegex = /(twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/;
    if (twitterRegex.test(url)) {
      return { isValid: true, platform: 'twitter' };
    }
    return { isValid: false, error: 'Invalid Twitter URL' };
  }

  return { isValid: false, error: 'Unsupported platform. Please use YouTube, Instagram, or Twitter URLs.' };
}
