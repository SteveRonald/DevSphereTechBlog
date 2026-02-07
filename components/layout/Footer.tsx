import Link from "next/link";
import { Heart, Github, Twitter, Linkedin, Instagram, Facebook, Youtube, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
   const socialLinks = [
    { name: 'TikTok', url: process.env.NEXT_PUBLIC_TIKTOK_URL, icon: <Globe className="h-4 w-4" /> },
    { name: 'Instagram', url: process.env.NEXT_PUBLIC_INSTAGRAM_URL, icon: <Instagram className="h-4 w-4" /> },
    { name: 'Facebook', url: process.env.NEXT_PUBLIC_FACEBOOK_URL, icon: <Facebook className="h-4 w-4" /> },
    { name: 'LinkedIn', url: process.env.NEXT_PUBLIC_LINKEDIN_URL, icon: <Linkedin className="h-4 w-4" /> },
    { name: 'YouTube', url: process.env.NEXT_PUBLIC_YOUTUBE_URL, icon: <Youtube className="h-4 w-4" /> },
    { name: 'Website', url: process.env.NEXT_PUBLIC_PERSONAL_WEBSITE_URL, icon: <Globe className="h-4 w-4" /> },
    { name: 'Twitter', url: process.env.NEXT_PUBLIC_TWITTER_URL, icon: <Twitter className="h-4 w-4" /> },
    { name: 'GitHub', url: process.env.NEXT_PUBLIC_GITHUB_URL, icon: <Github className="h-4 w-4" /> },
  ].filter(link => link.url);
  
  return (
    <footer className="border-t border-border/40 bg-black text-white">
      <div className="container py-12 px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4 font-google-sans">CodeCraft Academy</h3>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed font-google-sans">
              Empowering developers with free courses, in-depth reviews, and modern tech skills. Join our community today.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="https://twitter.com/Stevegmail98" target="_blank" rel="noreferrer" className="group">
                <Button variant="outline" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-110">
                  <Twitter className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </Button>
              </Link>
              <Link href="https://github.com/SteveRonald" target="_blank" rel="noreferrer" className="group">
                <Button variant="outline" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-110">
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </Button>
              </Link>
              <Link href="https://www.linkedin.com/in/steve-ronald-432775255" target="_blank" rel="noreferrer" className="group">
                <Button variant="outline" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-110">
                  <Linkedin className="h-4 w-4" />
                  <span className="sr-only">LinkedIn</span>
                </Button>
              </Link>
              <Link href="/donate">
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  ❤️ Support Us
                </Button>
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider font-google-sans">Categories</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/blog/category/web-development" className="hover:text-primary transition-colors font-google-sans hover:underline">Web Development</Link></li>
              <li><Link href="/blog/category/ai-engineering" className="hover:text-primary transition-colors font-google-sans hover:underline">AI Engineering</Link></li>
              <li><Link href="/blog/category/productivity" className="hover:text-primary transition-colors font-google-sans hover:underline">Productivity</Link></li>
              <li><Link href="/blog/category/career-growth" className="hover:text-primary transition-colors font-google-sans hover:underline">Career Growth</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider font-google-sans">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors font-google-sans hover:underline">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors font-google-sans hover:underline">Contact</Link></li>
              <li><Link href="/donate" className="hover:text-primary transition-colors font-google-sans hover:underline">Support Us</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors font-google-sans hover:underline">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors font-google-sans hover:underline">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground font-google-sans">
            © {new Date().getFullYear()} CodeCraft Academy. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-muted-foreground">
             <span className="font-google-sans">Built with care by developers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}





