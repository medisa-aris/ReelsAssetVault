"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

interface NavDropdownProps {
  label: string;
  active: boolean;
  children: React.ReactNode;
  labelColor?: string;
}

function NavDropdown({ label, active, children, labelColor }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const defaultColor = active ? "text-indigo-600" : "text-gray-600 hover:text-gray-900";
  const colorClass = labelColor ?? defaultColor;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded transition-colors hover:bg-gray-50 ${colorClass}`}
      >
        {label}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownLinkProps {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  pathname: string | null;
}

function DropdownLink({ href, onClick, icon, children, pathname }: DropdownLinkProps) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${
        active ? "text-indigo-600 font-medium" : "text-gray-700"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

export default function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAdmin = user?.roles?.includes("admin") ?? false;

  const VideoIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125" />
    </svg>
  );

  const UploadIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );

  const IdeationIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );

  const ScriptIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );

  const GenerateIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );

  const AdminIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center" ref={navRef}>
      {/* Left: logo + nav items */}
      <div className="flex items-center gap-2">
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight mr-4">
          ReelsAssetVault
        </Link>

        {/* Video dropdown */}
        <NavDropdown label="Video" active={!!pathname?.startsWith("/video")}>
          <DropdownLink href="/video/upload" onClick={() => setOpenMenu(null)} icon={UploadIcon} pathname={pathname}>
            Upload
          </DropdownLink>
          <DropdownLink href="/video" onClick={() => setOpenMenu(null)} icon={VideoIcon} pathname={pathname}>
            List Video
          </DropdownLink>
        </NavDropdown>

        {/* Script dropdown */}
        <NavDropdown label="Script" active={!!pathname?.startsWith("/script")}>
           <DropdownLink href="/script/ideation/generate" onClick={() => setOpenMenu(null)} icon={GenerateIcon} pathname={pathname}>
            Generate Plan
          </DropdownLink>
          <DropdownLink href="/script/ideation" onClick={() => setOpenMenu(null)} icon={IdeationIcon} pathname={pathname}>
            Ideation
          </DropdownLink>
          <DropdownLink href="/script/scripts" onClick={() => setOpenMenu(null)} icon={ScriptIcon} pathname={pathname}>
            Scripts
          </DropdownLink>
        </NavDropdown>

        {/* Admin dropdown — only for admin users */}
        {isAdmin && (
          <NavDropdown
            label="Admin"
            active={!!pathname?.startsWith("/admin")}
            labelColor={pathname?.startsWith("/admin") ? "text-[#b85c38]" : "text-[#b85c38] hover:text-[#8f3f20]"}
          >
            <DropdownLink href="/admin/ai-config" onClick={() => setOpenMenu(null)} icon={AdminIcon} pathname={pathname}>
              AI Config
            </DropdownLink>
          </NavDropdown>
        )}
      </div>

      {/* Right: user info + logout */}
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.full_name}</span>
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium">
            {user.roles[0] ?? "viewer"}
          </span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
