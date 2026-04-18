import React from "react";
import { CompleteSidebar } from "./sidebar-complete";
import { Header } from "./header";

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
        <Header />
        <main className="flex-1 bg-gray-50 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
