import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { Analytics } from "@/components/analytics/GoogleAnalytics";
import { Chatbot } from "@/components/chat/Chatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CodeCraft Academy - Master Modern Tech",
  description: "CodeCraft Academy is a web development blog and learning platform providing free courses, in-depth reviews, and career advice for developers. From React to AI, we cover what matters most.",
  keywords: ["web development", "free courses", "programming courses", "React", "Next.js", "TypeScript", "JavaScript", "AI", "developer blog", "CodeCraft Academy"],
  authors: [{ name: "CodeCraft Academy" }],
  creator: "CodeCraft Academy",
  publisher: "CodeCraft Academy",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  other: {
    // Add Google site verification meta tag here when you get the verification code
    // 'google-site-verification': 'your-verification-code-here',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
              <NavigationProgress />
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <Toaster />
            </div>
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
        <Chatbot />
      </body>
    </html>
  );
}

