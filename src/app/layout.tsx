import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { ThemeInit } from "@/components/theme-init";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Owly - AI Customer Support",
  description: "Open-source AI-powered customer support agent",
  icons: {
    icon: "/owly.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full">
          <Providers>
            <ThemeInit />
            {children}
          </Providers>
        </body>
    </html>
  );
}
