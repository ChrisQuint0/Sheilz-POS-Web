import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ProfileProvider } from "@/components/profile-provider";
import { SheilzAIProvider } from "@/components/sheilz-ai/sheilz-ai-context";
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sheilz Coffee",
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
          <SheilzAIProvider>
            <TooltipProvider>
              <DashboardLayout>{children}</DashboardLayout>
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </SheilzAIProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
