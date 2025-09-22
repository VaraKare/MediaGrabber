import { useQuery } from "@tanstack/react-query";
import type { CharityStats } from "@shared/schema";

export default function CharityBanner() {
  const { data: stats } = useQuery<CharityStats>({
    queryKey: ["charity-stats"],
  });

  return (
    <div className="bg-secondary text-secondary-foreground py-3" data-testid="charity-banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-2 text-sm">
          <i className="fas fa-heart text-red-500"></i>
          <span data-testid="text-charity-amount">
            🎯 <strong>₹{stats?.totalRaised?.toLocaleString() || '8,000'}</strong> raised for charity this month! Every premium download helps.
          </span>
          <a href="#charity" className="underline hover:no-underline ml-2" data-testid="link-charity-learn">
            Learn more →
          </a>
        </div>
      </div>
    </div>
  );
}
