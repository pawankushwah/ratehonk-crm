import React from "react";
import { CompleteSidebar } from "./sidebar-complete";

interface LayoutProps {
  children: React.ReactNode;
  initialSidebarCollapsed?: boolean;
}

export function Layout({ children, initialSidebarCollapsed = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <CompleteSidebar initialCollapsed={initialSidebarCollapsed} />
      <div
        className="main-content-wrapper flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: "4rem" }}
      >
        <main className="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
