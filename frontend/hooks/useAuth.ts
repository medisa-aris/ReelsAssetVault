"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/lib/api";
import type { TokenResponse, User } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<User>("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => Cookies.remove("token"))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<TokenResponse>("/auth/login", { email, password });
      Cookies.set("token", res.data.access_token, { expires: 1 });
      setUser(res.data.user);
      router.push("/");
    },
    [router]
  );

  const register = useCallback(
    async (email: string, password: string, full_name: string) => {
      const res = await api.post<TokenResponse>("/auth/register", { email, password, full_name });
      Cookies.set("token", res.data.access_token, { expires: 1 });
      setUser(res.data.user);
      router.push("/");
    },
    [router]
  );

  const logout = useCallback(() => {
    Cookies.remove("token");
    setUser(null);
    router.push("/login");
  }, [router]);

  return { user, loading, login, register, logout };
}
