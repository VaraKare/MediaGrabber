import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CharityStats as CharityStatsType } from "@/types/download";
import { Skeleton } from "@/components/ui/skeleton";

// Helper to format currency
const formatCurrency = (amount: number) => {
  // Assuming API returns whole numbers for currency
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function CharityImpact() {
  const { data: stats, isLoading } = useQuery<CharityStatsType>({
    queryKey: ["/api/donations"], // Updated query key to match new endpoint
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
                {isLoading ? <Skeleton className="h-8 w-3/4 mx-auto" /> : <span>{stats?.totalDonations ? formatCurrency(stats.totalDonations) : '₹0'}</span>}
              </div>
              <div className="text-sm text-muted-foreground">Total Raised This Month</div>
            </CardContent>
          </Card>
          
          <Card className="border border-border" data-testid="card-donors">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {isLoading ? <Skeleton className="h-8 w-1/2 mx-auto" /> : <span>{stats?.donorCount?.toLocaleString() || '10'}</span>}
              </div>
              <div className="text-sm text-muted-foreground">Donors This Month</div>
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
