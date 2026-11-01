"use client";

import { cva } from "class-variance-authority";
import { CalendarDays, House, ListChecks, Sofa } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 탭 4개(screen-flow 세부 선택 ④). 설정은 홈 상단에서 들어간다.
// 같은 메뉴를 폭에 따라 CSS로만 바꾼다: 840 미만은 하단 탭바, 이상은 왼쪽 세로 메뉴.
const TABS = [
  { href: "/", label: "홈", icon: House },
  { href: "/missions", label: "미션", icon: ListChecks },
  { href: "/records", label: "기록", icon: CalendarDays },
  { href: "/room", label: "방", icon: Sofa },
] as const;

const tabItemVariants = cva(
  "flex h-(--tab-bar-height) flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-(--duration-fast) outline-none focus-visible:ring-3 focus-visible:ring-ring/50 wide:h-auto wide:min-h-16 wide:rounded-lg wide:py-2",
  {
    variants: {
      active: {
        true: "text-primary",
        false: "text-muted-foreground hover:text-foreground",
      },
    },
  },
);

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-(--z-nav) border-t bg-background pb-[env(safe-area-inset-bottom)] wide:sticky wide:top-0 wide:h-dvh wide:w-24 wide:shrink-0 wide:border-t-0 wide:border-r wide:px-2 wide:pt-6 wide:pb-0"
    >
      <ul className="grid grid-cols-4 wide:flex wide:flex-col wide:gap-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={tabItemVariants({ active })}
              >
                <Icon aria-hidden className="size-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
