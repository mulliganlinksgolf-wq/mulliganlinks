import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { StructuredData } from "@/components/StructuredData";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "TeeAhead | Free Golf Tee Time Booking & Loyalty App — Metro Detroit",
    template: "%s | TeeAhead",
  },
  description:
    "Book tee times at Metro Detroit golf courses with zero booking fees. Earn Fairway Points and save $40/yr vs GolfPass+ with TeeAhead Eagle membership. Free for courses, always.",
  metadataBase: new URL("https://www.teeahead.com"),
  openGraph: {
    type: "website",
    url: "https://www.teeahead.com",
    title: "TeeAhead | Free Golf Tee Time Booking & Loyalty — Metro Detroit",
    description:
      "Book tee times at Metro Detroit golf courses with zero booking fees. Beat GolfPass+ with Eagle membership at $79/yr.",
    siteName: "TeeAhead",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TeeAhead — Free golf tee time booking and loyalty for Metro Detroit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TeeAhead | Golf Tee Times & Loyalty — Metro Detroit",
    description:
      "Zero booking fees. Beat GolfPass+ for $40 less. Free for partner courses.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://www.teeahead.com",
  },
  verification: {
    google: "UMxgTah2fiIao60gzONoz4OVsdiAu7LUxat6FO_5-a8",
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
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StructuredData />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
