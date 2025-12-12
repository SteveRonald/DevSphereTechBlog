import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  Github, 
  Twitter 
} from "lucide-react";
import { useState, useEffect } from "react";
import logo from "@assets/generated_images/modern_abstract_geometric_tech_logo_for_coding_blog.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [location] = useLocation();

  // Initialize theme
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navLinks = [
    { name: "Tutorials", href: "/tutorials" },
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
          <img src={logo} alt="CodeCraft Logo" className="h-8 w-8 rounded-lg" />
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
                location === link.href ? "text-foreground" : "text-foreground/60"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button variant="outline" className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64">
              <span className="hidden lg:inline-flex">Search documentation...</span>
              <span className="inline-flex lg:hidden">Search...</span>
              <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
          
          <nav className="flex items-center space-x-2">
            <Link href="https://github.com" target="_blank" rel="noreferrer">
              <div className="inline-flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 transition-colors">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </div>
            </Link>
            <Link href="https://twitter.com" target="_blank" rel="noreferrer">
              <div className="inline-flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 transition-colors">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border bg-background">
          <div className="space-y-1 px-4 py-4">
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
          </div>
        </div>
      )}
    </nav>
  );
}
