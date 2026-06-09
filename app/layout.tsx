import type { Metadata } from "next";
import "./globals.css";
import { ClientNavbar } from "@/components/layout/ClientNavbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "SpeakIELTS AI",
  description: "Realtime IELTS Speaking practice with an AI examiner."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClientNavbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
