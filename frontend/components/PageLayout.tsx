import type { ReactNode } from "react";

type MaxWidth = "sm" | "md" | "lg" | "max";

const WIDTH_MAP: Record<MaxWidth, string> = {
  sm: "32rem",
  md: "48rem",
  lg: "64rem",
  max: "90rem",
};

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: MaxWidth;
  /** Extra top padding override (default accounts for fixed Carbon Header) */
  topPadding?: string;
}

/**
 * Replaces all `<main className="max-w-*xl mx-auto px-6 py-8">` patterns.
 * Adds 5rem top padding to account for Carbon's fixed 3rem Header.
 */
export function PageLayout({
  children,
  maxWidth = "max",
  topPadding = "5rem",
}: PageLayoutProps) {
  return (
    <main
      style={{
        maxWidth: WIDTH_MAP[maxWidth],
        margin: "0 auto",
        padding: `${topPadding} 1.5rem 2rem`,
      }}
    >
      {children}
    </main>
  );
}
