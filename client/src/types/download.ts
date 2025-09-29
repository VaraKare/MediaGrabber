export interface DownloadRequest {
  url: string;
  platform: 'youtube' | 'instagram' | 'twitter' | 'tiktok';
  quality: 'free' | 'premium';
  format: 'mp3' | 'mp4';
  resolution?: Resolution;
}

export interface DownloadProgress {
  id: string;
  title: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  thumbnail?: string;
}

export interface CharityStats {
  totalDonations: number;
  highQualityDownloads?: number;
  donorCount?: number;
  beneficiaries: number;
}

export type Resolution = "144p" | "240p" | "360p" | "480p" | "720p" | "1080p" | "1440p" | "2160p";

export interface Format {
  format: 'mp4' | 'mp3';
  resolutions?: Resolution[];
  bitrates?: string[];
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  platform: string;
  formats: Format[];
  // Add optional fields for APIs that return direct download URLs
  primaryDownloadUrl?: string; 
  audioDownloadUrl?: string;
}
