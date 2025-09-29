const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
const TWITTER_REGEX = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)(\?.*)?$/;
const INSTAGRAM_REGEX = /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|reels)\/[a-zA-Z0-9_-]+(\/.*)?$/;
const FACEBOOK_REGEX = /^(https?:\/\/)?(www\.)?facebook\.com\/(watch\?v=|video\.php\?v=|[^\/]+\/videos\/|reel\/)([0-9]+)(\/.*)?$/;
const TIKTOK_REGEX = /^(https?:\/\/)?(www\.)?tiktok\.com\/(@[a-zA-Z0-9_.]+\/video\/|v\/)([0-9]+)(\/.*)?$/;
const DAILYMOTION_REGEX = /^(https?:\/\/)?(www\.)?dailymotion\.com\/video\/[a-zA-Z0-9]+(\/.*)?$/;
const PINTEREST_REGEX = /^(https?:\/\/)?(www\.)?pinterest\.com\/(pin|\d+)\/.*$/;
const SPOTIFY_REGEX = /^(https?:\/\/)?(open\.)?spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+(\?.*)?$/;
const TERABOX_REGEX = /^(https?:\/\/)?(www\.)?terabox\.com\/s\/[a-zA-Z0-9]+(\?.*)?$/;

export type Platform = 'youtube' | 'twitter' | 'instagram' | 'facebook' | 'tiktok' | 'dailymotion' | 'pinterest' | 'spotify' | 'terabox' | 'other';


export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return getUrlPlatform(url) !== 'other';
    } catch (e) {
        return false;
    }
};

export const getUrlPlatform = (url: string): Platform => {
    if (YOUTUBE_REGEX.test(url)) return 'youtube';
    if (TWITTER_REGEX.test(url)) return 'twitter';
    if (INSTAGRAM_REGEX.test(url)) return 'instagram';
    if (FACEBOOK_REGEX.test(url)) return 'facebook';
    if (TIKTOK_REGEX.test(url)) return 'tiktok';
    if (DAILYMOTION_REGEX.test(url)) return 'dailymotion';
    if (PINTEREST_REGEX.test(url)) return 'pinterest';
    if (SPOTIFY_REGEX.test(url)) return 'spotify';
    if (TERABOX_REGEX.test(url)) return 'terabox';
    return 'other';
};