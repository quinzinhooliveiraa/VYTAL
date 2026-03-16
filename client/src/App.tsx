import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";

import { MobileLayout } from "@/components/layout";

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
import ChatHub from "@/pages/chat-hub";
import Admin from "@/pages/admin";
import Partner from "@/pages/partner";

function Router() {
  const [location] = useLocation();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAuthenticated = !!user;
  const hasSeenOnboarding = localStorage.getItem("fitstake-onboarding-done") === "true";

  if (location === "/") {
    if (isAuthenticated && hasSeenOnboarding) return <Redirect to="/dashboard" />;
    return <Redirect to="/login" />;
  }

  if (location === "/login" && isAuthenticated && hasSeenOnboarding) {
    return <Redirect to="/dashboard" />;
  }

  if (location === "/login" || location === "/onboarding") {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/onboarding" component={Onboarding} />
      </Switch>
    );
  }

  if (!isAuthenticated && location.startsWith("/challenge/")) {
    return (
      <Switch>
        <Route path="/challenge/:id" component={ChallengeDetails} />
      </Switch>
    );
  }

  if (!isAuthenticated) {
    if (location !== "/" && location !== "/login") {
      sessionStorage.setItem("vytal-redirect", location);
    }
    return <Redirect to="/login" />;
  }

  if (isAuthenticated && !hasSeenOnboarding) {
    return <Redirect to="/onboarding" />;
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
        <Route path="/chat-hub" component={ChatHub} />
        <Route path="/communities" component={Communities} />
        <Route path="/create-community" component={CreateCommunity} />
        <Route path="/partner" component={Partner} />
        <Route path="/admin" component={Admin} />
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
