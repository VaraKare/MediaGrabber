export interface DownloadRequest {
  url: string;
  platform: 'youtube' | 'instagram' | 'twitter' | 'tiktok';
  quality: 'free' | 'premium';
  format: 'mp3' | 'mp4';
  resolution?: '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p';
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
  totalRaised: number;
  highQualityDownloads: number;
  beneficiaries: number;
}
