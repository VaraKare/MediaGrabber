import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isValidUrl, isPlaylistOrAlbum, getUrlPlatform } from "@shared/url-validator";
import { useToast } from "@/hooks/use-toast";
import  GoogleAd  from "./google-ad";
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
  const debouncedUrl = useDebounce(url.trim(), 500);
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
      const trimmedUrl = debouncedUrl.trim();
      if (!isValidUrl(trimmedUrl)) {
        setVideoInfo(null);
        return null;
      }
      const playlistCheck = isPlaylistOrAlbum(trimmedUrl);
      if (playlistCheck.isPlaylist) {
        throw new Error(`${playlistCheck.platform} playlists/albums are not supported. Please use a link to a single item.`);
      }

      const response = await fetch(`/api/fetch-info?url=${encodeURIComponent(trimmedUrl)}`);
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
    enabled: false,
    retry: false,
  });
  
  // Auto-fetch when debounced URL changes
  useEffect(() => {
    const trimmedUrl = debouncedUrl.trim();
    if (trimmedUrl && isValidUrl(trimmedUrl) && !isPlaylistOrAlbum(trimmedUrl).isPlaylist) {
      refetch();
    } else if (!trimmedUrl) {
      setVideoInfo(null);
    }
  }, [debouncedUrl, refetch]);

  // Auto-select MP3 for Spotify
  useEffect(() => {
    if (videoInfo?.platform === 'spotify') {
      const hasMp3 = videoInfo.formats.some(f => f.format === 'mp3');
      if (hasMp3) {
        setFormat('mp3');
      }
    }
  }, [videoInfo]);

  useEffect(() => {
    if (isError && error) {
      toast({ title: "Error Fetching Info", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    const playlistCheck = isPlaylistOrAlbum(value.trim());
    if (playlistCheck.isPlaylist) {
      toast({
        title: "Unsupported URL Type",
        description: `${playlistCheck.platform} playlists/albums are not supported yet. Please provide a link to a single video or track.`,
        variant: "destructive"
      });
    }
  };

  const handleFetchClick = () => {
    const trimmedUrl = url.trim();
    const playlistCheck = isPlaylistOrAlbum(trimmedUrl);
    if (playlistCheck.isPlaylist) {
       toast({
        title: "Unsupported URL Type",
        description: `${playlistCheck.platform} playlists/albums are not supported yet. Please provide a link to a single video or track.`,
        variant: "destructive"
      });
      setVideoInfo(null);
      return;
    }

    if (isValidUrl(trimmedUrl)) {
      refetch();
    } else {
      toast({ title: "Invalid URL", description: "Please enter a valid media URL.", variant: "destructive" });
      setVideoInfo(null);
    }
  };

  const handleClearClick = () => {
    setUrl('');
    setVideoInfo(null);
    toast({ title: "Input Cleared", description: "URL and video information cleared.", variant: "default" });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleUrlChange(text.trim());
      toast({ title: "Pasted", description: "URL pasted from clipboard.", variant: "default" });
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
        url: url.trim(),
        format: format,
        quality: format === 'mp4' ? resolution : bitrate,
        title: videoInfo.title
    });
    
    window.location.href = `/api/download?${params.toString()}`;

    setTimeout(() => {
        setIsPreparing(false);
        setUrl('');
        setVideoInfo(null);
    }, 1000); // Small delay to allow download to initiate
  }, [videoInfo, url, format, resolution, bitrate, toast]);
  
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
              <Button onClick={handleFetchClick} className="w-full sm:w-auto" disabled={isFetching || isPreparing}>
                {isFetching ? 'Fetching...' : 'Fetch'}
              </Button>
              <Button onClick={handleClearClick} variant="ghost" className="w-full sm:w-auto" disabled={isPreparing}>Clear</Button>
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
                  {videoInfo.thumbnail ? (
                    <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-48 h-auto object-cover rounded-md" />
                  ) : (
                    <div className="w-48 h-28 bg-muted flex items-center justify-center rounded-md text-muted-foreground">
                      No Thumbnail
                    </div>
                  )}
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