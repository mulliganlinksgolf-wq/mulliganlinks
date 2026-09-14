import { PublicPageTheme } from "@/components/marketing/PublicPageTheme";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicPageTheme>{children}</PublicPageTheme>;
}
