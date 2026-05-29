"use client";

import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenu,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
} from "@carbon/react";
import { Logout } from "@carbon/icons-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const { user, logout } = useAuth();
  const isAdmin = user?.roles?.includes("admin") ?? false;

  return (
    // data-carbon-theme="g100" applies the dark (Gray 100) shell theme
    // giving the header the dark #161616 background used in enterprise apps
    <Header aria-label="ReelsAssetVault" data-carbon-theme="g100">
      <SkipToContent />
      <HeaderName href="/" prefix="">
        ReelsAssetVault
      </HeaderName>

      <HeaderNavigation aria-label="Main navigation">
        {/* Video */}
        <HeaderMenu aria-label="Video" menuLinkName="Video">
          <HeaderMenuItem href="/video">List Video</HeaderMenuItem>
          <HeaderMenuItem href="/video/upload">Upload</HeaderMenuItem>
        </HeaderMenu>

        {/* Script */}
        <HeaderMenu aria-label="Script" menuLinkName="Script">
          <HeaderMenuItem href="/script/ideation/generate">Generate Plan</HeaderMenuItem>
          <HeaderMenuItem href="/script/ideation">Ideation</HeaderMenuItem>
          <HeaderMenuItem href="/script/scripts">Scripts</HeaderMenuItem>
        </HeaderMenu>

        {/* Production */}
        <HeaderMenu aria-label="Production" menuLinkName="Production">
          <HeaderMenuItem href="/production/schedule">Publish Schedule</HeaderMenuItem>
        </HeaderMenu>

        {/* Admin — only for admin role */}
        {isAdmin && (
          <HeaderMenu aria-label="Admin" menuLinkName="Admin">
            <HeaderMenuItem href="/admin/ai-config">AI Config</HeaderMenuItem>
          </HeaderMenu>
        )}
      </HeaderNavigation>

      <HeaderGlobalBar>
        {user && (
          <>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 1rem",
                fontSize: "0.875rem",
                color: "#c6c6c6",
                whiteSpace: "nowrap",
              }}
            >
              {user.full_name}
            </span>
            <HeaderGlobalAction
              aria-label="Logout"
              onClick={() => logout()}
              tooltipAlignment="end"
            >
              <Logout size={20} />
            </HeaderGlobalAction>
          </>
        )}
      </HeaderGlobalBar>
    </Header>
  );
}
