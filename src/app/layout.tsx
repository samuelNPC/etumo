import type { Metadata, Viewport } from "next";
import "./globals.css"; 
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Preserving your dynamic export
export const dynamic = "force-dynamic";

// 🚨 Added Viewport export to handle mobile scaling and PWA theme colors natively
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.etomu.com"),
  title: {
    default: "Etomu | Where research gets done.",
    template: "%s | Etomu",
  },
  description: "Etomu is an AI-powered research workspace that helps students, researchers, and academic writers move from idea to submission-ready documents faster.",
  applicationName: "Etomu",
  keywords: ["Research AI", "Uganda University", "Turnitin bypass", "Dissertation AI", "Data Collection", "Etomu"],
  authors: [{ name: "Etomu Team" }],
  creator: "Etomu",
  openGraph: {
    title: "Etomu | Where research gets done.",
    description: "Etomu is an AI-powered research workspace that helps students, researchers, and academic writers move from idea to submission-ready documents faster.",
    url: "https://www.etomu.com",
    siteName: "Etomu",
    type: "website",
    locale: "en_UG",
    images: [
      {
        url: "/og-image.png", // Ensure you add this 1200x630 image to your public folder!
        width: 1200,
        height: 630,
        alt: "Etomu Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Etomu | Where research gets done.",
    description: "Etomu is an AI-powered research workspace that helps students, researchers, and academic writers move from idea to submission-ready documents faster.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest", // Links the PWA settings
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased flex flex-col min-h-screen">
        <Header />

        {/* Updated main wrapper: flex-grow pushes the footer down, 
            and flex flex-col allows child pages to use flex-1 to stretch their backgrounds */}
        <main className="flex-grow flex flex-col w-full">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
