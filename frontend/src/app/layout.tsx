import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { LangBootstrap } from "@/components/LangBootstrap";
import { ToastProvider } from "@/components/Toast";
import { ClerkAuthSync } from "@/components/ClerkAuthSync";
import { ThemeProvider } from "@/lib/theme";
import ConciergeButton from "@/components/ConciergeButton";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const siteURL = process.env.NEXT_PUBLIC_APP_URL ?? "https://indieyatra.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: {
    default: "IndieYatra — India's Premium Travel Super-App",
    template: "%s | IndieYatra",
  },
  description:
    "Book buses, trains, flights and hotels across India with live tracking, AI trip planning, and premium concierge care. 500+ operators · 20,000+ trains · all major airlines.",
  keywords: [
    "bus booking India",
    "train ticket booking",
    "flight booking India",
    "hotel booking India",
    "live bus tracking",
    "IRCTC alternative",
    "IndieYatra",
    "travel super app India",
  ],
  authors: [{ name: "IndieYatra" }],
  creator: "IndieYatra",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteURL,
    siteName: "IndieYatra",
    title: "IndieYatra — India's Premium Travel Super-App",
    description:
      "Book buses, trains, flights and hotels across India. Live tracking, AI trip planning, and premium concierge — all in one app.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "IndieYatra — India's Travel Super-App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IndieYatra — India's Premium Travel Super-App",
    description:
      "Book buses, trains, flights and hotels across India. Live tracking, AI trip planning, and premium concierge.",
    images: ["/og-image.png"],
    creator: "@indieyatra",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IndieYatra",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B1A",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#FF6B1A",
          colorBackground: "#1E293B",
          colorInputBackground: "#0F172A",
          colorText: "#E2E8F0",
          colorTextSecondary: "#94A3B8",
          colorInputText: "#E2E8F0",
          colorNeutral: "#475569",
          borderRadius: "0.75rem",
          fontFamily: "inherit",
        },
        elements: {
          card: "shadow-card border border-border",
          formButtonPrimary: "bg-gradient-to-r from-[#FF6B1A] to-[#FF8A3D] hover:opacity-90",
          footerActionLink: "text-[#FF6B1A] hover:text-[#FF8A3D]",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/icon-192.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/icon-192.svg" />
          {/* Anti-flash: apply saved theme before first paint */}
          <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ib-theme');document.documentElement.classList.add(t==='light'?'light':'dark');}catch(e){document.documentElement.classList.add('dark');}})();` }} />
          <script
            dangerouslySetInnerHTML={{
              __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); }); }`,
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "IndieYatra",
                url: siteURL,
                logo: `${siteURL}/icon-192.svg`,
                sameAs: [
                  "https://twitter.com/indieyatra",
                  "https://instagram.com/indieyatra",
                ],
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "customer service",
                  availableLanguage: ["English", "Hindi"],
                },
              }),
            }}
          />
        </head>
        <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
          <LangBootstrap />
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider>
              <ToastProvider>
                <ClerkAuthSync />
                {children}
                <ConciergeButton />
              </ToastProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
