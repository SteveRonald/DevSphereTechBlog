"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
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
import { SearchDialog } from "@/components/search/SearchDialog";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BlogDropdown } from "@/components/navigation/BlogDropdown";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 sm:h-18 md:h-20 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10 gap-2">
        {/* Left section: Menu + Logo */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 min-w-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 md:hidden shrink-0 hover:bg-primary/10 transition-colors"
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
        </div>

        {/* Navigation links - better spacing and balance with flex-1 for proper distribution */}
        <div className="hidden md:flex items-center gap-x-6 lg:gap-x-8 xl:gap-x-10 flex-1 max-w-4xl mx-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm lg:text-base font-google-sans font-medium transition-all duration-300 hover:text-primary hover:scale-105 whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5 ${
                pathname === link.href ? "text-foreground bg-primary/10" : "text-foreground/70"
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

        {/* Right section: Search, Auth, Theme, Social */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 shrink-0">
          {/* Desktop Search */}
          <div className="hidden lg:flex">
            <Button 
              variant="outline" 
              className="relative h-10 justify-start rounded-lg bg-background text-sm font-google-sans font-normal text-muted-foreground shadow-none w-48 xl:w-64 border-border/50 hover:border-primary/30 transition-all duration-300"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="hidden xl:inline-flex">Search...</span>
              <span className="inline-flex xl:hidden">Search</span>
              <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
          
          {/* Mobile Search Icon */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 lg:hidden shrink-0 hover:bg-primary/10 transition-colors"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          
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
                      className="gap-2 hidden sm:flex font-google-sans font-medium hover:bg-primary/5 transition-all duration-300"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden md:inline">Sign Out</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSignOut}
                      className="sm:hidden hover:bg-primary/10 transition-colors"
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
            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
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
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="space-y-2 px-4 py-6">
            {/* Mobile Search Button */}
            <Button 
              variant="outline" 
              className="w-full justify-start mb-6 h-12 font-google-sans font-medium border-border/50 hover:border-primary/30 transition-all duration-300"
              onClick={() => {
                setSearchOpen(true);
                setIsOpen(false);
              }}
            >
              <Search className="mr-3 h-4 w-4" />
              Search...
            </Button>
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`block py-3 text-base font-google-sans font-medium transition-all duration-300 hover:text-primary hover:bg-primary/5 rounded-md px-3 ${
                  pathname === link.href ? "text-foreground bg-primary/10" : "text-foreground/70"
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
            <div className="border-t border-border pt-6 mt-6">
              {user ? (
                <div className="space-y-4">
                  <div className="px-3 py-3 text-sm">
                    <p className="font-medium font-google-sans">{user.email}</p>
                    {isStudio && isAdmin === true && (
                      <Badge variant="default" className="mt-3 bg-primary font-google-sans font-medium">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 font-google-sans font-medium border-border/50 hover:border-primary/30 transition-all duration-300" 
                    onClick={async () => {
                      setIsOpen(false);
                      await handleSignOut();
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <Button className="w-full h-12 font-google-sans font-semibold hover:scale-[1.02] transition-all duration-300" onClick={() => setIsOpen(false)}>
                    Sign In / Sign Up
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
