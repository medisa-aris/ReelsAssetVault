"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import AIGeneratorForm, { type AIGeneratorFormData } from "@/components/AIGeneratorForm";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Ideation, IdeationListResponse } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface GenerateResponse {
  items: Ideation[];
  count: number;
}

export default function GenerateIdeationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<Ideation[] | null>(null);

  const handleSubmit = async (data: AIGeneratorFormData) => {
    setLoading(true);
    try {
      const res = await api.post<GenerateResponse>("/ideations/generate", data);
      setGenerated(res.data.items);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/script/ideation" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Ideation
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="cds--type-productive-heading-04">Generate 7-Day Plan</h1>
        </div>

        {/* Info banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 text-sm text-purple-700">
          <strong>AI Content Planner</strong> — Fill in your content parameters and we&apos;ll generate 7 content ideas
          using the active AI provider. Make sure Admin → AI Config has an active provider before generating.
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <AIGeneratorForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Generated results */}
        {generated && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Generated {generated.length} ideas
              </h2>
              <Link
                href="/script/ideation"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all ideations →
              </Link>
            </div>

            <div className="space-y-3">
              {generated.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link
                          href={`/script/ideation/${item.id}`}
                          className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {item.title}
                        </Link>
                        <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">AI</span>
                      </div>
                      {item.hook && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.hook}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {item.platform && <span>{item.platform}</span>}
                        {item.upload_date && <span>📅 {formatDate(item.upload_date)}</span>}
                        {item.upload_time && <span>🕐 {item.upload_time}</span>}
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageLayout>
    </>
  );
}
