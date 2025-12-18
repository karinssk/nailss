import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบจัดการคิวช่างทำเล็บ",
  description: "Nail Salon Appointment Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          <div className="pb-16 md:pb-0">
            {children}
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
