import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-16 sm:py-20 md:py-24">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-primary shadow-lg mb-6">
            <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-google-sans font-medium">Weekly Updates</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 sm:mb-6 font-google-sans">
            Join the <span className="text-gradient">Newsletter</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-google-sans">
            Get the latest tutorials, tech news, and free courses delivered to your inbox every week.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
          {/* Newsletter Signup */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <Card className="bg-primary/5 border-primary/20 shadow-none">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-google-sans">Stay Updated</CardTitle>
                <CardDescription className="text-sm font-google-sans">
                  No spam. Unsubscribe anytime. Just quality content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NewsletterForm />
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold font-google-sans mb-1">Free Courses</h3>
                  <p className="text-sm text-muted-foreground font-google-sans">New course announcements and updates</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold font-google-sans mb-1">Tutorials</h3>
                  <p className="text-sm text-muted-foreground font-google-sans">Step-by-step guides and code snippets</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold font-google-sans mb-1">Tech News</h3>
                  <p className="text-sm text-muted-foreground font-google-sans">What's happening in web dev and AI</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold font-google-sans mb-1">No Spam</h3>
                  <p className="text-sm text-muted-foreground font-google-sans">Just valuable content, unsubscribe anytime</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-google-sans">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start h-11 font-google-sans" asChild>
                  <Link href="/free-courses">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Browse Free Courses
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start h-11 font-google-sans" asChild>
                  <Link href="/blog">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Read Latest Articles
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start h-11 font-google-sans" asChild>
                  <Link href="/reviews">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    View Reviews
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-google-sans">Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-google-sans mb-4">
                  Join thousands of developers learning modern tech skills.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-google-sans">
                  <span className="font-semibold text-primary">5,000+</span>
                  <span>subscribers</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-center text-muted-foreground mt-12 sm:mt-16 font-google-sans">
          We respect your privacy. Unsubscribe at any time.{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

