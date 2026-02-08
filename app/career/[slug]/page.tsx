import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, DollarSign, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
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
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("career_listings")
      .select("slug")
      .eq("published", true);
    
    return (data || []).map((career: { slug: string }) => ({ slug: career.slug }));
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
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Career Details Frame */}
          <Card className="border border-border/60 shadow-sm overflow-hidden">
            <CardContent className="p-6 sm:p-8 md:p-10 space-y-8">
              {/* Description */}
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <RichMarkdown content={career.description} />
              </div>

              {/* Main Content */}
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <RichMarkdown content={career.responsibilities} />
              </div>

              {/* Apply button */}
              {!isDeadlinePassed && career.application_url && (
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/40">
                  <Link href={career.application_url} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="shadow-md hover:shadow-lg transition-all duration-300">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apply Now
                    </Button>
                  </Link>
                  {career.application_deadline && (
                    <p className="text-sm text-muted-foreground">
                      Deadline: {format(new Date(career.application_deadline), "MMMM dd, yyyy")}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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
