"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Users,
  CreditCard,
  LayoutDashboard,
  ChartNoAxesCombined,
  Mail,
  Flag,
  ArrowLeftRight,
  ReceiptText,
  Settings2,
  BookOpen,
  ArrowUpRight,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { TeeAheadLogo } from "@/components/TeeAheadLogo";
import s from "./course-portal.module.css";

type NavItem = {
  path: string;
  icon: LucideIcon;
  label: string;
  managerOnly?: boolean;
};
const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Day to day",
    items: [
      { path: "", icon: CalendarDays, label: "Tee sheet" },
      { path: "check-in", icon: CircleCheck, label: "Check-in" },
      { path: "bookings", icon: ClipboardList, label: "Bookings" },
      { path: "members", icon: Users, label: "Members" },
    ],
  },
  {
    label: "Your business",
    items: [
      {
        path: "dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        managerOnly: true,
      },
      {
        path: "payments",
        icon: CreditCard,
        label: "Payments",
        managerOnly: true,
      },
      {
        path: "reports",
        icon: ChartNoAxesCombined,
        label: "Reports",
        managerOnly: true,
      },
      { path: "marketing", icon: Mail, label: "Marketing", managerOnly: true },
      { path: "leagues", icon: Flag, label: "Leagues", managerOnly: true },
      {
        path: "trading",
        icon: ArrowLeftRight,
        label: "Trading",
        managerOnly: true,
      },
    ],
  },
  {
    label: "Course essentials",
    items: [
      {
        path: "billing",
        icon: ReceiptText,
        label: "Billing",
        managerOnly: true,
      },
      {
        path: "settings",
        icon: Settings2,
        label: "Settings",
        managerOnly: true,
      },
      { path: "help", icon: BookOpen, label: "Knowledge base" },
    ],
  },
];

export function CourseSidebar({
  slug,
  courseName,
  role,
  isManager,
  userInitials,
  userName,
}: {
  slug: string;
  courseName: string;
  role: string;
  isManager: boolean;
  userInitials: string;
  userName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = `/course/${slug}`;
  return (
    <aside className={s.sidebar}>
      <div className={s.brandRow}>
        <Link
          href="/app"
          aria-label="TeeAhead golfer app"
          className={s.brandLink}
        >
          <TeeAheadLogo className={s.logo} />
        </Link>
        <button
          type="button"
          className={s.menuButton}
          aria-label={open ? "Close course menu" : "Open course menu"}
          aria-expanded={open}
          aria-controls="course-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X size={21} aria-hidden="true" />
          ) : (
            <Menu size={21} aria-hidden="true" />
          )}
        </button>
      </div>
      <div
        id="course-navigation"
        className={s.navigation}
        data-open={open}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            event.currentTarget.parentElement
              ?.querySelector<HTMLButtonElement>("button")
              ?.focus();
          }
        }}
      >
        <div className={s.courseCard}>
          <p className={s.courseEyebrow}>
            <span aria-hidden="true" /> Course portal
          </p>
          <p className={s.courseName}>{courseName}</p>
        </div>
        <nav aria-label="Course navigation" className={s.navGroups}>
          {groups.map((group) => {
            const items = group.items.filter(
              (item) => !item.managerOnly || isManager,
            );
            if (!items.length) return null;
            return (
              <div key={group.label} className={s.navGroup}>
                <p className={s.groupLabel}>{group.label}</p>
                {items.map(({ path, icon: Icon, label }) => {
                  const href = path ? `${base}/${path}` : base;
                  const active = path
                    ? pathname === href || pathname.startsWith(`${href}/`)
                    : pathname === base ||
                      pathname.startsWith(`${base}/tee-times/`);
                  return (
                    <Link
                      key={label}
                      href={href}
                      className={s.navLink}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                      <span>{label}</span>
                      {active && (
                        <span className={s.activeMark} aria-hidden="true" />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className={s.sidebarFooter}>
          <div className={s.userRow}>
            <div className={s.avatar} aria-hidden="true">
              {userInitials}
            </div>
            <div>
              <p className={s.userName}>{userName}</p>
              <p className={s.userRole}>{role.replaceAll("_", " ")}</p>
            </div>
          </div>
          <Link href="/" className={s.siteLink}>
            Visit TeeAhead <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
