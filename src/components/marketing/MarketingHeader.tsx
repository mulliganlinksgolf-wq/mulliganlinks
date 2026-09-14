"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { TeeAheadLogo } from "@/components/TeeAheadLogo";
import s from "./marketing.module.css";
export function MarketingHeader({
  forCourses = false,
}: {
  forCourses?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className={s.header}>
      <Link href="/" aria-label="TeeAhead home">
        <TeeAheadLogo className={s.logo} priority />
      </Link>
      <nav className={s.desktopNav} aria-label="Main navigation">
        <Link href="/features">Features</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/about">Our story</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <nav className={s.audienceActions} aria-label="Choose your audience">
        <Link href="/waitlist/golfer" className={s.golferAction}>
          I’m a golfer <ArrowUpRight size={15} />
        </Link>
        <Link
          href={forCourses ? "/waitlist/course" : "/for-courses"}
          className={s.courseAction}
        >
          I run a course <ArrowUpRight size={15} />
        </Link>
      </nav>
      <button
        className={s.menuButton}
        aria-expanded={open}
        aria-controls="marketing-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav
          id="marketing-menu"
          className={s.mobileNav}
          aria-label="Mobile navigation"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <Link onClick={() => setOpen(false)} href="/#golfers">
            For golfers
          </Link>
          <Link href="/for-courses">For courses</Link>
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">Our story</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/waitlist/golfer">Join the waitlist</Link>
        </nav>
      )}
    </header>
  );
}
