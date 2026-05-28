"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { api } from "@/lib/api";
import { Asset, Ideation, Script } from "@/lib/types";
import { storageUrl } from "@/lib/utils";
import AssetPickerModal from "@/components/AssetPickerModal";
import IdeationPickerModal from "@/components/IdeationPickerModal";
import ScriptPickerModal from "@/components/ScriptPickerModal";

export default function CreateSchedulePage() {
  const router = useRouter();

  // Picker modals
  const [assetModal, setAssetModal] = useState(false);
  const [ideationModal, setIdeationModal] = useState(false);
  const [scriptModal, setScriptModal] = useState(false);

  // Selected items
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIdeation, setSelectedIdeation] = useState<Ideation | null>(null);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);

  // Form fields
  const todayStr = new Date().toISOString().split("T")[0];
  const [scheduledDate, setScheduledDate] = useState(todayStr);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectScript = (script: Script) => {
    setSelectedScript(script);
    // Auto-fill caption and hashtags from script
    if (script.caption_suggestion) setCaption(script.caption_suggestion);
    if (script.hashtags) setHashtags(script.hashtags);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.post("/production/schedules", {
        asset_id: selectedAsset?.id ?? null,
        ideation_id: selectedIdeation?.id ?? null,
        script_id: selectedScript?.id ?? null,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        caption: caption || null,
        hashtags: hashtags || null,
        notes: notes || null,
      });
      router.push(`/production/schedule/${res.data.id}`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to create schedule");
      setSaving(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/production/schedule" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Publish Schedule</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-6">

        {/* Asset picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Asset (optional)</label>
          <div className="flex items-center gap-3">
            {selectedAsset ? (
              <div className="flex items-center gap-3 flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                {selectedAsset.thumbnail_url && (
                  <img
                    src={storageUrl(selectedAsset.thumbnail_url) ?? ""}
                    alt={selectedAsset.title}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <span className="text-sm text-gray-900 flex-1">{selectedAsset.title}</span>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-gray-400 hover:text-red-500 text-lg leading-none"
                >
                  &times;
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAssetModal(true)}
                className="px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                + Pick Asset
              </button>
            )}
          </div>
        </div>

        {/* Ideation picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ideation (optional)</label>
          {selectedIdeation ? (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-900 flex-1">{selectedIdeation.title}</span>
              <button
                onClick={() => setSelectedIdeation(null)}
                className="text-gray-400 hover:text-red-500 text-lg leading-none"
              >
                &times;
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIdeationModal(true)}
              className="px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              + Pick Ideation
            </button>
          )}
        </div>

        {/* Script picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Script (optional — auto-fills caption & hashtags)
          </label>
          {selectedScript ? (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-900 flex-1">{selectedScript.title}</span>
              <button
                onClick={() => setSelectedScript(null)}
                className="text-gray-400 hover:text-red-500 text-lg leading-none"
              >
                &times;
              </button>
            </div>
          ) : (
            <button
              onClick={() => setScriptModal(true)}
              className="px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              + Pick Script
            </button>
          )}
        </div>

        {/* Date / Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={scheduledDate}
              min={todayStr}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="Write your post caption..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Hashtags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags</label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#reels #content #socialmedia"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Internal notes..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <Link
            href="/production/schedule"
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !scheduledDate}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save as Draft"}
          </button>
        </div>
      </div>

      {/* Modals */}
      <AssetPickerModal open={assetModal} onSelect={setSelectedAsset} onClose={() => setAssetModal(false)} />
      <IdeationPickerModal open={ideationModal} onSelect={setSelectedIdeation} onClose={() => setIdeationModal(false)} />
      <ScriptPickerModal open={scriptModal} onSelect={handleSelectScript} onClose={() => setScriptModal(false)} />
    </div>
    </>
  );
}

