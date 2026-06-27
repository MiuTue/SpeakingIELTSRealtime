import type { Metadata } from "next";
import "./globals.css";
import { ClientNavbar } from "@/components/layout/ClientNavbar";
import { Footer } from "@/components/layout/Footer";
import { ThreeBg } from "@/components/landing/ThreeBg";

export const metadata: Metadata = {
  title: "SpeakIELTS AI",
  description: "Realtime IELTS Speaking practice with an AI examiner."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {  return (
    <html lang="en" className="h-full">
      <body className="relative flex flex-col min-h-screen">
        <ThreeBg />
        <ClientNavbar />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
