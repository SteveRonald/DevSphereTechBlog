import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container py-10 px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold mb-4">CodeCraft Academy</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Empowering developers with practical tutorials, in-depth reviews, and modern tech skills. Join our community today.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/tutorials" className="hover:text-primary transition-colors">Tutorials</Link></li>
              <li><Link href="/reviews" className="hover:text-primary transition-colors">Product Reviews</Link></li>
              <li><Link href="/snippets" className="hover:text-primary transition-colors">Code Snippets</Link></li>
              <li><Link href="/newsletter" className="hover:text-primary transition-colors">Newsletter</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CodeCraft Academy. All rights reserved.
          </p>
          <div className="flex space-x-4 text-sm text-muted-foreground">
             <span>Built with 💙 by developers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}





