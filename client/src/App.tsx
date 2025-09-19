import { Toaster } from "@/components/ui/toaster";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Skeleton } from "@/components/ui/skeleton";

const HomePage = lazy(() => import("@/pages/home"));
const Donation = lazy(() => import("@/pages/donation"));

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Suspense fallback={<Skeleton className="w-full h-64" />}>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/donate" component={Donation} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
