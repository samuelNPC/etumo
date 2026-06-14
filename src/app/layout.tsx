import type { Metadata } from "next";
import "./globals.css"; 
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
