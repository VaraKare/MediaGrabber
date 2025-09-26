import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isValidUrl } from "@shared/url-validator";
import { useToast } from "@/hooks/use-toast";
import GoogleAd from "@/components/google-ad";
import { DownloadOptions } from "./download-options";
import type { Resolution, VideoInfo } from "@/types/download";

export default function DownloadInterface() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [bitrate, setBitrate] = useState('320kbps');
  const [showAd, setShowAd] = useState(false);
  const [adDuration, setAdDuration] = useState(15);
  const [isPreparing, setIsPreparing] = useState(false);
  const { toast } = useToast();
  const downloadTriggeredRef = useRef(false);

  const { isFetching, refetch, isError, error } = useQuery({
    queryKey: ["fetch-info", url],
    queryFn: async () => {
      const response = await fetch(`/api/fetch-info?url=${encodeURIComponent(url)}`);
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

  useEffect(() => {
    if (isError && error) {
      toast({ title: "Error Fetching Info", description: error.message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setVideoInfo(null);
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

  const handleFetchInfo = () => {
    if (isValidUrl(url)) {
      refetch();
    } else {
      toast({ title: "Invalid URL", description: "Please enter a valid URL.", variant: "destructive" });
    }
  };

  const startDownload = async () => {
    if (downloadTriggeredRef.current) return;
    downloadTriggeredRef.current = true;
    setIsPreparing(true);
    toast({ title: "Preparing Download", description: "Your file is being prepared on the server." });
  
    try {
      const params = new URLSearchParams({
        url: url,
        format: format,
        quality: format === 'mp4' ? resolution : bitrate,
      });
      const downloadUrl = `/api/download?${params.toString()}`;
      
      const response = await fetch(downloadUrl);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed. Please try again.');
      }
  
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${videoInfo?.title || 'download'}.${format}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up the object URL and the link
      window.URL.revokeObjectURL(objectUrl);
      a.remove();
      
      toast({ title: "Download Started!", description: "Check your browser's download manager.", variant: "default" });
  
    } catch (err: any) {
      toast({ title: "Download Error", description: err.message, variant: "destructive" });
    } finally {
      setIsPreparing(false);
      downloadTriggeredRef.current = false;
    }
  };
  
  const handleDownloadClick = () => {
    const qualityValue = parseInt(resolution.replace('p', ''));
    
    if (format === 'mp4' && qualityValue > 480) {
      setAdDuration(30);
    } else {
      setAdDuration(15);
    }
    setShowAd(true);
  };

  const handleAdComplete = () => {
    setShowAd(false);
    
    const qualityValue = parseInt(resolution.replace('p', ''));
    if (format === 'mp4' && qualityValue > 480) {
        fetch('/api/record-ad-view', { method: 'POST' });
    }

    startDownload();
  };

  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg border border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Download Your Media</CardTitle>
            <p className="text-muted-foreground">Paste a video URL to get started</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="flex-grow"
              />
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button onClick={handlePaste} variant="outline" className="flex-1 sm:flex-initial">Paste</Button>
                <Button onClick={handleFetchInfo} disabled={isFetching || !url} className="flex-1 sm:flex-initial">
                  {isFetching ? 'Fetching...' : 'Fetch Info'}
                </Button>
              </div>
            </div>

            {videoInfo && (
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
                  disabled={isPreparing || showAd}
                >
                  {isPreparing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Preparing Download...
                    </>
                  ) : (
                    `Download ${format.toUpperCase()}`
                  )}
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


// Note: The actual download is handled by the browser via a direct link to the /api/download endpoint.