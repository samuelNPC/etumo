import type { Metadata } from "next";
import "./globals.css"; 
import Header from "@/components/Header";
import Footer from "@/components/Footer"; // <--- Add this import

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.etomu.com"),
  title: "Etomu | Where research gets done.",
  description: "Etomu is an AI-powered research workspace that helps students, researchers, and academic writers move from idea to submission-ready documents faster.",
  openGraph: {
    title: "Etomu | Where research gets done.",
    description: "Etomu is an AI-powered research workspace that helps students, researchers, and academic writers move from idea to submission-ready documents faster.",
    url: "https://www.etomu.com",
    siteName: "Etomu",
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
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

        {/* Main content wrapper with flex-grow to push footer to bottom */}
        <div className="flex-grow">
          {children}
        </div>

        {/* Global Footer injected here */}
        <Footer />
      </body>
    </html>
  );
}
