import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Twitter, Linkedin, ExternalLink } from "lucide-react";
import { sanityClient } from "@/lib/sanity";
import { categoriesQuery } from "@/lib/sanity.queries";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import Link from "next/link";

async function getCategories() {
  try {
    const categories = await sanityClient.fetch(categoriesQuery);
    return categories || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function Sidebar() {
  const categories = await getCategories();

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
        <CardContent>
          <NewsletterForm />
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {categories.length > 0 ? (
              categories.map((cat: any) => (
                <Link
                  key={cat._id}
                  href={`/category/${cat.slug.current}`}
                  className="flex items-center justify-between py-2 text-sm hover:text-primary cursor-pointer group transition-colors"
                >
                  <span className="font-medium">{cat.title}</span>
                  <Badge variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {cat.count || 0}
                  </Badge>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No categories yet</p>
            )}
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
            <Button variant="outline" size="icon" className="rounded-full hover:text-primary hover:border-primary" asChild>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <Twitter className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full hover:text-primary hover:border-primary" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full hover:text-primary hover:border-primary" asChild>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

