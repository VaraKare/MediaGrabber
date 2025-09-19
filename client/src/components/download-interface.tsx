import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { validateURL } from "@/lib/url-validator";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import GoogleAd from "@/components/google-ad";
import type { Download } from "@shared/schema";
import type { DownloadRequest } from "@/types/download";

export default function DownloadInterface() {
  const [urls, setUrls] = useState(['', '', '']);
  const [selectedQuality, setSelectedQuality] = useState<'free' | 'premium'>('free');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [resolution, setResolution] = useState<
    '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p'
  >('480p');
  const [activeDownloads, setActiveDownloads] = useState<string[]>([]);
  const [showAd, setShowAd] = useState(false);
  const [pendingDownloads, setPendingDownloads] = useState<DownloadRequest[]>([]);
  const { toast } = useToast();

  const createDownloadMutation = useMutation({
    mutationFn: async (downloadData: DownloadRequest) => {
      const response = await apiRequest('POST', '/api/downloads', downloadData);
      return response.json();
    },
    onSuccess: (download: Download) => {
      setActiveDownloads(prev => [...prev, download.id]);
      toast({
        title: "Download Started",
        description: "Your download is being processed...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to start download",
        variant: "destructive",
      });
    }
  });

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleDownload = async () => {
    const validUrls = urls.filter(url => url.trim() !== '');
    
    if (validUrls.length === 0) {
      toast({
        title: "No URLs Provided",
        description: "Please enter at least one URL to download",
        variant: "destructive",
      });
      return;
    }

    const validations = validUrls.map(url => validateURL(url));
    const invalidUrls = validations.filter(v => !v.isValid);
    
    if (invalidUrls.length > 0) {
      toast({
        title: "Invalid URLs",
        description: invalidUrls[0].error,
        variant: "destructive",
      });
      return;
    }

    const downloadRequests: DownloadRequest[] = [];
    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      const validation = validations[i];
      
      if (validation.isValid && validation.platform) {
        if (validation.platform !== 'youtube') {
          toast({
            title: 'Coming soon',
            description: `${validation.platform} downloads are coming soon. Please use a YouTube URL for now.`,
          });
          continue;
        }
        downloadRequests.push({
          url,
          platform: validation.platform,
          quality: selectedQuality,
          format,
          resolution: format === 'mp4' ? resolution : undefined,
        });
      }
    }

    setPendingDownloads(downloadRequests);
    setShowAd(true);
  };

  const handleAdComplete = () => {
    setShowAd(false);
    pendingDownloads.forEach(downloadData => {
      createDownloadMutation.mutate(downloadData);
    });
    setPendingDownloads([]);
  };

  const handleAdCancel = () => {
    setShowAd(false);
    setPendingDownloads([]);
    toast({
      title: "Downloads Cancelled",
      description: "Your download requests were cancelled.",
    });
  };

  const highResSet = new Set(['720p','1080p','1440p','2160p']);
  const adSeconds = format === 'mp4' && highResSet.has(resolution) ? 30 : 15;

  return (
    <section className="py-12 bg-muted/30" data-testid="download-interface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg border border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Download Your Media</CardTitle>
            <p className="text-muted-foreground">Paste up to 3 URLs and choose your preferred quality</p>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="relative">
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    URL #{index + 1} {index === 0 ? 
                      <span className="text-muted-foreground">(YouTube, Instagram, Twitter, TikTok)</span> : 
                      <span className="text-muted-foreground">(Optional)</span>
                    }
                  </Label>
                  <div className="relative">
                    <Input
                      type="url"
                      placeholder={
                        index === 0 ? "https://youtube.com/watch?v=..." :
                        index === 1 ? "https://instagram.com/p/..." :
                        "https://tiktok.com/@user/video/..."
                      }
                      value={urls[index]}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      className="pr-12"
                      data-testid={`input-url-${index + 1}`}
                    />
                    {urls[index] && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {validateURL(urls[index]).isValid ? (
                          <i className="fas fa-check-circle text-secondary" data-testid={`icon-valid-${index + 1}`}></i>
                        ) : validateURL(urls[index]).comingSoon ? (
                          <i className="fas fa-rocket text-orange-500" data-testid={`icon-coming-soon-${index + 1}`} title="Coming soon!"></i>
                        ) : (
                          <i className="fas fa-exclamation-circle text-destructive" data-testid={`icon-invalid-${index + 1}`}></i>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-foreground">Choose Format & Resolution</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Format</Label>
                  <div className="flex gap-2">
                    <Button variant={format === 'mp4' ? 'default' : 'outline'} onClick={() => setFormat('mp4')}>MP4</Button>
                    <Button variant={format === 'mp3' ? 'default' : 'outline'} onClick={() => setFormat('mp3')}>MP3</Button>
                  </div>
                </div>
                {format === 'mp4' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Resolution</Label>
                    <select
                      className="w-full border rounded px-3 py-2 bg-background"
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as typeof resolution)}
                    >
                      {['144p','240p','360p','480p','720p','1080p','1440p','2160p'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm">Tier</Label>
                  <div className="flex gap-2">
                    <Button variant={selectedQuality === 'free' ? 'default' : 'outline'} onClick={() => setSelectedQuality('free')}>Free</Button>
                    <Button variant={selectedQuality === 'premium' ? 'default' : 'outline'} onClick={() => setSelectedQuality('premium')}>Premium</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Ads: {adSeconds}s {format === 'mp4' && highResSet.has(resolution) ? '(high resolution)' : '(standard)'}</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full py-4 text-lg"
              onClick={handleDownload}
              disabled={createDownloadMutation.isPending || urls.every(url => url.trim() === '') || showAd}
              data-testid="button-start-download"
            >
              <i className="fas fa-download mr-2"></i>
              {createDownloadMutation.isPending ? 'Starting Download...' : 'Start Download'}
            </Button>

            {activeDownloads.length > 0 && (
              <DownloadProgress downloadIds={activeDownloads} />
            )}
          </CardContent>
        </Card>
      </div>
      
      {showAd && (
        <GoogleAd 
          duration={adSeconds}
          onAdComplete={handleAdComplete}
          onCancel={handleAdCancel}
          quality={selectedQuality}
        />
      )}
    </section>
  );
}

function DownloadProgress({ downloadIds }: { downloadIds: string[] }) {
  return (
    <div className="space-y-4" data-testid="download-progress">
      <h4 className="text-lg font-medium text-foreground">Download Progress</h4>
      {downloadIds.map((id) => (
        <DownloadItem key={id} downloadId={id} />
      ))}
    </div>
  );
}

function DownloadItem({ downloadId }: { downloadId: string }) {
  const { data: download } = useQuery<Download>({
    queryKey: ["/api/downloads", downloadId],
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return (status === 'pending' || status === 'processing') ? 1000 : false;
    },
  });

  useEffect(() => {
    if (download?.status === 'completed') {
      queryClient.invalidateQueries({ queryKey: ["/api/charity/stats"] });
    }
  }, [download?.status]);

  if (!download) return null;

  return (
    <div className="bg-muted rounded-lg p-4" data-testid={`download-item-${downloadId}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground" data-testid={`text-title-${downloadId}`}>
          {download.title || 'Processing...'}
        </span>
        <span className="text-sm text-muted-foreground" data-testid={`text-progress-${downloadId}`}>
          {download.progress}%
        </span>
      </div>
      <Progress value={download.progress} className="h-2" />
      {download.status === 'completed' && download.downloadUrl && (
        <div className="mt-2">
          <Button size="sm" asChild data-testid={`button-download-${downloadId}`}>
            <a href={download.downloadUrl} download>
              <i className="fas fa-download mr-2"></i>
              Download File
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
