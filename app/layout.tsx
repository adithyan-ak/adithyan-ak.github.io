import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
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
  metadataBase: new URL("https://adithyanak.com"),
  title: {
    default: "Declassified Dossier — Adithyan Arun Kumar",
    template: "%s",
  },
  description:
    "The public research dossier of agentic security researcher Adithyan Arun Kumar.",
  authors: [{ name: "Adithyan Arun Kumar", url: "https://adithyanak.com" }],
  creator: "Adithyan Arun Kumar",
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Adithyan Arun Kumar",
    title: "Declassified Dossier — Adithyan Arun Kumar",
    description:
      "Agentic security research, open-source systems, advisories, and field notes.",
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
    title: "Declassified Dossier — Adithyan Arun Kumar",
    description:
      "Agentic security research, open-source systems, advisories, and field notes.",
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
