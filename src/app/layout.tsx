import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { PricingProvider } from "@/components/payments/pricing-context";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["600", "700", "800"],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
  weight: ["400", "500", "600"],
  fallback: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "500"],
  fallback: ["JetBrains Mono", "ui-monospace", "monospace"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const metadata: Metadata = {
  title: "BaseBuildStack",
  description: "Diagnose, learn in 15 minutes, and drill technical rounds in one loop.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
  },
};

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('basebuildstack-theme');
    var theme = stored || 'dark';
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      className={`${bricolageGrotesque.variable} ${geist.variable} ${geistMono.variable} ${inter.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning className="min-h-screen antialiased">
        <ThemeProvider>
          <PricingProvider>
            <AuroraBackground />
            {children}
          </PricingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
