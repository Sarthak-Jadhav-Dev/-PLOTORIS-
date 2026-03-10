import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plotoris — AI Research Platform",
  description: "The all-in-one AI-powered research platform. Analyze papers, extract insights, and accelerate your research workflow.",
  keywords: ["AI", "research", "platform", "data analysis", "papers", "insights"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
