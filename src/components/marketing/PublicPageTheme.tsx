import type { ReactNode } from "react";
import styles from "./public-pages.module.css";

/** Public marketing presentation only. Forms, content, metadata and routes stay owned by each page. */
export function PublicPageTheme({ children }: { children: ReactNode }) {
  return <div className={styles.theme}>{children}</div>;
}
