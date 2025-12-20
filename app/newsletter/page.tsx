import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { Mail, CheckCircle2 } from "lucide-react";

export default function NewsletterPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Join Our Newsletter
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Get the latest tutorials, tech news, and exclusive content delivered straight to your inbox.
          </p>
        </div>

        {/* Benefits */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>What You'll Get</CardTitle>
            <CardDescription>
              Stay updated with our latest content and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Weekly roundup of new tutorials and articles</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Exclusive tips and best practices</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Early access to new features and content</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Tech news and industry insights</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Newsletter Form */}
        <Card>
          <CardHeader>
            <CardTitle>Subscribe Now</CardTitle>
            <CardDescription>
              Enter your email address to start receiving our newsletter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewsletterForm />
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <p className="text-xs text-center text-muted-foreground">
          We respect your privacy. Unsubscribe at any time.{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

