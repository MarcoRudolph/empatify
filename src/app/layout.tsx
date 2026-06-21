import type { Metadata } from "next";
import { Unbounded, Outfit } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.empatify.de";

const socialPreview = "/og/empatify-preview.png";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Empatify — Pick songs your friends will love",
  description: "Join a multiplayer music game: choose tracks, match your friends' taste, and see who is the best curator.",
  openGraph: {
    title: "Empatify — Pick songs your friends will love",
    description: "Join the lobby, match the group's music taste, and become the best curator.",
    url: baseUrl,
    siteName: "Empatify",
    images: [
      {
        url: socialPreview,
        width: 1200,
        height: 630,
        alt: "Empatify multiplayer music game preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Empatify — Pick songs your friends will love",
    description: "Join the lobby, match the group's music taste, and become the best curator.",
    images: [socialPreview],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts - Pacifico for Winner Display */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet" />
      </head>
      <body className={`${unbounded.variable} ${outfit.variable}`}>
        {children}
      </body>
    </html>
  );
}
