
import React, { Suspense, lazy } from "react";
import { Router, Route, Switch } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";

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
