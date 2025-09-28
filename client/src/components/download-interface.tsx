import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isValidUrl } from "@shared/url-validator";
import { useToast } from "@/hooks/use-toast";
import GoogleAd from "@/components/google-ad";
import { DownloadOptions } from "./download-options";
import type { Resolution, VideoInfo } from "@/types/download";

// A custom hook for debouncing
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

export default function DownloadInterface() {
  const [url, setUrl] = useState('');
  const debouncedUrl = useDebounce(url, 500); // 500ms delay
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [bitrate, setBitrate] = useState('320kbps');
  const [showAd, setShowAd] = useState(false);
  const [adDuration, setAdDuration] = useState(15);
  const [isPreparing, setIsPreparing] = useState(false);
  const { toast } = useToast();

  const { isFetching, refetch, isError, error } = useQuery({
    queryKey: ["fetch-info", debouncedUrl],
    queryFn: async () => {
      if (!isValidUrl(debouncedUrl)) return null;

      const response = await fetch(`/api/fetch-info?url=${encodeURIComponent(debouncedUrl)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch video information.');
      }
      const data = await response.json();
      setVideoInfo(data);
      if (data.formats) {
        const mp4Format = data.formats.find((f: any) => f.format === 'mp4');
        if (mp4Format && mp4Format.resolutions?.length > 0) {
          setResolution(mp4Format.resolutions[0]);
        }
        const mp3Format = data.formats.find((f: any) => f.format === 'mp3');
        if (mp3Format && mp3Format.bitrates?.length > 0) {
          setBitrate(mp3Format.bitrates[0]);
        }
      }
      return data;
    },
    enabled: false, // We will trigger it manually or via debouncedUrl change
    retry: false,
  });
  
  // Effect for auto-fetching when debounced URL changes
  useEffect(() => {
    if (isValidUrl(debouncedUrl)) {
      refetch();
    } else {
      setVideoInfo(null); // Clear old info if URL is cleared or invalid
    }
  }, [debouncedUrl, refetch]);

  useEffect(() => {
    if (isError && error) {
      toast({ title: "Error Fetching Info", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleUrlChange(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      toast({ title: "Paste Failed", description: "Could not read from clipboard.", variant: "destructive" });
    }
  };

  const startDownload = useCallback(() => {
    if (!videoInfo) return;

    setIsPreparing(true);
    toast({ title: "Preparing Download", description: "Your download will begin shortly..." });

    const params = new URLSearchParams({
        url: debouncedUrl,
        format: format,
        quality: format === 'mp4' ? resolution : bitrate,
        title: videoInfo.title
    });
    
    // This will trigger the browser's download manager
    window.location.href = `/api/download?${params.toString()}`;

    // After triggering, we can reset the state after a short delay
    // The browser handles the download from here.
    setTimeout(() => {
        setIsPreparing(false);
        setUrl('');
        setVideoInfo(null);
    }, 3000); 
  }, [videoInfo, debouncedUrl, format, resolution, bitrate, toast]);
  
  const handleDownloadClick = () => {
    const qualityValue = parseInt(resolution.replace('p', ''));
    
    if (format === 'mp4' && qualityValue > 480) {
      setAdDuration(30);
    } else {
      setAdDuration(15);
    }
    setShowAd(true);
  };

  const handleAdComplete = useCallback(() => {
    setShowAd(false);
    
    const qualityValue = parseInt(resolution.replace('p', ''));
    if (format === 'mp4' && qualityValue > 480) {
        fetch('/api/record-ad-view', { method: 'POST' });
    }

    startDownload();
  }, [startDownload, format, resolution]);
  
  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Card className="shadow-lg border border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Download Your Media</CardTitle>
            <p className="text-muted-foreground">Paste a video URL to get started</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                type="url"
                placeholder="https://... (paste your link here)"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="flex-grow"
                disabled={isPreparing}
              />
              <Button onClick={handlePaste} variant="outline" className="w-full sm:w-auto" disabled={isPreparing}>Paste</Button>
            </div>

            {isFetching && (
              <div className="text-center p-4 text-muted-foreground">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Fetching video details...
              </div>
            )}

            {videoInfo && !isFetching && (
              <div className="space-y-4 animate-in fade-in-50">
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 border rounded-md">
                  <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-48 h-auto object-cover rounded-md" />
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="font-semibold">{videoInfo.title}</h3>
                    <p className="text-sm text-muted-foreground">Platform: {videoInfo.platform}</p>
                  </div>
                </div>

                <DownloadOptions
                  videoInfo={videoInfo}
                  selectedFormat={format}
                  setSelectedFormat={setFormat}
                  selectedResolution={resolution}
                  setSelectedResolution={setResolution}
                  selectedBitrate={bitrate}
                  setSelectedBitrate={setBitrate}
                  isFetchingFormats={isFetching}
                />

                <Button 
                  className="w-full py-4 text-lg flex items-center justify-center gap-2"
                  onClick={handleDownloadClick}
                  disabled={showAd || isPreparing}
                >
                  {isPreparing 
                    ? 'Starting...' 
                    : `Download ${format.toUpperCase()}`
                  }
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {showAd && (
        <GoogleAd 
          duration={adDuration}
          onAdComplete={handleAdComplete}
          onCancel={() => setShowAd(false)}
          quality={adDuration === 30 ? 'premium' : 'free'}
        />
      )}
    </section>
  );
}

