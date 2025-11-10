import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function HotelsList() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <Sidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 w-full">
          {/* Page Header */}
          <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] text-[#121926] font-medium leading-6 tracking-normal">
                Hotels List
              </h1>
            </div>
          </header>

          {/* Main Content - Empty for now */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 text-lg">Hotels list content will be added here</p>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
