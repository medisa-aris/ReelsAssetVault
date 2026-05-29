import type { Metadata } from "next";
// IBM Carbon Design System — White theme (prebuilt CSS, avoids SCSS/webpack issues in App Router)
import "@carbon/styles/css/styles.css";
import { NotificationProvider } from "@/components/NotificationProvider";

export const metadata: Metadata = {
  title: "ReelsAssetVault",
  description: "Digital asset management for short-form video",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  );
}
