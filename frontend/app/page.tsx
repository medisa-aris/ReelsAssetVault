"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@carbon/react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="max">
        <div className="py-8 text-center">
          <h2 className="cds--type-productive-heading-04">
            Welcome, {user.full_name}!
          </h2>
          <p className="mt-3 text-gray-500 text-base">
            ReelsAssetVault is your central library for short-form video assets.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button kind="primary" onClick={() => router.push("/video")}>
              Browse Library
            </Button>
            <Button kind="secondary" onClick={() => router.push("/video/upload")}>
              Upload Video
            </Button>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
