import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@/lib/supabase-server";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

async function getCategories() {
  try {
    const supabase = await createServerClient(undefined);
    
    // Get all categories from Supabase
    const { data: allCategories, error: catError } = await supabase
      .from("blog_categories")
      .select("*")
      .order("title");

    if (catError) {
      console.error("Error fetching categories:", catError);
      return [];
    }

    // Count posts per category from both sources
    const categoryCounts = new Map<string, number>();

    // 1. Count Supabase posts
    const { data: supabasePosts, error: postsError } = await supabase
      .from("blog_posts")
      .select("category_id")
      .eq("published", true);

    if (postsError) {
      console.error("Error fetching Supabase posts:", postsError);
    } else {
      supabasePosts?.forEach((post: any) => {
        if (post.category_id) {
          categoryCounts.set(post.category_id, (categoryCounts.get(post.category_id) || 0) + 1);
        }
      });
    }


    return (allCategories || []).map((cat: any) => ({
      id: cat.id,
      title: cat.title,
      slug: cat.slug,
      count: categoryCounts.get(cat.id) || 0,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function SidebarMinimal() {
  const categories = await getCategories();
  const visibleCategories = (categories || []).filter((c: any) => (c?.count || 0) > 0).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Quick Links */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-google-sans">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start h-10 text-sm font-google-sans" asChild>
            <Link href="/free-courses">
              <ArrowRight className="mr-2 h-4 w-4" />
              Free Courses
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start h-10 text-sm font-google-sans" asChild>
            <Link href="/reviews">
              <ArrowRight className="mr-2 h-4 w-4" />
              Reviews
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start h-10 text-sm font-google-sans" asChild>
            <Link href="/newsletter">
              <ArrowRight className="mr-2 h-4 w-4" />
              Newsletter
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Categories */}
      {visibleCategories.length > 0 && (
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-google-sans">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {visibleCategories.map((cat: any) => (
                <Link
                  key={cat.id || cat._id}
                  href={`/blog/category/${cat.slug || cat.slug?.current}`}
                  className="flex items-center justify-between py-2 text-sm hover:text-primary cursor-pointer group transition-colors"
                >
                  <span className="font-medium font-google-sans">{cat.title}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
