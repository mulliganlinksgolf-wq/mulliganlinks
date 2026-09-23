"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, type NavItem } from "@/lib/nav";
import { MemberNavIcon } from "@/components/app/MemberNavIcon";
import s from "@/components/app/member-portal.module.css";
export default function AppBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className={s.bottomNav} aria-label="Member shortcuts">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={
            isNavItemActive(pathname, item.href, item.exact)
              ? "page"
              : undefined
          }
        >
          <MemberNavIcon href={item.href} />
          {!!item.badge && item.badge > 0 && (
            <span
              className={s.bottomBadge}
              aria-label={`${item.badge} pending requests`}
            >
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          )}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
