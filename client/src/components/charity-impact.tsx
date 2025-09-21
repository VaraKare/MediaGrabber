import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CharityStats as CharityStatsType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface CharityStats extends CharityStatsType {
  highQualityDownloads?: number | null;
}

// Helper to format currency
const formatCurrency = (amount: number) => {
  // API returns cents, so divide by 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount / 100);
};

export default function CharityImpact() {
  const { data: stats, isLoading } = useQuery<CharityStats>({
    queryKey: ["/api/charity/stats"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/charity/stats`);
      if (!response.ok) {
        throw new Error("Failed to fetch charity stats.");
      }
      return response.json();
    },
  });

  return (
    <section id="charity" className="py-16 bg-secondary/5" data-testid="charity-impact">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-3xl font-bold text-foreground mb-6">Our Charitable Impact</h3>
        <p className="text-xl text-muted-foreground mb-8">
          50% of the revenue from high-quality downloads goes to charity. Track our collective impact and see the difference we're making together.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-border" data-testid="card-total-raised">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-secondary mb-2">
                {isLoading ? <Skeleton className="h-8 w-3/4 mx-auto" /> : <span>{stats?.totalRaised ? formatCurrency(stats.totalRaised) : '₹0.00'}</span>}
              </div>
              <div className="text-sm text-muted-foreground">Total Raised This Month</div>
            </CardContent>
          </Card>
          
          <Card className="border border-border" data-testid="card-downloads">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {isLoading ? <Skeleton className="h-8 w-1/2 mx-auto" /> : <span>{stats?.premiumDownloads?.toLocaleString() || '0'}</span>}
              </div>
              <div className="text-sm text-muted-foreground">High-Quality Downloads</div>
            </CardContent>
          </Card>
          
          <Card className="border border-border" data-testid="card-beneficiaries">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-accent mb-2">
                {isLoading ? <Skeleton className="h-8 w-1/2 mx-auto" /> : <span>{stats?.beneficiaries?.toLocaleString() || '0'}</span>}
              </div>
              <div className="text-sm text-muted-foreground">Lives Impacted</div>
            </CardContent>
          </Card>
        </div>
        
        <Button className="bg-secondary text-secondary-foreground hover:opacity-90" data-testid="button-donation-reports">
          View Donation Reports
        </Button>
      </div>
    </section>
  );
}
