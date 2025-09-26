import { Suspense, lazy } from "react";
import CharityBanner from "@/components/charity-banner";
import DownloadInterface from "@/components/download-interface";
import AdPlacement from "@/components/ad-placement";

const FeaturesSection = lazy(() => import("@/components/features-section"));
const CharityImpact = lazy(() => import("@/components/charity-impact"));

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <CharityBanner />
      
      {/* Hero Section */}
      <section className="py-12 lg:py-20" data-testid="hero-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
            Download from <span className="bg-gradient-text">Anywhere</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Free downloads from YouTube, Instagram, Twitter, and more. Every download contributes to charity.
          </p>
          
          {/* Platform Support Icons */}
          <div className="flex justify-center flex-wrap gap-4 sm:gap-8 mb-12" data-testid="platform-icons">
            <div className="flex flex-col items-center">
              <div className="bg-red-500 p-3 rounded-full mb-2">
                <i className="fab fa-youtube text-white text-xl"></i>
              </div>
              <span className="text-sm text-muted-foreground">YouTube</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full mb-2">
                <i className="fab fa-instagram text-white text-xl"></i>
              </div>
              <span className="text-sm text-muted-foreground">Instagram</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-black p-3 rounded-full mb-2">
                <i className="fab fa-twitter text-white text-xl"></i>
              </div>
              <span className="text-sm text-muted-foreground">Twitter/X</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-blue-600 p-3 rounded-full mb-2">
                <i className="fab fa-facebook text-white text-xl"></i>
              </div>
              <span className="text-sm text-muted-foreground">Facebook</span>
            </div>
             <div className="flex flex-col items-center">
              <div className="bg-black p-3 rounded-full mb-2">
                <i className="fab fa-tiktok text-white text-xl"></i>
              </div>
              <span className="text-sm text-muted-foreground">TikTok</span>
            </div>
             <div className="flex flex-col items-center">
              <div className="bg-gray-800 p-3 rounded-full mb-2">
                <i className="fas fa-video text-white text-xl"></i>
              </div>
              <span className="text-sm text-muted-foreground">Dailymotion</span>
            </div>
          </div>
        </div>
      </section>

      <DownloadInterface />
      <AdPlacement />
      <Suspense fallback={<div>Loading...</div>}>
        <FeaturesSection />
        <CharityImpact />
      </Suspense>
    </div>
  );
}

