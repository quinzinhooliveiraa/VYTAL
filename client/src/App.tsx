import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";

// Layouts
import { MobileLayout } from "@/components/layout";

// Pages
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Explore from "@/pages/explore";
import CreateChallenge from "@/pages/create-challenge";
import ChallengeDetails from "@/pages/challenge-details";
import CheckIn from "@/pages/check-in";
import Profile from "@/pages/profile";
import PublicProfile from "@/pages/public-profile";
import Friends from "@/pages/friends";
import Wallet from "@/pages/wallet";

import Settings from "@/pages/settings";

function Router() {
  const [location] = useLocation();
  // Check if user has seen onboarding (mock logic for demo)
  const hasSeenOnboarding = localStorage.getItem("fitstake-onboarding-done") === "true";
  
  // If they are on root, redirect appropriately based on onboarding status
  const isAuthRoute = location === "/";

  if (isAuthRoute) {
    if (hasSeenOnboarding) {
      // Small hack to redirect without rendering a component
      window.location.href = "/dashboard";
      return null;
    }
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
        <Route path="/explore" component={Explore} />
        <Route path="/create" component={CreateChallenge} />
        <Route path="/challenge/:id" component={ChallengeDetails} />
        <Route path="/check-in/:id" component={CheckIn} />
        <Route path="/wallet" component={Wallet} />
        <Route path="/profile" component={Profile} />
        <Route path="/settings" component={Settings} />
        <Route path="/user/:username" component={PublicProfile} />
        <Route path="/friends" component={Friends} />
        <Route component={NotFound} />
      </Switch>
    </MobileLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="fitstake-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;