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
import Login from "@/pages/login";
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
import Messages from "@/pages/messages";
import Communities from "@/pages/communities";
import CreateCommunity from "@/pages/create-community";

function Router() {
  const [location] = useLocation();
  // Check if user has logged in
  const isLoggedIn = localStorage.getItem("fitstake-user-email") !== null;
  const hasSeenOnboarding = localStorage.getItem("fitstake-onboarding-done") === "true";
  
  // If they are on root, redirect to login
  if (location === "/") {
    window.location.href = "/login";
    return null;
  }
  
  // Handle auth routing and onboarding flow
  if (location === "/login") {
    if (isLoggedIn && hasSeenOnboarding) {
       window.location.href = "/dashboard";
       return null;
    }
    return <Route path="/login" component={Login} />;
  }

  if (location === "/onboarding") {
    if (hasSeenOnboarding) {
       window.location.href = "/dashboard";
       return null;
    }
    return <Route path="/onboarding" component={Onboarding} />;
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
        <Route path="/messages/:username" component={Messages} />
        <Route path="/communities" component={Communities} />
        <Route path="/create-community" component={CreateCommunity} />
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