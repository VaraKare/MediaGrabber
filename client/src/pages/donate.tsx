import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Load Stripe - using the Stripe integration keys
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const DonationForm = ({ amount }: { amount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/donate?success=true',
      },
    });

    if (error) {
      toast({
        title: "Donation Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Thank You!",
        description: "Your donation helps support charitable causes worldwide.",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        data-testid="button-submit-donation"
      >
        {isProcessing ? 'Processing...' : `Donate $${amount}`}
      </Button>
    </form>
  );
};

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if donations are available
  const isDonationsAvailable = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  const predefinedAmounts = [5, 10, 25, 50, 100];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedAmount(numValue);
    }
  };

  const createPaymentIntent = async () => {
    if (selectedAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: selectedAmount,
        description: 'Charitable donation via MediaHub'
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize donation. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  // Check for success parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Donation Successful!",
        description: "Thank you for your generous donation. You're making a difference!",
      });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-muted/30 py-12" data-testid="donate-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Make a Donation</h1>
          <p className="text-muted-foreground">
            Support charitable causes and help make a positive impact worldwide. 
            Every donation, no matter the size, makes a difference.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Choose Your Donation Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Predefined amounts */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Select</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {predefinedAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount && !customAmount ? "default" : "outline"}
                    onClick={() => handleAmountSelect(amount)}
                    data-testid={`button-amount-${amount}`}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <Label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">
                Custom Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-8"
                  data-testid="input-custom-amount"
                />
              </div>
            </div>

            {/* Current selection display */}
            <div className="bg-accent/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Your donation amount</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-selected-amount">
                ${selectedAmount.toFixed(2)}
              </p>
            </div>

            {/* Payment form or initialization */}
            {!isDonationsAvailable ? (
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <p className="text-muted-foreground mb-2">Donations are temporarily unavailable</p>
                <p className="text-sm text-muted-foreground">
                  We're working on setting up payment processing. Please check back soon!
                </p>
              </div>
            ) : !clientSecret ? (
              <Button 
                onClick={createPaymentIntent}
                disabled={isLoading || selectedAmount <= 0}
                className="w-full"
                data-testid="button-initialize-donation"
              >
                {isLoading ? 'Preparing...' : 'Continue to Payment'}
              </Button>
            ) : (
              stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <DonationForm amount={selectedAmount} />
                </Elements>
              )
            )}

            {/* Impact information */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-3">Your Impact</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• $5 provides clean water for one person for a month</p>
                <p>• $10 feeds a family for a day</p>
                <p>• $25 provides school supplies for a child</p>
                <p>• $50 covers medical care for someone in need</p>
                <p>• $100 supports sustainable development projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}