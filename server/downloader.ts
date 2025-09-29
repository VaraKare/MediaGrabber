import { getFormats } from './yt-dlp';
import { getUrlPlatform, Platform } from '@shared/url-validator';
import type { VideoInfo, Format, Resolution } from '../client/src/types/download';

// --- TYPE DEFINITIONS for a robust API configuration ---
// This ensures every API config object has a consistent shape.
type ApiConfigEntry = {
    host?: string;
    key?: string;
    getFetchPath: (url: string) => string;
    isPost?: boolean; // `isPost` is now an optional property
};

// This maps each platform to its specific configuration.
const API_CONFIG: Record<Platform, ApiConfigEntry> = {
    youtube: {
        host: process.env.YOUTUBE_API_HOST,
        key: process.env.RAPIDAPI_KEY,
        getFetchPath: (url: string) => `/ajax/download.php?format=mp4&add_info=1&url=${encodeURIComponent(url)}`,
    },
    tiktok: {
        host: process.env.TIKTOK_API_HOST,
        key: process.env.RAPIDAPI_KEY,
        getFetchPath: (url: string) => `/analysis?url=${encodeURIComponent(url)}&hd=1`,
    },
    pinterest: {
        host: process.env.PINTEREST_API_HOST,
        key: process.env.RAPIDAPI_KEY,
        getFetchPath: (url: string) => `/pinterest?url=${encodeURIComponent(url)}`,
    },
    spotify: {
        host: process.env.SPOTIFY_API_HOST,
        key: process.env.RAPIDAPI_KEY,
        getFetchPath: (url: string) => `/download?link=${encodeURIComponent(url)}`,
    },
    terabox: {
        host: process.env.TERABOX_API_HOST,
        key: process.env.RAPIDAPI_KEY,
        getFetchPath: (url: string) => `/api?url=${encodeURIComponent(url)}`,
    },
    instagram: {
        host: process.env.GENERAL_API_HOST,
        key: process.env.RAPIDAPI_KEY,
        getFetchPath: () => `/all`,
        isPost: true,
    },
    facebook: {
        host: process.env.GENERAL_API_HOST,
        key: process.env.RAPIDAPI_KEY,
        getFetchPath: () => `/all`,
        isPost: true,
    },
    twitter: {
        host: process.env.GENERAL_API_HOST,
        key: process.env.RAPIDAPI_KEY,
        getFetchPath: () => `/all`,
        isPost: true,
    },
    dailymotion: {
        host: process.env.GENERAL_API_HOST,
        key: process.env.RAPIDAPI_KEY,
        getFetchPath: () => `/all`,
        isPost: true,
    },
    other: { // A valid, empty config for the 'other' platform type
        getFetchPath: () => ''
    }
};

// Type guard to check for a valid media item from the general API
interface MediaItem {
    extension: string;
    quality: string;
    url: string;
}
function isValidMediaItem(item: any): item is MediaItem {
    return item && typeof item.extension === 'string' && typeof item.quality === 'string' && typeof item.url === 'string';
}


