import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { validateURL } from "@/lib/url-validator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GoogleAd from "@/components/google-ad";
import type { Download } from "@shared/schema";
import type { DownloadRequest } from "@/types/download";

export default function DownloadInterface() {
  const [urls, setUrls] = useState(['', '', '']);
  const [selectedQuality, setSelectedQuality] = useState<'free' | 'premium'>('free');
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

    // Validate URLs
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

    // Prepare download requests
    const downloadRequests: DownloadRequest[] = [];
    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      const validation = validations[i];
      
      if (validation.isValid && validation.platform) {
        downloadRequests.push({
          url,
          platform: validation.platform,
          quality: selectedQuality,
        });
      }
    }

    // Store pending downloads and show ad
    setPendingDownloads(downloadRequests);
    setShowAd(true);
  };

  const handleAdComplete = () => {
    setShowAd(false);
    // Process all pending downloads after ad completion
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

  return (
    <section className="py-12 bg-muted/30" data-testid="download-interface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg border border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Download Your Media</CardTitle>
            <p className="text-muted-foreground">Paste up to 3 URLs and choose your preferred quality</p>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* URL Input Fields */}
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

            {/* Quality Selector */}
            <div>
              <h4 className="text-lg font-medium text-foreground mb-4">Choose Quality</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Free Quality Option */}
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedQuality === 'free' 
                      ? 'border-ring bg-accent/5' 
                      : 'border-border hover:border-ring'
                  }`}
                  onClick={() => setSelectedQuality('free')}
                  data-testid="option-quality-free"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-foreground">Free Quality</h5>
                    <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium">
                      FREE
                    </span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Video: 480p MP4</li>
                    <li>• Audio: 128kbps MP3</li>
                    <li>• Watch 15s Google ad</li>
                    <li>• Helps keep service free</li>
                  </ul>
                </div>
                
                {/* Premium Quality Option */}
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedQuality === 'premium' 
                      ? 'border-accent bg-accent/5 border-2' 
                      : 'border-accent hover:border-accent/80 bg-accent/5'
                  }`}
                  onClick={() => setSelectedQuality('premium')}
                  data-testid="option-quality-premium"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-foreground">Premium Quality</h5>
                    <span className="bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-medium">
                      PREMIUM
                    </span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Video: 720p, 1080p MP4</li>
                    <li>• Audio: 320kbps MP3</li>
                    <li>• Watch 30s ad</li>
                    <li>• Supports charity</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <Button 
              className="w-full py-4 text-lg"
              onClick={handleDownload}
              disabled={createDownloadMutation.isPending || urls.every(url => url.trim() === '') || showAd}
              data-testid="button-start-download"
            >
              <i className="fas fa-download mr-2"></i>
              {createDownloadMutation.isPending ? 'Starting Download...' : 'Start Download'}
            </Button>

            {/* Progress Section */}
            {activeDownloads.length > 0 && (
              <DownloadProgress downloadIds={activeDownloads} />
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Google Ad Modal */}
      {showAd && (
        <GoogleAd 
          duration={selectedQuality === 'free' ? 15 : 30}
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
      // Poll every 1000ms for pending and processing downloads
      // Stop polling when completed, failed, or no data
      return (status === 'pending' || status === 'processing') ? 1000 : false;
    },
  });

  // Track completion of premium downloads for charity stats invalidation
  useEffect(() => {
    if (download?.status === 'completed' && download.quality === 'premium') {
      // Invalidate charity stats cache when a premium download completes
      queryClient.invalidateQueries({ queryKey: ["/api/charity/stats"] });
    }
  }, [download?.status, download?.quality]);

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
