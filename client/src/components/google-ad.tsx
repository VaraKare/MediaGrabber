import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GoogleAdProps {
  duration: number; // Duration in seconds (15 for free, 30 for premium)
  onAdComplete: () => void;
  onCancel: () => void;
  quality: 'free' | 'premium';
}

export default function GoogleAd({ duration, onAdComplete, onCancel, quality }: GoogleAdProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);

  useEffect(() => {
    if (timeRemaining > 0 && !adCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !adCompleted) {
      setAdCompleted(true);
      setCanSkip(true);
      onAdComplete();
    }
  }, [timeRemaining, adCompleted, onAdComplete, duration]);

  const handleContinue = () => {
    if (adCompleted) {
      onAdComplete();
    }
  };

  const handleCancel = () => {
    const confirmCancel = confirm('Are you sure you want to cancel? Your downloads will not start.');
    if (confirmCancel) {
      onCancel();
    }
  };

  const progressPercentage = ((duration - timeRemaining) / duration) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" data-testid="google-ad-overlay">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Advertisement</span>
            <span className="text-sm font-normal text-muted-foreground">
              {quality === 'free' ? 'Support free downloads' : 'Support charity'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Ad Placeholder - In production, this would be replaced with actual Google AdSense */}
          <div className="bg-muted border-2 border-dashed border-border rounded-lg p-8 text-center min-h-[250px] flex flex-col items-center justify-center" data-testid="google-ad-content">
            <div className="text-muted-foreground mb-4">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Google Ad Content</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This space will display Google AdSense advertisements
            </p>
            <div className="text-xs text-muted-foreground bg-muted-foreground/10 px-3 py-2 rounded">
              🌍 Your {quality} download helps {quality === 'free' ? 'keep our service free' : 'support charitable causes'}
            </div>
          </div>

          {/* Ad Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Ad Progress</span>
              <span data-testid="ad-time-remaining">{timeRemaining}s remaining</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              data-testid="button-cancel-ad"
            >
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleContinue}
              disabled={!adCompleted}
              data-testid="button-continue-download"
            >
              {adCompleted ? 'Continue to Download' : `Please wait ${timeRemaining}s`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}