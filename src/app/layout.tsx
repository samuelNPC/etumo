import type { Metadata } from "next";
import "./globals.css"; 
import Header from "@/components/Header";

// Force dynamic rendering to prevent Vercel build hangs
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Etumo | Finish your research project faster",
  description: "Academic research, similarity refinement, and formatting OS for university students.",
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
        
        {/* Main content wrapper */}
        <div className="flex-grow">
          {children}
        </div>
      </body>
    </html>
  );
}
