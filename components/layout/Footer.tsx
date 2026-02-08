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
      <div className="container max-w-7xl mx-auto py-12 px-4 md:px-6">
        {/* Top: Brand + Social */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-3 font-google-sans">CodeCraft Academy</h3>
          <p className="text-sm text-gray-400 max-w-lg leading-relaxed font-google-sans mb-5">
            Empowering developers with free courses, in-depth reviews, and modern tech skills. Join our community today.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {socialLinks.map((social) => (
              <Link key={social.name} href={social.url || "#"} target="_blank" rel="noreferrer">
                <Button variant="outline" size="icon" className="h-9 w-9 border-gray-700 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-300">
                  {social.icon}
                  <span className="sr-only">{social.name}</span>
                </Button>
              </Link>
            ))}
            <Link href="/donate">
              <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <Heart className="h-4 w-4 mr-2" /> Support Us
              </Button>
            </Link>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-10 border-b border-gray-800">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 font-google-sans">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors font-google-sans">Blog</Link></li>
              <li><Link href="/free-courses" className="text-gray-400 hover:text-white transition-colors font-google-sans">Courses</Link></li>
              <li><Link href="/career" className="text-gray-400 hover:text-white transition-colors font-google-sans">Careers</Link></li>
              <li><Link href="/reviews" className="text-gray-400 hover:text-white transition-colors font-google-sans">Reviews</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 font-google-sans">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors font-google-sans">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors font-google-sans">Contact</Link></li>
              <li><Link href="/donate" className="text-gray-400 hover:text-white transition-colors font-google-sans">Support Us</Link></li>
              <li><Link href="/newsletter" className="text-gray-400 hover:text-white transition-colors font-google-sans">Newsletter</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 font-google-sans">Categories</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/blog/category/web-development" className="text-gray-400 hover:text-white transition-colors font-google-sans">Web Development</Link></li>
              <li><Link href="/blog/category/ai-engineering" className="text-gray-400 hover:text-white transition-colors font-google-sans">AI Engineering</Link></li>
              <li><Link href="/blog/category/productivity" className="text-gray-400 hover:text-white transition-colors font-google-sans">Productivity</Link></li>
              <li><Link href="/blog/category/career-growth" className="text-gray-400 hover:text-white transition-colors font-google-sans">Career Growth</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 font-google-sans">Resources</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors font-google-sans">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors font-google-sans">Terms of Service</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors font-google-sans">FAQ</Link></li>
              <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors font-google-sans">Support</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 font-google-sans">
            © {new Date().getFullYear()} CodeCraft Academy. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 font-google-sans">
            Built with <Heart className="inline h-3 w-3 text-red-500 mx-1" /> by developers, for developers.
          </p>
        </div>
      </div>
    </footer>
  );
}





