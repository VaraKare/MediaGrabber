export type Platform = 'youtube' | 'instagram' | 'twitter' | 'tiktok';
export type ComingSoonPlatform = 'facebook' | 'linkedin' | 'snapchat' | 'reddit' | 'twitch';

export interface URLValidationResult {
  isValid: boolean;
  platform?: Platform;
  comingSoon?: ComingSoonPlatform;
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

  // TikTok validation
  if (url.includes('tiktok.com')) {
    const tiktokRegex = /tiktok\.com\/@[^/]+\/video\/\d+|vm\.tiktok\.com\/[a-zA-Z0-9]+/;
    if (tiktokRegex.test(url)) {
      return { isValid: true, platform: 'tiktok' };
    }
    return { isValid: false, error: 'Invalid TikTok URL' };
  }

  // Coming Soon platforms
  if (url.includes('facebook.com') || url.includes('fb.com')) {
    return { isValid: false, comingSoon: 'facebook', error: 'Facebook support coming soon! 🚀' };
  }
  if (url.includes('linkedin.com')) {
    return { isValid: false, comingSoon: 'linkedin', error: 'LinkedIn support coming soon! 🚀' };
  }
  if (url.includes('snapchat.com')) {
    return { isValid: false, comingSoon: 'snapchat', error: 'Snapchat support coming soon! 🚀' };
  }
  if (url.includes('reddit.com')) {
    return { isValid: false, comingSoon: 'reddit', error: 'Reddit support coming soon! 🚀' };
  }
  if (url.includes('twitch.tv')) {
    return { isValid: false, comingSoon: 'twitch', error: 'Twitch support coming soon! 🚀' };
  }

  return { isValid: false, error: 'Unsupported platform. Please use YouTube, Instagram, Twitter, or TikTok URLs.' };
}
