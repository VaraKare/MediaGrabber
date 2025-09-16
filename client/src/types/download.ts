export interface DownloadRequest {
  url: string;
  platform: 'youtube' | 'instagram' | 'twitter' | 'tiktok';
  quality: 'free' | 'premium';
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
  premiumDownloads: number;
  beneficiaries: number;
}
