
import React, { Suspense, lazy } from "react";
import { Router, Route, Switch } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import FacebookDownloaderPage from "./pages/FacebookDownloaderPage";
import TwitterDownloaderPage from "./pages/TwitterDownloaderPage";
import InstagramDownloaderPage from "./pages/InstagramDownloaderPage";
import TikTokDownloaderPage from "./pages/TikTokDownloaderPage";
import YouTubeDownloaderPage from "./pages/YouTubeDownloaderPage";

const Home = lazy(() => import("./pages/home"));
const Donate = lazy(() => import("./pages/donate"));
const Donation = lazy(() => import("./pages/donation"));
const NotFound = lazy(() => import("./pages/not-found"));

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Suspense fallback={<div>Loading...</div>}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/donate" component={Donate} />
              <Route path="/donation" component={Donation} />
              <Route path="/youtube-downloader" component={YouTubeDownloaderPage} />
              <Route path="/tiktok-downloader" component={TikTokDownloaderPage} />
              <Route path="/instagram-downloader" component={InstagramDownloaderPage} />
              <Route path="/twitter-downloader" component={TwitterDownloaderPage} />
              <Route path="/facebook-downloader" component={FacebookDownloaderPage} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
