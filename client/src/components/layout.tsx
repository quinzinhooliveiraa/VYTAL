import { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";

export function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-[100dvh] max-w-md mx-auto w-full bg-background relative shadow-2xl overflow-hidden sm:border-x sm:border-white/5">
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}