"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import IdeationForm, { type IdeationFormData } from "@/components/IdeationForm";
import { api } from "@/lib/api";
import type { Ideation } from "@/lib/types";

export default function CreateIdeationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: IdeationFormData) => {
    setSaving(true);
    try {
      const res = await api.post<Ideation>("/ideations", data);
      router.push(`/script/ideation/${res.data.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/script/ideation"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Ideation
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="cds--type-productive-heading-04">Create Ideation</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <IdeationForm onSubmit={handleSubmit} submitLabel="Create Ideation" loading={saving} />
        </div>
      </PageLayout>
    </>
  );
}
