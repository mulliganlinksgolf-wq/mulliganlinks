"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Menu, X, LogOut, ArrowUpRight } from "lucide-react";
import { TeeAheadLogo } from "@/components/TeeAheadLogo";
import { MemberNavIcon } from "@/components/app/MemberNavIcon";
import { isNavItemActive, type NavItem } from "@/lib/nav";
import s from "@/components/app/member-portal.module.css";
const playRoutes = [
  "/app",
  "/app/courses",
  "/app/bookings",
  "/app/partners",
  "/app/leagues",
  "/app/trading",
];
export default function AppSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const groups = [
    {
      label: "Get out and play",
      items: items.filter((item) => playRoutes.includes(item.href)),
    },
    {
      label: "Your membership",
      items: items.filter((item) => !playRoutes.includes(item.href)),
    },
  ];
  return (
    <aside className={s.sidebar}>
      <div className={s.brandRow}>
        <Link
          href="/app"
          aria-label="TeeAhead member home"
          onClick={() => setOpen(false)}
        >
          <TeeAheadLogo className={s.logo} />
        </Link>
        <button
          ref={toggle}
          type="button"
          className={s.menuButton}
          aria-label={open ? "Close member menu" : "Open member menu"}
          aria-expanded={open}
          aria-controls="member-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <div
        id="member-navigation"
        className={s.navigation}
        data-open={open}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            toggle.current?.focus();
          }
        }}
      >
        <div className={s.memberCard}>
          <span>Good days start on the course.</span>
          <p>Make time for your game.</p>
        </div>
        <nav aria-label="Member navigation" className={s.navGroups}>
          {groups.map((group) => (
            <div className={s.navGroup} key={group.label}>
              <p className={s.groupLabel}>{group.label}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={s.navLink}
                  aria-current={
                    isNavItemActive(pathname, item.href, item.exact)
                      ? "page"
                      : undefined
                  }
                  onClick={() => setOpen(false)}
                >
                  <MemberNavIcon href={item.href} />
                  <span>{item.label}</span>
                  {!!item.badge && item.badge > 0 && (
                    <span
                      className={s.badge}
                      aria-label={`${item.badge} pending requests`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className={s.footer}>
          <Link href="/" className={s.siteLink}>
            Visit TeeAhead <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className={s.signOut}>
              <LogOut size={17} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
