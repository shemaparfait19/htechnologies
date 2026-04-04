'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  Boxes,
  Users,
  ShoppingCart,
  BarChart3,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navItems = [
    { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard },
    { href: '/repairs', label: 'repairs', icon: Wrench },
    { href: '/sales', label: 'sales', icon: ShoppingCart },
    { href: '/inventory', label: 'inventory', icon: Boxes },
    { href: '/customers', label: 'customers', icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 px-1 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span className="text-[10px] font-medium truncate max-w-[60px]">
                {t(item.label as any)}
              </span>
            </Link>
          );
        })}
        {/* Appointments and Reports could be in a 'More' menu if needed, 
            but for now we fit 5 core items. Appointments is key, maybe swap with Customers? 
            Let's keep these 5 for now as they are the main actions. */}
      </div>
    </div>
  );
}
