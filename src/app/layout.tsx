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
    default: "TeeAhead — Your home course, redone right.",
    template: "%s | TeeAhead",
  },
  description: "The local-first golf membership. Zero booking fees, real rewards, and every dollar goes to the courses you love — not to GolfNow.",
  metadataBase: new URL("https://teeahead.com"),
  openGraph: {
    type: "website",
    siteName: "TeeAhead",
    title: "TeeAhead — Your home course, redone right.",
    description: "The local-first golf membership. Zero booking fees, real rewards, and every dollar goes to the courses you love — not to GolfNow.",
    url: "https://teeahead.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TeeAhead" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TeeAhead — Your home course, redone right.",
    description: "The local-first golf membership. Zero booking fees, real rewards, and every dollar goes to the courses you love — not to GolfNow.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/brand/teeahead-favicon.svg", type: "image/svg+xml" },
      { url: "/brand/teeahead-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/teeahead-favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/brand/teeahead-favicon-192.png",
    other: [
      { rel: "icon", url: "/brand/teeahead-favicon-192.png", sizes: "192x192" },
      { rel: "icon", url: "/brand/teeahead-favicon-512.png", sizes: "512x512" },
    ],
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
