"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  Github, 
  Twitter,
  Shield,
  LogOut,
  Heart
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { UserMenu } from "@/components/auth/UserMenu";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BlogDropdown } from "@/components/navigation/BlogDropdown";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const isStudio = pathname?.startsWith("/studio");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is admin when in studio
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isStudio || !user || authLoading) {
        setIsAdmin(null);
        return;
      }

      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        setIsAdmin(data?.is_admin === true);
      } catch (error) {
        setIsAdmin(false);
      }
    };

    if (isStudio && user) {
      checkAdmin();
    }
  }, [isStudio, user, authLoading]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const navLinks = [
    { name: "Courses", href: "/free-courses" },
    { name: "Reviews", href: "/reviews" },
    { name: "Career", href: "/career" },
    { name: "About", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  const isActive = (path: string) => pathname === path;

  if (!mounted) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        {/* Left section: Logo and Navigation */}
        <div className="flex items-center gap-4 lg:gap-6 flex-1">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <Link href="/" className="flex items-center hover:opacity-90 transition-all duration-300 group shrink-0 min-w-0">
            {/* Responsive logo sizing - smaller on mobile */}
            <Image 
              src="/logo.png" 
              alt="CodeCraft Academy Logo" 
              width={240} 
              height={60} 
              className="h-8 xs:h-9 sm:h-11 md:h-14 lg:h-16 w-auto shrink-0 logo-theme-optimized transition-all duration-300 group-hover:scale-105" 
              priority
              style={{ 
                maxHeight: '64px',
                objectFit: 'contain'
              }}
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-x-6 lg:gap-x-8 xl:gap-x-10 flex-1 max-w-4xl mx-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`text-sm lg:text-base font-google-sans font-medium transition-all duration-300 hover:text-primary hover:scale-105 whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5 ${
                  isActive(link.href) ? "text-foreground bg-primary/10" : "text-foreground/70"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <BlogDropdown />
            {isStudio && (
              <span className="text-sm lg:text-base font-google-sans font-medium text-primary ml-2 px-3 py-1 bg-primary/10 rounded-md">• CMS Studio</span>
            )}
          </div>
        </div>

        {/* Right section: Auth, Theme, Social */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 shrink-0">
          {/* Auth, Social, Theme */}
          <nav className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {!authLoading && (
              <>
                {isStudio && isAdmin === true ? (
                  <>
                    <Badge variant="default" className="bg-primary hidden sm:inline-flex font-google-sans font-medium">
                      <Shield className="h-3 w-3 mr-1" />
                      <span className="hidden md:inline">Admin: {user?.email}</span>
                      <span className="md:hidden">Admin</span>
                    </Badge>
                    <Badge variant="default" className="bg-primary sm:hidden">
                      <Shield className="h-3 w-3" />
                    </Badge>
                    <UserMenu />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      className="h-9 text-xs sm:h-10 sm:text-sm font-google-sans font-medium hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : user ? (
                  <UserMenu />
                ) : (
                  <>
                    <Link href="/auth" className="hidden xs:flex">
                      <Button variant="ghost" size="sm" className="h-9 text-xs sm:h-10 sm:text-sm font-google-sans font-medium hover:bg-primary/10 transition-all duration-300">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth" className="hidden xs:flex">
                      <Button size="sm" className="h-9 text-xs sm:h-10 sm:text-sm font-google-sans font-semibold hover:scale-105 transition-all duration-300">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
          
          {/* Social links - hide on very small screens */}
          <Link href={process.env.NEXT_PUBLIC_TWITTER_URL || "https://twitter.com/Stevegmail98"} target="_blank" rel="noreferrer" className="group">
            <Button variant="outline" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-110">
              <Twitter className="h-4 w-4" />
              <span className="sr-only">Twitter</span>
            </Button>
          </Link>
          <Link href={process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/SteveRonald"} target="_blank" rel="noreferrer" className="group">
            <Button variant="outline" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-110">
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="space-y-2 px-4 py-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`block py-3 text-base font-google-sans font-medium transition-all duration-300 hover:text-primary hover:bg-primary/5 rounded-md px-3 ${
                  isActive(link.href) ? "text-foreground bg-primary/10" : "text-foreground/70"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              href="/blog"
              className="block py-3 text-base font-google-sans font-medium text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-md px-3 transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            {isStudio && (
              <div className="py-3 text-base font-google-sans font-medium text-primary bg-primary/10 rounded-md px-3">
                • CMS Studio
              </div>
            )}
            
            {/* Mobile Auth Section */}
            {!authLoading && (
              <div className="pt-4 border-t border-border">
                {user ? (
                  <div className="space-y-3">
                    {isStudio && isAdmin === true && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-md">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm font-google-sans font-medium text-primary">Admin Mode</span>
                      </div>
                    )}
                    <Link href="/profile" className="block px-3 py-2 text-base font-google-sans font-medium hover:bg-primary/5 rounded-md transition-colors">
                      Profile
                    </Link>
                    {isStudio && isAdmin === true && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSignOut}
                        className="w-full justify-start h-10 text-sm font-google-sans font-medium hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/auth" className="block">
                      <Button variant="ghost" className="w-full justify-start h-12 text-base font-google-sans font-medium hover:bg-primary/10 transition-all duration-300">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth" className="block">
                      <Button className="w-full h-12 text-base font-google-sans font-semibold hover:scale-105 transition-all duration-300">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
