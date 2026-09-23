import type { ReactNode } from "react";
import s from "./course-portal.module.css";

export function CoursePageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className={s.pageHeader}>
      <div className={s.headerCopy}>
        <p className={s.headerEyebrow}>Your course. Your call.</p>
        <h1 className={s.headerTitle}>{title}</h1>
        {subtitle && <p className={s.headerSubtitle}>{subtitle}</p>}
      </div>
      {action && <div className={s.headerActions}>{action}</div>}
    </header>
  );
}
