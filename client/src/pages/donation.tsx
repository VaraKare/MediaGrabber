import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the types for the data we expect from the API
interface DonationData {
  totalDonations: number;
}

export default function Donation() {
  const [donationData, setDonationData] = useState<DonationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        // The base URL will be picked up from the VITE_API_BASE_URL environment variable
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/donations`);
        if (!response.ok) {
          throw new Error('Failed to fetch donations');
        }
        const data: DonationData = await response.json();
        setDonationData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto text-center p-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Thank You for Your Support!</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Every contribution, big or small, helps us keep MediaHub running and supports our partner charities.
          We are incredibly grateful for your generosity.
        </p>

        <Card className="mb-12 text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Total Donations To Date</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-4xl font-bold">Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {donationData && (
              <p className="text-5xl font-bold gradient-text">
                {formatCurrency(donationData.totalDonations)}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Link href="/" className="mt-12 inline-block">
          <Button className="bg-primary text-primary-foreground text-lg px-8 py-6">
            <i className="fas fa-home mr-2"></i>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
