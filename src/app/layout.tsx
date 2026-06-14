import type { Metadata } from "next";
import "./globals.css"; 

// 🚨 THE SILVER BULLET 🚨
// This tells Vercel: "Stop trying to statically build this app. It is a dynamic SaaS platform."
// This entirely forces Next.js to skip the "Collecting page data..." step that is crashing.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Research Platform | rs.kabaleonline",
  description: "Academic research, similarity refinement, and formatting OS for university students.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
