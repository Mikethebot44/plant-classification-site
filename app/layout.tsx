import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/sections/header";
import { Footer } from "@/sections/footer";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Motus Studio",
  description: "Created by Youcef Bnm",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">
          <Header />
          {children}
          <Footer />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
