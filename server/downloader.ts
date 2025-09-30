import { getFormats } from './yt-dlp';
import { getUrlPlatform, Platform } from '@shared/url-validator';
import type { VideoInfo, Format, Resolution } from '../client/src/types/download';
import { log } from '../server/utils'; // Import the centralized logging utility

// --- TYPE DEFINITIONS for a robust API configuration ---
interface ApiConfigEntry {
    host?: string;
    key?: string;
    getFetchPath: (url: string) => string;
    isPost?: boolean;
}

// Centralized RapidAPI configurations for various platforms
const API_CONFIG: Record<Platform, ApiConfigEntry> = {
    youtube: {
        host: process.env.GENERAL_API_HOST,
        key: process.env.RAPIDAPI_KEY,
        getFetchPath: () => `/all`,
        isPost: true,
    },
    instagram: {
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
    facebook: {
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
    other: {
        getFetchPath: () => ''
    }
};

interface MediaItem {
    extension?: string;
    quality?: string;
    url: string;
    format?: string;
    vcodec?: string;
    height?: number;
    acodec?: string;
    abr?: number;
}

function isValidMediaItem(item: any): item is MediaItem {
    return item && typeof item.url === 'string';
}

async function resolveShortUrl(url: string): Promise<string> {
    log(`Attempting to resolve short URL: ${url}`, 'Downloader');
    try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        const finalUrl = response.url;
        log(`Resolved URL: ${finalUrl} (Original: ${url})`, 'Downloader');
        return finalUrl;
    } catch (error) {
        log(`WARN: Could not resolve short URL ${url}. Using original. Error: ${(error as Error).message}`, 'Downloader');
        return url;
    }
}

async function fetchFromRapidAPI(url: string, platform: Platform): Promise<VideoInfo | null> {
    const startTime = process.hrtime.bigint();
    log(`API Call Started: RapidAPI (${platform}) for URL: ${url}`, 'Downloader');

    if (platform === 'other') {
        log('Error: Attempted to call RapidAPI with unsupported platform "other".', 'Downloader');
        return null;
    }

    const config = API_CONFIG[platform];
    if (!config || !config.key || !config.host) {
        log(`Error: RapidAPI config missing for platform: ${platform}. Host: ${config?.host}, Key: ${config?.key ? 'Provided' : 'Missing'}`, 'Downloader');
        return null;
    }

    const fullUrl = await resolveShortUrl(url);
    const apiUrl = `https://${config.host}${config.getFetchPath(fullUrl)}`;
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
        body: isPost ? new URLSearchParams({ url: fullUrl }).toString() : undefined,
        signal: AbortSignal.timeout(15000)
    };

    try {
        const response = await fetch(apiUrl, options);
        const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
        log(`API Response Received: RapidAPI (${platform}) with status ${response.status} in ${duration.toFixed(2)}ms`, 'Downloader');

        if (!response.ok) {
            const errorText = await response.text();
            log(`RapidAPI request failed for ${platform} with status ${response.status}. Response: ${errorText}`, 'Downloader');
            return null;
        }

        const data = await response.json();
        log('Full API Response (raw):', 'Downloader', JSON.stringify(data, null, 2));
        
        if (data.success === false) {
             throw new Error(data.message || 'The API reported an error.');
        }

        let title: string = 'Untitled';
        let thumbnail: string = '';
        const formats: Format[] = [];
        let primaryDownloadUrl: string | undefined;
        let audioDownloadUrl: string | undefined;

        log(`Mapping RapidAPI response for platform: ${platform}`, 'Downloader');
        switch (platform) {
            case 'tiktok':
                title = data.data?.title || 'TikTok Video';
                thumbnail = data.data?.cover || '';
                primaryDownloadUrl = data.data?.play;
                audioDownloadUrl = data.data?.music;
                if (data.data?.hdplay) {
                    formats.push({ format: 'mp4', resolutions: ['1080p', '720p'] });
                } else if (primaryDownloadUrl) {
                     formats.push({ format: 'mp4', resolutions: ['720p'] });
                }
                if (audioDownloadUrl) {
                    formats.push({ format: 'mp3', bitrates: ['128kbps'] });
                }
                break;
            case 'pinterest':
                title = data.data?.title || data.title || 'Pinterest Content';
                thumbnail = data.data?.thumbnail || data.thumbnail || '';
                if (data.type === 'video' && data.data?.url) {
                    primaryDownloadUrl = data.data.url;
                    const resHeight = data.data.height;
                    const res = resHeight ? `${resHeight}p` as Resolution : '720p';
                    formats.push({ format: 'mp4', resolutions: [res] });
                } else if (data.type === 'image' && data.data?.url) {
                    primaryDownloadUrl = data.data.url;
                    formats.push({ format: 'mp4', resolutions: (['original'] as unknown) as Resolution[] });
                }
                break;
            case 'spotify':
                title = data.data?.title || 'Spotify Track';
                thumbnail = data.data?.thumbnail || '';
                if (Array.isArray(data.data?.medias)) {
                    const validMedias = data.data.medias.filter(isValidMediaItem) as MediaItem[];
                    const bitrates = validMedias.map(m => m.quality).filter((q): q is string => typeof q === 'string');
                    if (bitrates.length > 0) {
                        formats.push({ format: 'mp3', bitrates: Array.from(new Set(bitrates)).sort((a, b) => parseInt(b) - parseInt(a)) });
                        audioDownloadUrl = validMedias[0]?.url;
                    }
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
            default: // Handles youtube, instagram, facebook, twitter, dailymotion
                title = data.title || data.fileName || 'Media Content';
                thumbnail = data.thumbnail || data.cover || '';
                primaryDownloadUrl = data.url || '';
                if (Array.isArray(data.formats)) {
                    const validMedias: MediaItem[] = data.formats.filter(isValidMediaItem);
                    const mp4Medias = validMedias.filter(m => m.vcodec !== 'none' && m.height);
                    const mp3Medias = validMedias.filter(m => m.acodec !== 'none' && m.abr);

                    if (mp4Medias.length > 0) {
                        const resolutions = Array.from(new Set(mp4Medias.map(m => `${m.height}p`)))
                            .sort((a, b) => parseInt(b) - parseInt(a)) as Resolution[];
                        if (resolutions.length > 0) formats.push({ format: 'mp4', resolutions });
                    }

                    if (mp3Medias.length > 0) {
                        const bitrates = Array.from(new Set(mp3Medias.map(m => `${Math.round(m.abr || 0)}kbps`)))
                             .sort((a, b) => parseInt(b) - parseInt(a));
                        if (bitrates.length > 0) formats.push({ format: 'mp3', bitrates });
                    }
                }
                break;
        }
        log(`Extracted ${platform}: title='${title}', thumbnail='${thumbnail}', primaryDownloadUrl='${primaryDownloadUrl}', audioDownloadUrl='${audioDownloadUrl}', formats=${JSON.stringify(formats)}`, 'Downloader');
        return { title, thumbnail, platform, formats, primaryDownloadUrl, audioDownloadUrl };
    } catch (error) {
        const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
        log(`Error fetching from RapidAPI for ${platform} in ${duration.toFixed(2)}ms. Error: ${(error as Error).message}`, 'Downloader');
        if ((error as Error).message.includes('The system is undergoing an upgrade')) {
             throw new Error('This Spotify content type (e.g., episode) is not supported by the API.');
        }
        return null;
    }
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
    const platform = getUrlPlatform(url);
    log(`Determined platform for URL ${url}: ${platform}`, 'Downloader');

    if (platform === 'other') {
        throw new Error("Unsupported platform. Please provide a URL from a supported media platform.");
    }
    
    try {
        const apiResult = await fetchFromRapidAPI(url, platform);
        if (apiResult && apiResult.formats && apiResult.formats.length > 0) {
            log(`Successfully fetched video info from RapidAPI for ${platform}.`, 'Downloader');
            return apiResult;
        }
        if (apiResult) {
            log(`RapidAPI for ${platform} returned no usable formats. Attempting yt-dlp fallback.`, 'Downloader');
        }
    } catch (rapidApiError) {
        log(`RapidAPI call for ${platform} failed. Error: ${(rapidApiError as Error).message}. Falling back to yt-dlp.`, 'Downloader');
        // If the API explicitly says a type is unsupported, throw that error instead of falling back
        if ((rapidApiError as Error).message.includes('not supported by the API')) {
            throw rapidApiError;
        }
    }


    log(`Falling back to yt-dlp for URL: ${url}`, 'Downloader');
    const ytDlpInfo = await getFormats(url);
    
    log('Full yt-dlp Response (raw):', 'Downloader', JSON.stringify(ytDlpInfo, null, 2));
    
    if (platform === 'pinterest' && (!ytDlpInfo.formats || ytDlpInfo.formats.length === 0)) {
        if (ytDlpInfo.thumbnail && ytDlpInfo.title) {
            log(`yt-dlp found no video formats for Pinterest, but found image data. Treating as an image download.`, 'Downloader');
            return {
                title: ytDlpInfo.title,
                thumbnail: ytDlpInfo.thumbnail,
                platform,
                formats: [{ format: 'mp4', resolutions: (['original'] as unknown) as Resolution[] }],
                primaryDownloadUrl: ytDlpInfo.thumbnail,
            };
        }
    }

    const mp4Resolutions = new Set<string>();
    const mp3Bitrates = new Set<string>();

    ytDlpInfo.formats?.forEach((format: any) => {
      log(`yt-dlp format: ext=${format.ext}, height=${format.height}, vcodec=${format.vcodec}, acodec=${format.acodec}, abr=${format.abr}`, 'Downloader');

      if (format.ext === 'mp4' && format.height && format.vcodec !== 'none') {
        mp4Resolutions.add(`${format.height}p`);
      } 
      else if (['m4a', 'mp3', 'opus', 'aac'].includes(format.ext) && format.acodec !== 'none' && format.abr) {
        mp3Bitrates.add(`${Math.round(format.abr)}kbps`);
      }
    });

    const formats: Format[] = [];
    if (mp4Resolutions.size > 0) {
        formats.push({ format: 'mp4', resolutions: Array.from(mp4Resolutions).sort((a, b) => parseInt(b) - parseInt(a)) as Resolution[] });
    }
    if (mp3Bitrates.size > 0) {
        formats.push({ format: 'mp3', bitrates: Array.from(mp3Bitrates).sort((a, b) => parseInt(b) - parseInt(a)) });
    }

    const finalVideoInfo: VideoInfo = {
      title: ytDlpInfo.title || 'Untitled Video',
      thumbnail: ytDlpInfo.thumbnail,
      platform,
      formats,
    };
    log(`Final VideoInfo after yt-dlp fallback: ${JSON.stringify(finalVideoInfo)}`, 'Downloader');
    return finalVideoInfo;
}

export async function getDirectDownloadUrl(url: string, platform: Platform, format: 'mp3' | 'mp4', quality: string): Promise<string | null> {
    log(`Attempting to get direct download URL for ${url} (platform: ${platform}, format: ${format}, quality: ${quality}) from RapidAPI.`, 'Downloader');
    
    const videoInfo = await fetchFromRapidAPI(url, platform);

    if (!videoInfo) {
        log(`No videoInfo found from RapidAPI for direct download.`, 'Downloader');
        return null;
    }

    if (format === 'mp3' && videoInfo.audioDownloadUrl) {
        log(`Found direct audio download URL: ${videoInfo.audioDownloadUrl}`, 'Downloader');
        return videoInfo.audioDownloadUrl;
    }
    if (format === 'mp4' && videoInfo.primaryDownloadUrl) {
        log(`Found direct video download URL: ${videoInfo.primaryDownloadUrl}`, 'Downloader');
        return videoInfo.primaryDownloadUrl;
    }

    log(`No direct download URL found for format ${format} and quality ${quality} from RapidAPI.`, 'Downloader');
    return null;
}