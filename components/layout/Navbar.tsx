"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Menu, 
  Moon, 
  Sun, 
  Github, 
  Twitter,
  Shield,
  LogOut,
  Heart
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
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
  const { theme, setTheme } = useTheme();
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
    { name: "Free Courses", href: "/free-courses" },
    { name: "Reviews", href: "/reviews" },
    { name: "Snippets", href: "/snippets" },
    { name: "About", href: "/about" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <div className="mr-4 flex md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
        
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Image src="/logo.png" alt="CodeCraft Logo" width={32} height={32} className="rounded-lg" />
          <span className="hidden font-bold sm:inline-block text-lg tracking-tight">
            CodeCraft <span className="text-primary">Academy</span>
          </span>
        </Link>

        <div className="hidden md:flex md:gap-x-6 lg:gap-x-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href ? "text-foreground" : "text-foreground/60"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <BlogDropdown />
          {isStudio && (
            <span className="text-sm font-medium text-primary">• CMS Studio</span>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
          <div className="hidden md:flex md:w-auto">
            <Button 
              variant="outline" 
              className="relative h-9 justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none w-40 lg:w-64"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline-flex">Search...</span>
              <span className="inline-flex lg:hidden">Search...</span>
              <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
          
          {/* Mobile Search Icon Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 md:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          
          <nav className="flex items-center gap-1 md:gap-2">
            {!authLoading && (
              <>
                {isStudio && isAdmin === true ? (
                  <>
                    <Badge variant="default" className="bg-primary hidden sm:inline-flex">
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
                      className="gap-2 hidden sm:flex"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden md:inline">Sign Out</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSignOut}
                      className="sm:hidden"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : user ? (
                  <UserMenu />
                ) : (
                  <>
                    <Link href="/auth">
                      <Button variant="ghost" size="sm" className="hidden sm:flex">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth">
                      <Button size="sm" className="hidden sm:flex">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
            <Link href="https://github.com" target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
            <Link href="https://twitter.com" target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border bg-background">
          <div className="space-y-1 px-4 py-4">
            {/* Mobile Search Button */}
            <Button 
              variant="outline" 
              className="w-full justify-start mb-4"
              onClick={() => {
                setSearchOpen(true);
                setIsOpen(false);
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              Search...
            </Button>
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="block py-2 text-base font-medium text-foreground hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              href="/blog"
              className="block py-2 text-base font-medium text-foreground hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            {isStudio && (
              <div className="py-2 text-base font-medium text-primary">
                • CMS Studio
              </div>
            )}
            <div className="border-t border-border pt-4 mt-4">
              {user ? (
                <div className="space-y-2">
                  <div className="px-2 py-2 text-sm">
                    <p className="font-medium">{user.email}</p>
                    {isStudio && isAdmin === true && (
                      <Badge variant="default" className="mt-2 bg-primary">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
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
                  <Button className="w-full" onClick={() => setIsOpen(false)}>
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
