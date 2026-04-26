import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MulliganLinks — Your home course, redone right.",
    template: "%s | MulliganLinks",
  },
  description: "The local-first golf membership. Zero booking fees, real rewards, and every dollar goes to the courses you love — not to GolfNow.",
  metadataBase: new URL("https://mulliganlinks.com"),
  openGraph: {
    type: "website",
    siteName: "MulliganLinks",
    title: "MulliganLinks — Your home course, redone right.",
    description: "The local-first golf membership. Zero booking fees, real rewards, and every dollar goes to the courses you love — not to GolfNow.",
    url: "https://mulliganlinks.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MulliganLinks" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MulliganLinks — Your home course, redone right.",
    description: "The local-first golf membership. Zero booking fees, real rewards, and every dollar goes to the courses you love — not to GolfNow.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
