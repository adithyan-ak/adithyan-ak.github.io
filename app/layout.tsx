import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import { pageAlternates } from "@/lib/seo";
import { SITE } from "@/lib/site";
import "./globals.css";

const body = Newsreader({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
