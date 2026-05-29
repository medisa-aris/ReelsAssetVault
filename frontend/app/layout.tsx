import type { Metadata } from "next";
// IBM Carbon Design System — White theme (prebuilt CSS, avoids SCSS/webpack issues in App Router)
import "@carbon/styles/css/styles.css";
import "./carbon-overrides.css";
import { NotificationProvider } from "@/components/NotificationProvider";

export const metadata: Metadata = {
  title: "ReelsAssetVault",
  description: "Digital asset management for short-form video",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="cds--white">
      <body className="cds--white" style={{ backgroundColor: "#f4f4f4", minHeight: "100vh" }}>
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  );
}
