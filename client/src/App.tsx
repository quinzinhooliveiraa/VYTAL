import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Layouts
import { MobileLayout } from "@/components/layout";

// Pages
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import CreateChallenge from "@/pages/create-challenge";
import ChallengeDetails from "@/pages/challenge-details";
import CheckIn from "@/pages/check-in";
import Wallet from "@/pages/wallet";
import Admin from "@/pages/admin";

function Router() {
  const [location] = useLocation();
  const isAuthRoute = location === "/";

  if (isAuthRoute) {
    return (
      <Switch>
        <Route path="/" component={Onboarding} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <MobileLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/create" component={CreateChallenge} />
        <Route path="/challenge/:id" component={ChallengeDetails} />
        <Route path="/check-in/:id" component={CheckIn} />
        <Route path="/wallet" component={Wallet} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </MobileLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;