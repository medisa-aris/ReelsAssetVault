"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">ReelsAssetVault</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.full_name}</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
            {user.roles.join(", ")}
          </span>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto p-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Welcome, {user.full_name}!
        </h2>
        <p className="mt-2 text-gray-500">
          Your asset library is empty. Upload your first video to get started.
        </p>
      </main>
    </div>
  );
}
