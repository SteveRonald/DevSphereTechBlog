import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, DollarSign, Calendar, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { RichMarkdown } from "@/components/RichMarkdown";

interface Career {
  id: string;
  title: string;
  slug: string;
  company: string;
  location: string;
  job_type: string;
  salary_range: string | null;
  thumbnail_url: string | null;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string | null;
  application_url: string | null;
  application_email: string | null;
  application_deadline: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

type RelatedCareer = {
  title: string;
  slug: string;
  company: string;
};

async function getRelatedCareers(career: Career): Promise<RelatedCareer[]> {
  try {
    const supabase = await createServerClient(undefined);
    const { data } = await supabase
      .from("career_listings")
      .select("title,slug,company")
      .eq("published", true)
      .eq("job_type", career.job_type)
      .neq("slug", career.slug)
      .order("created_at", { ascending: false })
      .limit(4);

    return (data || []) as RelatedCareer[];
  } catch (e) {
    console.error("Error fetching related careers:", e);
    return [];
  }
}

async function getCareer(slug: string): Promise<Career | null> {
  try {
    const supabase = await createServerClient(undefined);
    const { data: career, error } = await supabase
      .from("career_listings")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error || !career) {
      return null;
    }

    // Check if deadline has passed
    if (career.application_deadline) {
      const deadline = new Date(career.application_deadline);
      const now = new Date();
      if (deadline < now) {
        return null; // Don't show expired posts
      }
    }

    return career;
  } catch (error) {
    console.error("Error fetching career:", error);
    return null;
  }
}

export const revalidate = 60;
export const dynamic = 'force-dynamic';

// Generate static params for better performance
export async function generateStaticParams() {
  try {
    const { createServerClient } = await import("@/lib/supabase-server");
    const supabase = await createServerClient(undefined);
    const { data } = await supabase
      .from("career_listings")
      .select("slug")
      .eq("published", true);
    
    return data?.map((career: { slug: string }) => ({ slug: career.slug })) || [];
  } catch (error) {
    console.error("Error generating static params for careers:", error);
    return [];
  }
}

export default async function CareerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const career = await getCareer(slug);

  if (!career) {
    notFound();
  }

  const isDeadlinePassed = career.application_deadline 
    ? new Date(career.application_deadline) < new Date() 
    : false;

  const relatedCareers = await getRelatedCareers(career);

  return (
    <>
      <div className="bg-muted/30 pb-10">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <Link href="/career" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Careers
          </Link>

          <div className="max-w-5xl mx-auto">
            {/* Career thumbnail removed - only shown in listings */}
            <div className="flex items-center gap-2 mb-4">
              {career.featured && (
                <Badge variant="default" className="bg-primary">Featured</Badge>
              )}
              <Badge variant="outline">{career.job_type}</Badge>
              {isDeadlinePassed && (
                <Badge variant="destructive">Application Closed</Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 md:mb-6 leading-tight">
              {career.title}
            </h1>

            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-semibold">{career.company}</span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground py-4 border-y border-border/50">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{career.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{career.job_type}</span>
              </div>
              {career.salary_range && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{career.salary_range}</span>
                </div>
              )}
              {career.application_deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className={
                    new Date(career.application_deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      ? "text-red-600 font-semibold"
                      : ""
                  }>
                    Apply by {format(new Date(career.application_deadline), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <RichMarkdown content={career.description} />
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <RichMarkdown content={career.responsibilities} />
            </CardContent>
          </Card>

          {/* Benefits */}
          {career.benefits && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <RichMarkdown content={career.benefits} />
              </CardContent>
            </Card>
          )}

          {/* Application Section */}
          {!isDeadlinePassed && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Ready to Apply?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Ready to take the next step? Click below to submit your application.
                </p>
                {(career.application_url || career.application_email) && (
                  <div className="flex flex-wrap gap-4">
                    {career.application_url && (
                      <Link href={career.application_url} target="_blank" rel="noopener noreferrer">
                        <Button size="lg">
                          Apply Now
                        </Button>
                      </Link>
                    )}
                    {career.application_email && (
                      <Link href={`mailto:${career.application_email}`}>
                        <Button variant="outline" size="lg">
                          Email Application
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
                {career.application_deadline && (
                  <p className="text-sm text-muted-foreground">
                    Application deadline: {format(new Date(career.application_deadline), "MMMM dd, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Related Careers</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedCareers.length > 0 ? (
                <div className="space-y-3">
                  {relatedCareers.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/career/${c.slug}`}
                      className="block"
                    >
                      <div className="text-sm font-medium hover:text-primary transition-colors">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.company}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No related careers yet</p>
              )}

              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/career">Browse all careers</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
