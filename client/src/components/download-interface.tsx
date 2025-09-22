import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isValidUrl, getUrlPlatform } from "@shared/url-validator";
import { useToast } from "@/hooks/use-toast";
import GoogleAd from "@/components/google-ad";
import { DownloadOptions, type Resolution } from "./download-options";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface VideoInfo {
  title: string;
  thumbnail: string;
  platform: string;
  formats: any[];
}

export default function DownloadInterface() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [resolution, setResolution] = useState<Resolution>('720p');
  const [bitrate, setBitrate] = useState('128kbps');
  const [showAd, setShowAd] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const { isFetching, refetch } = useQuery({
    queryKey: ["fetch-info", url],
    queryFn: async () => {
      console.log("[DownloadInterface] API_BASE_URL:", API_BASE_URL);
      const fullUrl = `${API_BASE_URL}/api/fetch-info?url=${encodeURIComponent(url)}`;
      console.log("[DownloadInterface] Constructed URL:", fullUrl);
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch video information.');
      }
      const data = await response.json();
      setVideoInfo(data);
      return data;
    },
    enabled: false, // We will trigger this manually
    retry: false,
  });

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setVideoInfo(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleUrlChange(text);
    } catch (error) {
      console.error('Failed to read clipboard contents: ', error);
      toast({ title: "Paste Failed", description: "Could not read from clipboard.", variant: "destructive" });
    }
  };

  const handleFetchInfo = () => {
    if (isValidUrl(url)) {
      refetch();
    } else {
      toast({ title: "Invalid URL", description: "Please enter a valid URL.", variant: "destructive" });
    }
  };

  const startDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format, quality: format === 'mp4' ? resolution : bitrate }),
      });

      if (!response.ok) {
        throw new Error('Download failed. Please try again.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${videoInfo?.title || 'download'}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error: any) {
      toast({ title: "Download Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadClick = () => {
    const quality = format === 'mp4' ? parseInt(resolution) : 0;
    if (quality > 480) {
      setShowAd(true);
    } else {
      startDownload();
    }
  };

  const handleAdComplete = () => {
    setShowAd(false);
    if (format === 'mp4' && parseInt(resolution) > 480) {
      fetch(`${API_BASE_URL}/api/record-ad-view`, { method: 'POST' });
    }
    startDownload();
  };

  const adSeconds = format === 'mp4' && parseInt(resolution) > 480 ? 30 : 15;

  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg border border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Download Your Media</CardTitle>
            <p className="text-muted-foreground">Paste a video URL to get started</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="flex-grow"
              />
              <Button onClick={handlePaste} variant="outline">Paste</Button>
              <Button onClick={handleFetchInfo} disabled={isFetching || !url}>
                {isFetching ? 'Fetching...' : 'Fetch Info'}
              </Button>
            </div>

            {videoInfo && (
              <div className="space-y-4 animate-in fade-in-50">
                <div className="flex items-center space-x-4 p-4 border rounded-md">
                  <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-32 h-20 object-cover rounded-md" />
                  <div className="space-y-1">
                    <h3 className="font-semibold">{videoInfo.title}</h3>
                    <p className="text-sm text-muted-foreground">Platform: {videoInfo.platform}</p>
                  </div>
                </div>

                <DownloadOptions
                  formats={videoInfo}
                  selectedFormat={format}
                  setSelectedFormat={setFormat}
                  selectedResolution={resolution}
                  setSelectedResolution={setResolution}
                  selectedBitrate={bitrate}
                  setSelectedBitrate={setBitrate}
                  isFetchingFormats={isFetching}
                />

                <Button 
                  className="w-full py-4 text-lg"
                  onClick={handleDownloadClick}
                  disabled={isDownloading || showAd}
                >
                  {isDownloading ? 'Downloading...' : `Download ${format.toUpperCase()}`}
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
      
      {showAd && (
        <GoogleAd 
          duration={adSeconds}
          onAdComplete={handleAdComplete}
          onCancel={() => setShowAd(false)}
          quality={parseInt(resolution) > 480 ? 'premium' : 'free'}
        />
      )}
    </section>
  );
}