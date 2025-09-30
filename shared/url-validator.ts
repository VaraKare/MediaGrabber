// Regex for single video/track/episode links
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+.*$/;
const TWITTER_REGEX = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)(\?.*)?$/;
const INSTAGRAM_REGEX = /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|reels)\/[a-zA-Z0-9_-]+(\/.*)?$/;
const FACEBOOK_REGEX = /^(https?:\/\/)?(www\.)?facebook\.com\/(watch\?v=|video\.php\?v=|[^\/]+\/videos\/|reel\/)([0-9]+)(\/.*)?$/;
const TIKTOK_REGEX = /^(https?:\/\/)?(www\.)?tiktok\.com\/(@[a-zA-Z0-9_.]+\/video\/|v\/)([0-9]+)(\/.*)?$/;
const DAILYMOTION_REGEX = /^(https?:\/\/)?(www\.)?dailymotion\.com\/video\/[a-zA-Z0-9]+(\/.*)?$/;
const PINTEREST_PIN_REGEX = /^(https?:\/\/)?(www\.|[a-z]{2}\.)?pinterest\.com\/(pin|pin\/)\/\d+.*$|^(https?:\/\/)?pin\.it\/[a-zA-Z0-9]+$/;
const SPOTIFY_TRACK_EPISODE_REGEX = /^(https?:\/\/)?(open\.)?spotify\.com\/(track|episode)\/[a-zA-Z0-9]+(\?.*)?$/;
const TERABOX_REGEX = /^(https?:\/\/)?(www\.)?terabox\.com\/s\/[a-zA-Z0-9]+(\?.*)?$/;

// Regex for detecting playlists, albums, and boards which are not supported
const YOUTUBE_PLAYLIST_REGEX = /list=/;
const SPOTIFY_PLAYLIST_ALBUM_REGEX = /spotify\.com\/(playlist|album)\//;

export type Platform = 'youtube' | 'twitter' | 'instagram' | 'facebook' | 'tiktok' | 'dailymotion' | 'pinterest' | 'spotify' | 'terabox' | 'other';

export function isPlaylistOrAlbum(url: string): { isPlaylist: boolean; platform: string | null } {
    const trimmedUrl = url.trim();
    if (YOUTUBE_PLAYLIST_REGEX.test(trimmedUrl) && !YOUTUBE_REGEX.test(trimmedUrl)) {
        return { isPlaylist: true, platform: 'YouTube' };
    }
    if (SPOTIFY_PLAYLIST_ALBUM_REGEX.test(trimmedUrl)) {
        return { isPlaylist: true, platform: 'Spotify' };
    }
    // A Pinterest URL that doesn't contain /pin/ is likely a board or profile.
    if (/pinterest\.com/.test(trimmedUrl) && !PINTEREST_PIN_REGEX.test(trimmedUrl)) {
        return { isPlaylist: true, platform: 'Pinterest' };
    }
    return { isPlaylist: false, platform: null };
}

export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url); // Validate URL format
        return getUrlPlatform(url) !== 'other';
    } catch (e) {
        return false;
    }
};

export const getUrlPlatform = (url: string): Platform => {
    // Ensure the URL is trimmed before testing against regexes
    const trimmedUrl = url.trim();
    if (YOUTUBE_REGEX.test(trimmedUrl)) return 'youtube';
    if (TWITTER_REGEX.test(trimmedUrl)) return 'twitter';
    if (INSTAGRAM_REGEX.test(trimmedUrl)) return 'instagram';
    if (FACEBOOK_REGEX.test(trimmedUrl)) return 'facebook';
    if (TIKTOK_REGEX.test(trimmedUrl)) return 'tiktok';
    if (DAILYMOTION_REGEX.test(trimmedUrl)) return 'dailymotion';
    if (PINTEREST_PIN_REGEX.test(trimmedUrl)) return 'pinterest';
    if (SPOTIFY_TRACK_EPISODE_REGEX.test(trimmedUrl)) return 'spotify';
    if (TERABOX_REGEX.test(trimmedUrl)) return 'terabox';
    return 'other';
};