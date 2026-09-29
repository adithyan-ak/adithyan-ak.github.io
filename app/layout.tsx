import type { Metadata } from "next";
import localFont from "next/font/local";
import { pageAlternates } from "@/lib/seo";
import { SITE } from "@/lib/site";
import "./globals.css";

const body = localFont({
  variable: "--font-body",
  adjustFontFallback: "Times New Roman",
  display: "swap",
  src: [
    {
      path: "./fonts/newsreader/Newsreader[opsz,wght].woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "./fonts/newsreader/Newsreader-Italic[opsz,wght].woff2",
      weight: "400 700",
      style: "italic",
    },
  ],
});

const mono = localFont({
  variable: "--font-mono",
  display: "swap",
  src: [
    {
      path: "./fonts/ibmplexmono/IBMPlexMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ibmplexmono/IBMPlexMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/ibmplexmono/IBMPlexMono-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  applicationName: SITE.name,
  title: {
    default: SITE.title,
    template: "%s",
  },
  description: SITE.description,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: pageAlternates("/"),
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    url: "/",
    title: SITE.title,
    description: SITE.description,
    images: [
      {
        url: "/og-dossier.png",
        width: 1731,
        height: 909,
        alt: "Declassified research dossier for Adithyan Arun Kumar, Agentic Security Researcher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: ["/og-dossier.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
