import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Github, Twitter, Linkedin, ExternalLink } from "lucide-react";

export function Sidebar() {
  const categories = [
    { name: "AI & Machine Learning", count: 12 },
    { name: "Web Development", count: 24 },
    { name: "Tutorials", count: 8 },
    { name: "Product Reviews", count: 5 },
    { name: "Career Advice", count: 3 },
  ];

  const tools = [
    { name: "Hostinger", desc: "Best Hosting", link: "#" },
    { name: "Udemy", desc: "Learn Code", link: "#" },
    { name: "GitHub Copilot", desc: "AI Assistant", link: "#" },
  ];

  return (
    <div className="space-y-6">
      {/* Newsletter Widget */}
      <Card className="bg-primary/5 border-primary/20 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Join the Newsletter</CardTitle>
          <p className="text-sm text-muted-foreground">
            Get the latest tutorials and tech news delivered to your inbox weekly.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="your@email.com" className="bg-background" />
          <Button className="w-full">Subscribe</Button>
          <p className="text-xs text-muted-foreground text-center pt-1">
            No spam, unsubscribe anytime.
          </p>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between py-2 text-sm hover:text-primary cursor-pointer group transition-colors">
                <span className="font-medium">{cat.name}</span>
                <Badge variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {cat.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Tools (Affiliate Mock) */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recommended Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tools.map((tool) => (
              <a 
                key={tool.name} 
                href={tool.link} 
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors group"
              >
                <div>
                  <div className="font-semibold text-sm">{tool.name}</div>
                  <div className="text-xs text-muted-foreground">{tool.desc}</div>
                </div>
                <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Follow Us</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" size="icon" className="rounded-full hover:text-primary hover:border-primary">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full hover:text-primary hover:border-primary">
              <Github className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full hover:text-primary hover:border-primary">
              <Linkedin className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
