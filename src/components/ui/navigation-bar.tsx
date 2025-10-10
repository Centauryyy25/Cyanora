"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, ClipboardCheck, Inbox, User } from "lucide-react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type NavItem = {
  icon: IconType;
  label: string;
  href: string;
};

export const defaultNavItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/home" },
  { icon: Users, label: "Employed", href: "/employed" },
  { icon: ClipboardCheck, label: "Request", href: "/request" },
  { icon: Inbox, label: "Inbox", href: "/inbox" },
  { icon: User, label: "Profile", href: "/profile" },
];

export interface NavigationBarProps {
  className?: string;
  items?: NavItem[];
  /** Optionally set active path manually; falls back to current pathname */
  activePath?: string;
  /** Override the href for the Home item */
  homeHref?: string;
}

export default function NavigationBar({
  className,
  items = defaultNavItems,
  activePath,
  homeHref,
}: NavigationBarProps) {
  const pathname = usePathname();
  const current = activePath ?? pathname ?? "";
  const computedItems = React.useMemo(() => {
    if (!homeHref) return items;
    return items.map((it) =>
      it.label === "Home" ? { ...it, href: homeHref } : it
    );
  }, [items, homeHref]);

  return (
    <nav
      role="navigation"
      aria-label="Bottom Navigation"
      className={[
        "fixed inset-x-0 bottom-4 z-50",
        "px-4 pb-[env(safe-area-inset-bottom)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-screen-sm md:max-w-screen-md">
        <div
          className="h-14 grid grid-cols-5 place-items-center rounded-2xl border border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg"
        >
          {computedItems.map((item) => {
            const isActive =
              current === item.href ||
              (item.href !== "/" && current.startsWith(item.href + "/"));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex flex-col items-center justify-center gap-1",
                "rounded-md px-3 py-1.5",
                  "transition-colors ease-in-out duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                  isActive
                    ? "text-primary bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
