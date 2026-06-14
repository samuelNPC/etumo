import type { Metadata } from "next";
import "./globals.css"; 

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
      {/* The body tag renders all your pages (like page.tsx and workspace/page.tsx) 
        inside the 'children' prop. 
      */}
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
