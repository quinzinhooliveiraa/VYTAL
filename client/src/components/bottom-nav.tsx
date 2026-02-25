import { Link, useLocation } from "wouter";
import { Home, PlusSquare, Wallet, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/create", icon: PlusSquare, label: "Create" },
    { href: "/wallet", icon: Wallet, label: "Wallet" },
    { href: "/admin", icon: ShieldAlert, label: "Admin" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe">
      <div className="w-full max-w-md bg-background/80 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex justify-between items-center relative">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={cn(
                  "flex flex-col items-center justify-center w-16 gap-1 cursor-pointer transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-white"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute -top-4 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}