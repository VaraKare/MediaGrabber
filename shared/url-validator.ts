const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
const TWITTER_REGEX = /^(https?:\/\/)?(www\.)?(twitter\.com)\/[^\/]+\/status\/(\d+)(\?.*)?$/;
const INSTAGRAM_REGEX = /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel)\/[a-zA-Z0-9_-]+(\/.*)?$/;
const PINTEREST_REGEX = /^(https?:\/\/)?(www\.)?pinterest\.com\/(pin|\d+)\/.*$/;

export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

export const getUrlPlatform = (url: string): 'youtube' | 'twitter' | 'instagram' | 'pinterest' | 'other' => {
    if (YOUTUBE_REGEX.test(url)) return 'youtube';
    if (TWITTER_REGEX.test(url)) return 'twitter';
    if (INSTAGRAM_REGEX.test(url)) return 'instagram';
    if (PINTEREST_REGEX.test(url)) return 'pinterest';
    return 'other';
};