async function fetchFromRapidAPI(url: string, platform: Platform): Promise<VideoInfo | null> {
    if (platform === 'other') {
        return null;
    }
    
    const config = API_CONFIG[platform];

    if (!config.key || !config.host) {
        console.log(`RapidAPI config for "${platform}" is missing. Skipping.`);
        return null;
    }

    const apiUrl = `https://${config.host}${config.getFetchPath(url)}`;
    const isPost = !!config.isPost;

    const headers: Record<string, string> = {
        'x-rapidapi-key': config.key,
        'x-rapidapi-host': config.host,
    };
    if (isPost) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    const options: RequestInit = {
        method: isPost ? 'POST' : 'GET',
        headers,
        body: isPost ? new URLSearchParams({ url }) : undefined
    };
    
    try {
        const response = await fetch(apiUrl, options);
        if (!response.ok) return null;
        const data = await response.json();

        let title: string = 'Untitled';
        let thumbnail: string = '';
        const formats: Format[] = [];
        let primaryDownloadUrl: string | undefined;
        let audioDownloadUrl: string | undefined;

        switch (platform) {
            case 'youtube':
                title = data.info?.title || data.title || 'YouTube Video';
                thumbnail = data.info?.image || '';
                formats.push({ format: 'mp4', resolutions: ['1080p', '720p', '480p', '360p'] });
                formats.push({ format: 'mp3', bitrates: ['320kbps', '128kbps'] });
                break;
            case 'tiktok':
                title = data.data?.title || 'TikTok Video';
                thumbnail = data.data?.cover || '';
                primaryDownloadUrl = data.data?.play;
                audioDownloadUrl = data.data?.music;
                formats.push({ format: 'mp4', resolutions: data.data?.hdplay ? ['1080p', '720p'] : ['720p'] });
                if (audioDownloadUrl) formats.push({ format: 'mp3', bitrates: ['128kbps'] });
                break;
            case 'pinterest':
                title = data.title || 'Pinterest Content';
                thumbnail = data.thumbnail || '';
                if (data.type === 'video' && data.url) {
                    primaryDownloadUrl = data.url;
                    const res = data.height ? `${data.height}p` as Resolution : '720p';
                    formats.push({ format: 'mp4', resolutions: [res] });
                }
                break;
            case 'spotify':
                title = data.data?.title || 'Spotify Track';
                thumbnail = data.data?.thumbnail || '';
                if (Array.isArray(data.data?.medias)) {
                    const spotifyBitrates: string[] = data.data.medias
                        .map((m: any) => m.quality)
                        .filter((q: any): q is string => typeof q === 'string');
                    formats.push({ format: 'mp3', bitrates: spotifyBitrates });
                    audioDownloadUrl = data.data.medias[0]?.url;
                }
                break;
            case 'terabox':
                title = data.title || 'Terabox File';
                thumbnail = data.thumbnail || '';
                if (data.download_url) {
                    primaryDownloadUrl = data.download_url;
                    formats.push({ format: 'mp4', resolutions: ['720p'] });
                }
                break;
            case 'instagram':
            case 'facebook':
            case 'twitter':
            case 'dailymotion':
                title = data.title || 'Media Content';
                thumbnail = data.thumbnail || data.thumb || '';
                if (Array.isArray(data.medias)) {
                    // --- FULLY TYPE-SAFE DATA EXTRACTION AND SORTING ---
                    const validMedias: MediaItem[] = data.medias.filter(isValidMediaItem);

                    const mp4Medias = validMedias.filter(m => m.extension === 'mp4');
                    const mp3Medias = validMedias.filter(m => m.extension === 'mp3');

                    if (mp4Medias.length > 0) {
                        const resolutionStrings = mp4Medias.map(m => m.quality);
                        const resolutions = Array.from(new Set(resolutionStrings))
                            .sort((a, b) => parseInt(b.replace('p', '')) - parseInt(a.replace('p', '')));
                        formats.push({ format: 'mp4', resolutions: resolutions as Resolution[] });
                        primaryDownloadUrl = mp4Medias[0].url;
                    }
                    if (mp3Medias.length > 0) {
                        const bitrateStrings = mp3Medias.map(m => m.quality);
                        const bitrates = Array.from(new Set(bitrateStrings))
                            .sort((a, b) => parseInt(b.replace('kbps', '')) - parseInt(a.replace('kbps', '')));
                        formats.push({ format: 'mp3', bitrates });
                        audioDownloadUrl = mp3Medias[0].url;
                    }
                }
                break;
        }
        return { title, thumbnail, platform, formats, primaryDownloadUrl, audioDownloadUrl };
    } catch (error) {
        console.error(`Failed to fetch from RapidAPI for ${platform}`, error);
        return null;
    }
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
    const platform = getUrlPlatform(url);
    if (platform === 'other') throw new Error("Unsupported platform");

    const apiResult = await fetchFromRapidAPI(url, platform);
    if (apiResult) return apiResult;

    console.log(`RapidAPI call for ${platform} failed/not configured. Falling back to yt-dlp.`);
    const ytDlpInfo = await getFormats(url);
    
    const mp4Resolutions = new Set<string>();
    const mp3Bitrates = new Set<string>();

    ytDlpInfo.formats?.forEach((format: any) => {
      if (format.ext === 'mp4' && format.height && format.vcodec !== 'none') {
        mp4Resolutions.add(`${format.height}p`);
      } 
      else if (['m4a', 'mp3', 'opus', 'aac'].includes(format.ext) && format.acodec !== 'none' && format.abr) {
        mp3Bitrates.add(`${Math.round(format.abr)}kbps`);
      }
    });

    return {
      title: ytDlpInfo.title || 'Untitled Video',
      thumbnail: ytDlpInfo.thumbnail,
      platform,
      formats: [
        { format: 'mp4', resolutions: Array.from(mp4Resolutions).sort((a, b) => parseInt(b) - parseInt(a)) as Resolution[] },
        { format: 'mp3', bitrates: Array.from(mp3Bitrates).sort((a, b) => parseInt(b) - parseInt(a)) },
      ]
    };
}

export async function getDirectDownloadUrl(url: string, platform: Platform, format: 'mp3' | 'mp4', quality: string): Promise<string | null> {
    const videoInfo = await fetchFromRapidAPI(url, platform);
    if (format === 'mp3' && videoInfo?.audioDownloadUrl) return videoInfo.audioDownloadUrl;
    if (format === 'mp4' && videoInfo?.primaryDownloadUrl) return videoInfo.primaryDownloadUrl;
    return null; // Fallback to yt-dlp if no direct URL is found
}

