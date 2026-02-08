import { createServerClient } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { PageSearch } from "@/components/search/PageSearch";

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
  application_deadline: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

async function getAllCareers(): Promise<Career[]> {
  try {
    const supabase = await createServerClient(undefined);
    const { data: careers, error } = await supabase
      .from("career_listings")
      .select("*")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching careers:", error);
      return [];
    }

    // Filter out expired career posts
    const now = new Date();
    const activeCareers = (careers || []).filter((career: Career) => {
      if (!career.application_deadline) return true;
      const deadline = new Date(career.application_deadline);
      return deadline >= now;
    });

    return activeCareers;
  } catch (error) {
    console.error("Error fetching careers:", error);
    return [];
  }
}

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function CareerPage() {
  const careers = await getAllCareers();

  return (
    <>
      <div className="bg-muted/30 py-12 border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Career Opportunities</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Join our team and help shape the future of tech education. 
            Explore exciting career opportunities and find your perfect role.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {careers.length} {careers.length === 1 ? "position" : "positions"} available
          </p>
          <div className="mt-6 max-w-md">
            <PageSearch placeholder="Search jobs by title, company, location..." searchPath="/career" />
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {careers.length > 0 ? (
          <div className="grid gap-6">
            {careers.map((career) => (
              <Card key={career.id} className="hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-[300px_1fr] gap-4">
                  {career.thumbnail_url && (
                    <div className="relative h-48 md:h-full w-full overflow-hidden rounded-l-lg">
                      <Image
                        src={career.thumbnail_url}
                        alt={career.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className={career.thumbnail_url ? "" : "col-span-full"}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {career.featured && (
                              <Badge variant="default" className="bg-primary">Featured</Badge>
                            )}
                            <Badge variant="outline">{career.job_type}</Badge>
                          </div>
                          <CardTitle className="text-2xl mb-2">{career.title}</CardTitle>
                          <CardDescription className="text-base">
                            {career.company}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span className={
                            new Date(career.application_deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                              ? "text-red-600 font-semibold"
                              : "text-muted-foreground"
                          }>
                            Deadline: {format(new Date(career.application_deadline), "MMM dd, yyyy")}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-muted-foreground line-clamp-3">
                      {career.description.substring(0, 200)}...
                    </p>

                    <div className="flex gap-2">
                      <Link href={`/career/${career.slug}`}>
                        <Button>View Details</Button>
                      </Link>
                    </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">No positions available</p>
              <p className="text-sm text-muted-foreground">
                Check back soon for new opportunities!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
