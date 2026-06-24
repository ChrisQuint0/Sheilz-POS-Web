import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ProfileProvider } from "@/components/profile-provider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SHEILZ COFFEE",
  description: "Sheilz Coffee Point of Sale System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ProfileProvider>
          <TooltipProvider>
            <DashboardLayout>{children}</DashboardLayout>
          </TooltipProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
