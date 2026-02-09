import { createServerClient } from "@/lib/supabase-server";
import { Briefcase } from "lucide-react";
import { SearchableCareerList } from "@/components/career/SearchableCareerList";

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
      .order("created_at", { ascending: false })
      .throwOnError();

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
  } catch (error: any) {
    // Log structured error for debugging, but don't crash
    console.error("Error fetching careers:", {
      message: error?.message || "Unknown error",
      code: error?.code || "",
    });
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
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <SearchableCareerList careers={careers} />
      </div>
    </>
  );
}
