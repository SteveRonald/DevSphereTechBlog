"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CourseCertificatePageClient } from "./CertificatePageClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CourseCertificatePageWrapper({ params }: PageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const getSlug = async () => {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    };
    getSlug();
  }, [params]);

  useEffect(() => {
    if (!loading && !user && slug) {
      const redirect = searchParams.get("redirect") || `/courses/${slug}/certificate`;
      router.push(`/auth?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [user, loading, router, searchParams, slug]);

  if (loading || !slug) {
    return (
      <div className="container max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return <CourseCertificatePageClient slug={slug} user={user} />;
}
