export interface DownloadRequest {
  url: string;
  platform: 'youtube' | 'instagram' | 'twitter' | 'tiktok';
  quality: 'normal' | 'high';
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
