import { Link, useLocation } from "wouter";
import { Home, Compass, PlusSquare, Wallet, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Início" },
    { href: "/explore", icon: Compass, label: "Explorar" },
    { href: "/create", icon: PlusSquare, label: "Criar" },
    { href: "/wallet", icon: Wallet, label: "Carteira" },
    { href: "/profile", icon: User, label: "Perfil" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe">
      <div className="w-full max-w-md bg-background/80 backdrop-blur-xl border-t px-4 py-4 flex justify-between items-center relative">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={cn(
                  "flex flex-col items-center justify-center w-14 gap-1 cursor-pointer transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-medium tracking-wide">
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