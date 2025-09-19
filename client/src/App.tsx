import { Toaster } from "@/components/ui/toaster";
import { Route, Switch } from "wouter";
import HomePage from "@/pages/home";
import Donation from "@/pages/donation";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/donate" component={Donation} />
        </Switch>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
