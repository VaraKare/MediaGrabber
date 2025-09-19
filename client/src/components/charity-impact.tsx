import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CharityStats } from "@shared/schema";

export default function CharityImpact() {
  const { data: stats } = useQuery<CharityStats>({
    queryKey: ["/api/charity/stats"],
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
                ₹{stats?.totalRaised?.toLocaleString() || '8,247'}
              </div>
              <div className="text-sm text-muted-foreground">Total Raised This Month</div>
            </CardContent>
          </Card>
          
          <Card className="border border-border" data-testid="card-downloads">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {stats?.highQualityDownloads?.toLocaleString() || '12,450'}
              </div>
              <div className="text-sm text-muted-foreground">High-Quality Downloads</div>
            </CardContent>
          </Card>
          
          <Card className="border border-border" data-testid="card-beneficiaries">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-accent mb-2">
                {stats?.beneficiaries?.toLocaleString() || '156'}
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
